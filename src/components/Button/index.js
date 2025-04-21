import { Button } from "antd";
import classNames from "classnames/bind";
import styles from "./Button.scss";

const cx = classNames.bind(styles);

function ButtonLogin({ children, logoBtn, onClick }) {
  return (
    <div>
      <Button className={cx("btn")} onClick={onClick}>
        {logoBtn ? (
          <img className={cx("logo-btn")} src={logoBtn} alt="button icon" />
        ) : null}
        {children}
      </Button>
    </div>
  );
}

export default ButtonLogin;
