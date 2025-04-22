import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquareCaretUp, faGear } from "@fortawesome/free-solid-svg-icons";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import { Input, Tooltip, Button } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import classNames from "classnames/bind";
import styles from "./HeaderNavbar.module.scss";
// import Aurora from "./Aurora";
const cx = classNames.bind(styles);
function HeaderNavbar() {
  const { currentUser } = useAuth();
  const textEmail = <span>{currentUser?.email}</span>;
  return (
    <div className={cx("Navbar")}>
      <div className={cx("left-nav")}>
        <button className={cx("btn-collapse")}>
          <FontAwesomeIcon icon={faSquareCaretUp} />
        </button>
        <div className={cx("icon")}>
          <img src="/assets/images/logo-techtrack.png" alt="icon" />
          <p>TechTrack</p>
        </div>
      </div>
      <div className={cx("mid-nav")}>
        <Input
          className={cx("input-search")}
          placeholder="Search"
          prefix={<SearchOutlined />}
        />
        <Button type="primary" icon={<PlusOutlined />}>
          Create
        </Button>
      </div>
      <div className={cx("right-nav")}>
        <div className={cx("notification", "right")}>
          {" "}
          <Tooltip placement="bottom" title={"Notifications"}>
            <FontAwesomeIcon icon={faBell} />
          </Tooltip>
        </div>
        <div className={cx("setting", "right")}>
          <Tooltip placement="bottom" title={"Setting"}>
            <FontAwesomeIcon icon={faGear} />
          </Tooltip>
        </div>
        <Tooltip placement="bottom" title={textEmail}>
          <img
            src={currentUser.photoURL}
            alt="Ảnh đại diện"
            className={cx("avatar")}
          />
        </Tooltip>
      </div>
    </div>
  );
}
export default HeaderNavbar;
