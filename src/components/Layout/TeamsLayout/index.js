import { Input } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./TeamsLayout.module.scss";
import ProfileUsers from "./ProfileUsers";
import ButtonTeams from "./ButtonTeams";
const cx = classNames.bind(styles);
function TeamsLayout() {
  return (
    <div className={cx("container-fluid")}>
      <div className={cx("header-content")}>
        <div className={cx("title")}>
          <h2>Teams</h2>
        </div>
        <ButtonTeams />
      </div>
      <div className={cx("search-input")}>
        {" "}
        <Input
          size="large"
          placeholder="Search Teams"
          prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
        />
      </div>
      <div className={cx("container")}>
        <h2>People you work with</h2>
        <div className={cx("people-work")}>
          <ProfileUsers />
        </div>
        <div className={cx("us-teams")}>
          <h2>Teams</h2>
        </div>
      </div>
    </div>
  );
}

export default TeamsLayout;
