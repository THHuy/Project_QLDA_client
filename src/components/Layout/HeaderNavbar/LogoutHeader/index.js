import { useAuth } from "~/components/hook/useAuth/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./LogoutHeader.module.scss";
const cx = classNames.bind(styles);
function LogoutHeader() {
  const { currentUser, logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Đăng xuất thất bại:", error);
    }
  };
  return (
    <div className={cx("container-fluid")}>
      <div className={cx("info-user")}>
        <img
          src={currentUser.photoURL}
          alt="Ảnh đại diện"
          className={cx("avatar")}
        />
        <div className={cx("info-basic")}>
          <p className={cx("name-user")}>{currentUser.displayName}</p>
          <p className={cx("email-user")}>{currentUser.email}</p>
        </div>
      </div>
      <div className={cx("profile-logout")}>
        {" "}
        <div className={cx("btn-profile")}>
          <div className={cx("icon-btn")}>
            <FontAwesomeIcon icon={faUser} />
          </div>
          <button>Profile</button>
        </div>
        <div className={cx("btn-logout")}>
          <div className={cx("icon-btn")}>
            <FontAwesomeIcon icon={faRightFromBracket} />
          </div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
}

export default LogoutHeader;
