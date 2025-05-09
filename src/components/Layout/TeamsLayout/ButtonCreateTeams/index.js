import {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Modal, Input, Select, Button, Tooltip, message } from "antd";
import { UserOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import classNames from "classnames/bind";
import styles from "./ButtonCreateTeams.module.scss";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "~/components/services/firebase";
import { useAuth } from "~/components/hook/useAuth/useAuth";

const cx = classNames.bind(styles);

const ButtonCreateTeams = forwardRef(({ userRole }, ref) => {
  const { currentUser } = useAuth();
  const productId = localStorage.getItem(`selectedProduct-${currentUser?.uid}`);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    openModal: () => {
      if (userRole !== "Admin" && userRole !== "Team Lead") {
        message.warning("Only Admin or Team Lead can create a team");
        return;
      }
      setIsModalOpen(true);
    },
  }));

  useEffect(() => {
    const fetchUsers = async () => {
      if (!productId || !currentUser) return;
      try {
        const teamMembersQuery = query(
          collection(db, "product_members"),
          where("product_id", "==", productId)
        );
        const snapshot = await getDocs(teamMembersQuery);
        if (snapshot.empty) {
          setAllUsers([]);
          return;
        }
        const userIds = snapshot.docs.map((doc) => doc.data().user_id);
        const userPromises = userIds.map(async (userId) => {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              id: userId,
              name: userData.displayName || "User",
              photoURL: userData.photoURL || null,
              email: userData.email || null,
            };
          }
          return null;
        });
        const results = (await Promise.all(userPromises)).filter(Boolean);
        setAllUsers(results);
      } catch (error) {
        console.error("Error fetching user list:", error);
        message.error("Unable to fetch user list");
      }
    };
    if (isModalOpen) {
      fetchUsers();
    }
  }, [productId, currentUser, isModalOpen]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(
      (user) => !selectedUsers.some((selected) => selected.id === user.id)
    );
  }, [allUsers, selectedUsers]);

  const showModal = () => {
    if (userRole !== "Admin" && userRole !== "Team Lead") {
      message.warning("Only Admin or Team Lead can create a team");
      return;
    }
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    if (!teamName.trim()) {
      message.warning("Please enter a team name");
      return;
    }
    if (selectedUsers.length === 0) {
      message.warning("Please select at least one team member");
      return;
    }
    setLoading(true);
    try {
      const teamData = {
        team_name: teamName.trim(),
        product_id: productId,
        created_at: serverTimestamp(),
        created_by: currentUser.uid,
        creator_role: userRole,
      };
      const batch = writeBatch(db);
      const teamRef = await addDoc(collection(db, "teams"), teamData);
      const teamId = teamRef.id;
      selectedUsers.forEach((user) => {
        const memberDocId = `${teamId}_${user.id}`;
        const memberRef = doc(db, "team_members", memberDocId);
        batch.set(memberRef, {
          team_id: teamId,
          user_id: user.id,
          role_in_team: "Member",
          joined_at: serverTimestamp(),
        });
      });
      await batch.commit();
      message.success("Team created successfully!");
      handleCancel();
    } catch (error) {
      console.error("Error creating team:", error);
      message.error(`Unable to create team: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTeamName("");
    setSelectedUsers([]);
    setIsModalOpen(false);
  };

  const handleUserSelect = (value, option) => {
    const selectedUser = allUsers.find((user) => user.id === option.key);
    if (selectedUser) {
      setSelectedUsers((prev) => [...prev, selectedUser]);
    }
  };

  const handleUserRemove = (userId) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const isFormValid = teamName.trim() && selectedUsers.length > 0;

  return (
    <div className={cx("container-fluid")}>
      <button className={cx("btn-create-team")} onClick={showModal}>
        Create Team
      </button>

      <Modal
        title="Create New Team"
        open={isModalOpen}
        onCancel={handleCancel}
        confirmLoading={loading}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleOk}
            disabled={!isFormValid}
            loading={loading}
          >
            Create Team
          </Button>,
        ]}
        width={600}
      >
        <div className={cx("modal-description")}>
          Bring people together in a team so you can @mention, filter, and
          assign tasks.
          <a href="/" className={cx("help-link")}>
            What is a team?
          </a>
        </div>

        <p className={cx("required-note")}>
          Required fields are marked with an asterisk (*)
        </p>

        <div className={cx("form-field")}>
          <label htmlFor="team-name" className={cx("field-label")}>
            Team Name <span className={cx("required")}>*</span>
          </label>
          <Input
            id="team-name"
            placeholder="E.g., HR Team, Redesign Project, Mango Team"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className={cx("input-field")}
            maxLength={50}
          />
        </div>

        <div className={cx("form-field")}>
          <label className={cx("field-label", "with-tooltip")}>
            Who can view your team?
            <Tooltip title="Control team visibility permissions">
              <QuestionCircleOutlined className={cx("tooltip-icon")} />
            </Tooltip>
          </label>
        </div>

        <div className={cx("form-field")}>
          <label htmlFor="team-members" className={cx("field-label")}>
            Who should be in this team?{" "}
            <span className={cx("required")}>*</span>
          </label>

          <div className={cx("selected-users")}>
            {selectedUsers.map((user) => (
              <div key={user.id} className={cx("selected-user-tag")}>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className={cx("user-avatar-img")}
                  />
                ) : (
                  <span className={cx("user-avatar")}>
                    <UserOutlined />
                  </span>
                )}
                {user.name}
                <span
                  className={cx("remove-tag")}
                  onClick={() => handleUserRemove(user.id)}
                  aria-label={`Remove ${user.name}`}
                >
                  ×
                </span>
              </div>
            ))}
          </div>

          <Select
            id="team-members"
            showSearch
            placeholder="Select users"
            style={{ width: "100%" }}
            onSelect={handleUserSelect}
            optionFilterProp="children"
            notFoundContent="No matching users found"
            className={cx("user-select")}
            disabled={loading}
          >
            {filteredUsers.map((user) => (
              <Select.Option key={user.id} value={user.name}>
                <div className={cx("user-option")}>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.name}
                      className={cx("user-option-avatar")}
                    />
                  ) : (
                    <UserOutlined className={cx("user-option-icon")} />
                  )}
                  <span>{user.name}</span>
                  {user.email && (
                    <span className={cx("user-email")}>({user.email})</span>
                  )}
                </div>
              </Select.Option>
            ))}
          </Select>

          <div className={cx("helper-text")}>
            You can invite up to 50 people at once.
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default ButtonCreateTeams;
