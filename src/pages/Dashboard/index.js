import classNames from "classnames/bind";
import styles from "./Dashboard.scss";
// import Aurora from "./Aurora";
const cx = classNames.bind(styles);
export function Dashboard() {
  return (
    <div className={cx("dashboard")}>
      <div>Dashboard Pages</div>
    </div>
  );
}
