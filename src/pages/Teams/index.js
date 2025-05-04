import TeamsLayout from "~/components/Layout/TeamsLayout";
import classNames from "classnames/bind";
import styles from "./Teams.module.scss";
const cx = classNames.bind(styles);
function Teams() {
  return (
    <div className={cx("container-fluid")}>
      <TeamsLayout />
    </div>
  );
}

export default Teams;
