import User from "~/components/User";
import MenuDirectory from "~/components/Layout/MenuDirectory";
import classNames from "classnames/bind";
import styles from "./Directory.module.scss";
const cx = classNames.bind(styles);
function Directory() {
  return (
    <div className={cx("container")}>
      <MenuDirectory children={<User />} />
    </div>
  );
}

export default Directory;
