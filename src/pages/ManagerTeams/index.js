import MenuDirectory from "~/components/Layout/MenuDirectory";
import classNames from "classnames/bind";
import styles from "./ManagerTeams.module.scss";
const cx = classNames.bind(styles);
function ManagerTeams() {
  return (
    <div className={cx("container")}>
      <MenuDirectory children={<div>content</div>} />
    </div>
  );
}

export default ManagerTeams;
