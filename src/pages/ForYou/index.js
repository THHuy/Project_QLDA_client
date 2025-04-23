import classNames from "classnames/bind";
import styles from "./ForYou.module.scss";
const cx = classNames.bind(styles);
function YourWork() {
  return (
    <div className={cx("container-fluid")}>
      <h2>For You Pages</h2>
    </div>
  );
}

export default YourWork;
