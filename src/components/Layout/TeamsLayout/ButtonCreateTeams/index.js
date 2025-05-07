import { useState } from "react";
import { Modal, Input, Select } from "antd";
import classNames from "classnames/bind";
import styles from "./ButtonCreateTeams.module.scss";
const cx = classNames.bind(styles);
function ButtonCreateTeams() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const OPTIONS = ["Apples", "Nails", "Bananas", "Helicopters"];
  const filteredOptions = OPTIONS.filter((o) => !selectedItems.includes(o));
  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <div className={cx("container-fluid")}>
      {" "}
      <button className={cx("btn-w")} onClick={showModal}>
        Create team
      </button>
      <Modal
        title="Create a Team"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p>Required fields are marked with an asterisk*</p>
        <h3>Team name*</h3>
        <Input placeholder="e.g HR Team, Redesign Project, Team Banana" />
        <h3>Who should be in this team?*</h3>
        <Select
          mode="multiple"
          placeholder="Inserted are removed"
          value={selectedItems}
          onChange={setSelectedItems}
          style={{ width: "100%" }}
          options={filteredOptions.map((item) => ({
            value: item,
            label: item,
          }))}
        />
      </Modal>
    </div>
  );
}

export default ButtonCreateTeams;
