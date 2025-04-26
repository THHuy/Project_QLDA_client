import classNames from "classnames/bind";
import styles from "./Projects.module.scss";
import LoginInput from "~/components/InputLogin";
import { SearchOutlined } from "@ant-design/icons";
import { useState } from "react";
import TableProject from "~/components/Table/TableProject";
const cx = classNames.bind(styles);
function Projects() {
  const [search, setSearch] = useState("");
  return (
    <div className={cx("container-fluid")}>
      <div className={cx("header-content")}>
        <div className={cx("title")}>
          <h1>Projects</h1>
          <div className={cx("btn-title")}>
            <button className={cx("btn-create")}>Create project</button>
            <button className={cx("btn-temp")}>Templates</button>
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
    </div>
  );
}

export default Projects;
