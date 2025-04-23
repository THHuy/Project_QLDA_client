import classNames from "classnames/bind";
import styles from "./Projects.module.scss";
const cx = classNames.bind(styles);
function Projects() {
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
      </div>
      <div className={cx("content-project")}>
        <h1>CONTENT</h1>
      </div>
    </div>
  );
}

export default Projects;
