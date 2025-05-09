import { useState, useEffect, useCallback } from "react";
import {
  query,
  where,
  getDocs,
  collection,
  doc,
  getDoc,
} from "firebase/firestore";
import { Breadcrumb } from "antd";
import { Button, Input, Table, Tag, Popover } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { db } from "~/components/services/firebase";
import styles from "./User.module.scss";
import { getUserProduct } from "~/utils/productStorage";
import classNames from "classnames/bind";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import ActionUser from "./ActionUser";
const cx = classNames.bind(styles);
function User() {
  const [data, setData] = useState([]);
  const { currentUser } = useAuth(); // currentUser.uid
  const [searchText, setSearchText] = useState("");
  const [openPopoverKey, setOpenPopoverKey] = useState(null);
  const handleOpenChange = (key, newOpen) => {
    setOpenPopoverKey(newOpen ? key : null);
  };

  const fetchUsers = useCallback(async () => {
    const productId = getUserProduct(currentUser.uid);
    if (!productId) return;
    const q = query(
      collection(db, "product_members"),
      where("product_id", "==", productId)
    );
    const querySnapshot = await getDocs(q);
    const users = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const d = docSnap.data();
        let displayName = d.user_id;
        let email = "";
        try {
          const userDoc = await getDoc(doc(db, "users", d.user_id));
          if (userDoc.exists()) {
            displayName = userDoc.data().displayName || d.user_id;
            email = userDoc.data().email || "";
          }
        } catch (e) {}
        return {
          key: docSnap.id,
          name: displayName,
          email: email,
          tags: [d.status],
          role: d.role_in_product ? [d.role_in_product] : [],
        };
      })
    );
    setData(users);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) fetchUsers();
  }, [currentUser, fetchUsers]);
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <p>{text}</p>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => <p>{text}</p>,
    },
    {
      title: "Status",
      key: "tags",
      dataIndex: "tags",
      filters: data.length
        ? [
            { text: "Active", value: "Active" },
            { text: "Inactive", value: "Inactive" },
          ]
        : [],
      onFilter: (value, record) => record.tags.includes(value),
      render: (_, { tags }) => (
        <>
          {tags.map((tag) => {
            let color = tag === "Active" ? "green" : "volcano";
            return (
              <Tag color={color} key={tag}>
                {tag.toUpperCase()}
              </Tag>
            );
          })}
        </>
      ),
    },
    {
      title: "Role",
      key: "role",
      dataIndex: "role",
      filters: data.length
        ? [
            { text: "Admin", value: "Admin" },
            { text: "Developer", value: "Developer" },
            { text: "Project Manager", value: "Project Manager" },
            { text: "System Deployment", value: "System Deployment" },
            { text: "Team Lead", value: "Team Lead" },
            { text: "Member", value: "member" },
          ]
        : [],
      onFilter: (value, record) => record.role.includes(value),
      render: (_, { role }) => (
        <>
          {role.map((tag) => {
            let color = tag === "Admin" ? "#f50" : "orange";
            if (tag === "Developer") {
              color = "geekblue";
            } else if (tag === "Project Manager") {
              color = "purple";
            } else if (tag === "System Deployment") {
              color = "cyan";
            } else if (tag === "Team Lead") {
              color = "magenta";
            }
            return (
              <Tag color={color} key={tag}>
                {tag.toUpperCase()}
              </Tag>
            );
          })}
        </>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popover
          content={
            <ActionUser
              userId={record.email}
              memberId={record.key}
              role={record.role}
              status={record.tags && record.tags[0]}
              onAction={async (action) => {
                if (
                  action === "suspend" ||
                  action === "delete" ||
                  action === "restore" ||
                  action === "changeRole"
                ) {
                  // Refetch users after suspend, restore, delete, or changeRole
                  if (currentUser) await fetchUsers();
                }
              }}
            />
          }
          title="Action"
          trigger="click"
          open={openPopoverKey === record.key}
          onOpenChange={(newOpen) => handleOpenChange(record.key, newOpen)}
        >
          <button className={cx("btn-action")}>
            <FontAwesomeIcon icon={faEllipsis} />
          </button>
        </Popover>
      ),
    },
  ];
  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.email.toLowerCase().includes(searchText.toLowerCase())
  );
  return (
    <div className={cx("container")}>
      <Breadcrumb
        items={[
          {
            title: "Admin",
            href: "",
          },
          {
            title: "nameProduct",
            href: "",
          },
        ]}
        params={{ id: 1 }}
      />
      <div className={cx("content")}>
        <div className={cx("title")}>
          <h1>User</h1>
          <div className={cx("action")}>
            <Button type="primary">Invite User</Button>
          </div>
        </div>
        <div className={cx("search")}>
          <Input
            style={{ width: "20%" }}
            placeholder="Enter public name or email address"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className={cx("table")}>
          <Table columns={columns} dataSource={filteredData} bordered />
        </div>
      </div>
    </div>
  );
}

export default User;
