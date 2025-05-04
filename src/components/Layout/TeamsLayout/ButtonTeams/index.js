import { Modal, Input } from "antd";
import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./ButtonTeams.module.scss";

const cx = classNames.bind(styles);

function ButtonTeams() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [input, setInput] = useState("");
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    // Here you could add logic to add selected users to a team
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setInput("");
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
        >
          <p>Names or emails</p>
          <Input
            placeholder="e.g., Huy, huy@company.com"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            className={cx("search-input")}
          />
        </Modal>
      </div>
    </div>
  );
}

export default ButtonTeams;
