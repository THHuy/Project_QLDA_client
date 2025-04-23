import classNames from "classnames/bind";
import styles from "./Teams.module.scss";
const cx = classNames.bind(styles);
function Teams() {
  return (
    <div className={cx("container-fluid")}>
      <h2>Teams Pages</h2>
    </div>
  );
}

export default Teams;
