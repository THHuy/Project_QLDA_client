import { useAuth } from "~/components/hook/useAuth/useAuth";
import classNames from "classnames/bind";
import styles from "./ProfileUsers.module.scss";
const cx = classNames.bind(styles);
function ProfileUsers() {
  const { currentUser } = useAuth();
  return (
    <div className={cx("container-fluid")}>
      <div className={cx("users-profile")}>
        {currentUser?.photoURL && (
          <img
            src={currentUser.photoURL}
            alt="Ảnh đại diện"
            className={cx("avatar-profile")}
          />
        )}
        <h3>{currentUser?.displayName || "Người dùng"}</h3>
      </div>
    </div>
  );
}

export default ProfileUsers;
