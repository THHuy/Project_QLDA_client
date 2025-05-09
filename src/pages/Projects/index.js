import classNames from "classnames/bind";
import styles from "./Projects.module.scss";
import LoginInput from "~/components/InputLogin";
import { SearchOutlined } from "@ant-design/icons";
import { useState } from "react";
import TableProject from "~/components/Table/TableProject";
import CreateProject from "~/components/CreateProject";
const cx = classNames.bind(styles);
function Projects() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <div className={cx("container-fluid")}>
      <div className={cx("header-content")}>
        <div className={cx("title")}>
          <h1>Projects</h1>
          <div className={cx("btn-title")}>
            <button className={cx("btn-create")} onClick={showModal}>
              Create project
            </button>
          </div>
        </div>
        <div className={cx("search")}>
          <LoginInput
            type="text"
            icon={<SearchOutlined />}
            placeholder="Search Projects"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className={cx("content-project")}>
        <TableProject />
      </div>
      <CreateProject open={isModalOpen} onCancel={handleCancel} />
    </div>
  );
}

export default Projects;
