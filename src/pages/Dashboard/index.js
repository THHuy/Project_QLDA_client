import { useAuth } from "~/components/hook/useAuth/useAuth";
import classNames from "classnames/bind";
import styles from "./Dashboard.scss";
// import Aurora from "./Aurora";
const cx = classNames.bind(styles);
export function Dashboard() {
  const { currentUser, logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Đăng xuất thất bại:", error);
    }
  };

  return (
    <div className={cx("dashboard")}>
      <h1>Xin chào, {currentUser?.displayName || "Người dùng"}</h1>
      <div className={cx("user-profile")}>
        {currentUser?.photoURL && (
          <img
            src={currentUser.photoURL}
            alt="Ảnh đại diện"
            className={cx("avatar")}
          />
        )}
        <div className={cx("user-info")}>
          <p>Email: {currentUser?.email}</p>
          <p>ID: {currentUser?.uid}</p>
          <p>
            Đăng nhập qua: {currentUser?.profile?.provider || "Không xác định"}
          </p>

          {/* Hiển thị thông tin GitHub nếu đăng nhập bằng GitHub */}
          {currentUser?.profile?.provider === "github" &&
            currentUser?.profile?.githubUsername && (
              <p>GitHub Username: {currentUser.profile.githubUsername}</p>
            )}

          <p>
            Đăng nhập lần cuối:{" "}
            {currentUser?.profile?.lastLogin &&
              new Date(currentUser.profile.lastLogin).toLocaleString()}
          </p>
        </div>
      </div>
      <button onClick={handleLogout} className={cx("logout-btn")}>
        Đăng xuất
      </button>
    </div>
  );
}
