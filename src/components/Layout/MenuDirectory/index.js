import { Menu, Layout, theme } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserProduct } from "~/utils/productStorage";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import classNames from "classnames/bind";
import styles from "./MenuDirectory.module.scss";
const { Sider, Content } = Layout;
const cx = classNames.bind(styles);
function MenuDirectory({ children }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const items = [
    { key: "1", label: "User" },
    { key: "2", label: "Teams" },
  ];
  const getActiveKey = () => {
    const path = location.pathname;
    if (path.endsWith("user")) return "1";
    if (path.endsWith("teams")) return "2";
    return "1"; // Mặc định
  };
  const routes = {
    1: `/o/${getUserProduct(currentUser.uid)}/user`,
    2: `/o/${getUserProduct(currentUser.uid)}/teams`,
  };
  const onClick = (e) => {
    if (routes[e.key]) {
      navigate(routes[e.key]);
    }
  };
  return (
    <div className={cx("container")}>
      {" "}
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Menu
            onClick={onClick}
            selectedKeys={getActiveKey()}
            mode="inline"
            items={items}
          />
        </Sider>
        <Content
          style={{
            padding: "0 24px",
            minHeight: 280,
            background: colorBgContainer,
          }}
        >
          {children}
        </Content>
      </Layout>
    </div>
  );
}

export default MenuDirectory;
