import classNames from "classnames/bind";
import styles from "./home.module.scss";
const cx = classNames.bind(styles);
function Home() {
  return (
    <div className={cx("container-fluid")}>
      <h2>Home Pages</h2>
    </div>
  );
}

export default Home;
