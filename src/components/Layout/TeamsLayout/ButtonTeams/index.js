import { Modal, Input, message, Tag } from "antd";
import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./ButtonTeams.module.scss";
import { db, functions } from "~/components/services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

const cx = classNames.bind(styles);

function ButtonTeams() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [input, setInput] = useState("");
  const [invitees, setInvitees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && input.trim()) {
      // Kiểm tra xem có phải là email hợp lệ không
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (emailRegex.test(input.trim())) {
        // Thêm email vào danh sách người được mời
        setInvitees([...invitees, input.trim()]);
        setInput("");
      } else {
        message.error("Vui lòng nhập email hợp lệ");
      }
    }
  };

  const removeInvitee = (email) => {
    setInvitees(invitees.filter((item) => item !== email));
  };

  const handleOk = async () => {
    if (invitees.length === 0) {
      message.warning("Vui lòng thêm ít nhất một email");
      return;
    }

    setIsLoading(true);

    try {
      // Gọi Cloud Function để gửi lời mời
      const sendInvitations = httpsCallable(functions, "sendTeamInvitations");

      // Lưu thông tin lời mời vào Firestore
      for (const email of invitees) {
        await addDoc(collection(db, "teamInvitations"), {
          email,
          teamId: "YOUR_TEAM_ID", // ID của team hiện tại
          status: "pending",
          createdAt: serverTimestamp(),
        });
      }

      // Gọi Cloud Function để gửi email
      await sendInvitations({ emails: invitees, teamId: "YOUR_TEAM_ID" });

      message.success(`Đã gửi lời mời cho ${invitees.length} người dùng`);
      setInvitees([]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi gửi lời mời:", error);
      message.error("Có lỗi xảy ra khi gửi lời mời");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setInput("");
    setInvitees([]);
  };

  return (
    <div className={cx("container-fluid")}>
      <div className={cx("btn-users")}>
        <button className={cx("btn-w")}>Manage users</button>
        <button className={cx("btn-w")}>Create team</button>
        <button className={cx("btn-add")} onClick={showModal}>
          Add people
        </button>
        <Modal
          title="Add people to TechTrack"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          okText="Send Invitations"
          confirmLoading={isLoading}
        >
          <p>Names or emails</p>
          <Input
            placeholder="e.g., huy@company.com"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className={cx("search-input")}
          />

          <div style={{ marginTop: 16 }}>
            {invitees.map((email) => (
              <Tag
                key={email}
                closable
                onClose={() => removeInvitee(email)}
                style={{ margin: "4px" }}
              >
                {email}
              </Tag>
            ))}
          </div>

          {invitees.length > 0 && (
            <p style={{ marginTop: 8 }}>
              {invitees.length} người sẽ nhận được lời mời qua email
            </p>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default ButtonTeams;
