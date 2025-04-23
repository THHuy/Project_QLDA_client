import { Col, Row, Checkbox } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import LoginInput from "~/components/InputLogin";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import Button from "~/components/Button";
import classNames from "classnames/bind";
import styles from "./login.module.scss";
// import Aurora from "./Aurora";
const cx = classNames.bind(styles);
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { currentUser, loginWithGoogle, loginWithGithub } = useAuth();
  const [error, setError] = useState("");
  const handleGoogleLogin = async () => {
    try {
      setError("");
      await loginWithGoogle();
    } catch (error) {
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };
  const handleGithubLogin = async () => {
    try {
      setError("");
      await loginWithGithub();
    } catch (error) {
      setError("Đăng nhập GitHub thất bại. Vui lòng thử lại.");
    }
  };

  if (currentUser) {
    return <Navigate to="/projects" />;
  }
  return (
    <div className={cx("container-fluid")}>
      <Row>
        <Col span={13}>
          <div className={cx("img-box")}>
            <img
              className={cx("imgLogin")}
              src="/assets/images/img-login-page.png"
              alt="Img Login"
            />
          </div>
        </Col>
        <Col span={11}>
          {" "}
          <div className={cx("box-login")}>
            <div className={cx("login-container")}>
              <div className={cx("form-login")}>
                <div className={cx("title-login")}>
                  <div className={cx("box-title-header")}>Welcome to</div>
                  <div className={cx("box-title")}>TechTrack</div>
                </div>
                <div className={cx("logo-main")}>
                  <img
                    className={cx("img-logo-main")}
                    src={"/assets/images/logo-techtrack.png"}
                    alt="Logo"
                  />
                </div>
                <div className={cx("gr-button")}>
                  {" "}
                  {error && <p className="error">{error}</p>}
                  <div className={cx("btn-google")}>
                    {" "}
                    <Button
                      onClick={handleGoogleLogin}
                      children={"Login with Google"}
                      logoBtn={"/assets/images/logo-google.png"}
                    />
                  </div>
                  <div className={cx("btn-github")}>
                    <Button
                      onClick={handleGithubLogin}
                      children={"Login with Github"}
                      logoBtn={"/assets/images/logo-github.png"}
                    />
                  </div>
                </div>
                <div className={cx("separator")}>
                  <div className={cx("separator-line")}></div>
                  <span className={cx("space-dash")}>OR</span>
                  <div className={cx("separator-line")}></div>
                </div>
                <div className={cx("input-login-form")}>
                  {" "}
                  <LoginInput
                    type="email"
                    icon={<MailOutlined />}
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <LoginInput
                    type="password"
                    icon={<LockOutlined />}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className={cx("login-options")}>
                    <div className={cx("remember-me")}>
                      <Checkbox>Remember me</Checkbox>
                    </div>
                    <div className={cx("forgot-password")}>
                      <a href="/forgot-password">Forgot Password?</a>
                    </div>
                  </div>
                  <div className={cx("btn-login")}>
                    <Button children={"Login"} />
                  </div>
                </div>
                <div className={cx("register")}>
                  <span className={cx("title-reg")}>Don't have account?</span>
                  <div className={cx("register-link")}>
                    <div className={cx("abc")}>
                      <a href="/register">Register</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default Login;
