import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import NavbarProject from "./NavbarProject";
import classNames from "classnames/bind";
import styles from "./ProjectID.module.scss";
const cx = classNames.bind(styles);
function ProjectID() {
  return (
    <div className={cx("container-fluid")}>
      <div className={cx("header-content")}>
        <a href="/projects">Projects</a>
        <div className={cx("title-project")}>
          <input placeholder="P" />
          <FontAwesomeIcon icon={faEllipsis} />
        </div>
      </div>
      <div className={cx("body-content")}>
        <NavbarProject />
      </div>
    </div>
  );
}

export default ProjectID;
