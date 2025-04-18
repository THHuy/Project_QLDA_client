import { Input } from "antd";
import { useState } from "react";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import classNames from "classnames/bind";
import styles from "./Input.scss";

const cx = classNames.bind(styles);

function LoginInput({
  type = "text",
  icon,
  placeholder,
  value,
  onChange,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={cx("login-input-container")}>
      <div className={cx("input-icon")}>{icon}</div>
      <Input
        type={type === "password" && showPassword ? "text" : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cx("custom-input")}
        suffix={
          type === "password" ? (
            <div
              onClick={togglePasswordVisibility}
              className={cx("password-icon")}
            >
              {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </div>
          ) : null
        }
        {...props}
      />
    </div>
  );
}

export default LoginInput;
