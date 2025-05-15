import { Col, Row, Alert } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import Button from "~/components/Button";
import classNames from "classnames/bind";
import styles from "./login.module.scss";
import { getAuth, getIdToken } from "firebase/auth";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
// import Aurora from "./Aurora";
const cx = classNames.bind(styles);

function Login() {
  const { currentUser, loginWithGoogle, loginWithGithub } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState(null);
  const [invitationMessage, setInvitationMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy invitation token từ URL nếu có
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const redirect = queryParams.get("redirect");
    const token = queryParams.get("token");

    if (redirect === "invitation" && token) {
      setInvitationToken(token);
      setInvitationMessage(
        "Bạn đã nhận được lời mời tham gia nhóm. Vui lòng đăng nhập để tiếp tục."
      );
      // Lưu token vào sessionStorage để dùng sau khi đăng nhập
      sessionStorage.setItem("invitationToken", token);
    }
  }, [location.search]);

  // Xử lý invitation sau khi đăng nhập
  useEffect(() => {
    async function processInvitation() {
      if (!currentUser || !invitationToken) return;

      setLoading(true);
      try {
        // Lấy ID token của user hiện tại
        const auth = getAuth();
        const idToken = await getIdToken(auth.currentUser, true);

        // Gọi API chấp nhận lời mời với token xác thực
        const response = await fetch(
          `https://us-central1-project-management-1a6a1.cloudfunctions.net/acceptInvitationManually?token=${invitationToken}`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (response.redirected) {
          // Nếu có chuyển hướng từ server, chuyển hướng theo
          window.location.href = response.url;
        } else if (response.ok) {
          // Nếu thành công, chuyển hướng tới trang teams
          navigate("/teams");
        } else {
          // Xử lý lỗi
          const data = await response.json();
          setError(data.error || "Không thể chấp nhận lời mời");
        }
      } catch (error) {
        console.error("Lỗi khi xử lý lời mời:", error);
        setError("Không thể xử lý lời mời. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
        // Xóa token khỏi sessionStorage sau khi xử lý
        sessionStorage.removeItem("invitationToken");
        setInvitationToken(null);
        setInvitationMessage("");
      }
    }

    // Kiểm tra nếu người dùng đăng nhập thành công và có invitation token
    if (currentUser && invitationToken) {
      processInvitation();
    } else if (currentUser && !invitationToken) {
      // Nếu đăng nhập thành công nhưng không có token trong state, kiểm tra sessionStorage
      const savedToken = sessionStorage.getItem("invitationToken");
      if (savedToken) {
        setInvitationToken(savedToken);
      }
    }
  }, [currentUser, invitationToken, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      await loginWithGoogle();
    } catch (error) {
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      setError("");
      await loginWithGithub();
    } catch (error) {
      setError("Đăng nhập GitHub thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (currentUser && !loading && !invitationToken) {
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

                {invitationMessage && (
                  <Alert
                    message={invitationMessage}
                    type="info"
                    showIcon
                    style={{ marginBottom: "16px" }}
                  />
                )}

                {error && (
                  <Alert
                    message={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: "16px" }}
                  />
                )}

                <div className={cx("gr-button")}>
                  <div className={cx("btn-google")}>
                    <Button
                      onClick={handleGoogleLogin}
                      children={"Login with Google"}
                      logoBtn={"/assets/images/logo-google.png"}
                      disabled={loading}
                    />
                  </div>
                  <div className={cx("btn-github")}>
                    <Button
                      onClick={handleGithubLogin}
                      children={"Login with Github"}
                      logoBtn={"/assets/images/logo-github.png"}
                      disabled={loading}
                    />
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
