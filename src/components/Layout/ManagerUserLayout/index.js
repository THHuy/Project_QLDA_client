import { Tabs } from "antd";
import { ProductOutlined, SettingOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserProduct } from "~/utils/productStorage";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import classNames from "classnames/bind";
import styles from "./ManagerUserLayou.module.scss";
const cx = classNames.bind(styles);
function ManagerUsersLayout({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const onChange = (key) => {
    switch (key) {
      case "1":
        navigate(`/o/${getUserProduct(currentUser.uid)}/overview`);
        break;
      case "2":
        navigate(`/o/${getUserProduct(currentUser.uid)}/user`);
        break;
      case "3":
        navigate(`/o/${getUserProduct(currentUser.uid)}/product`);
        break;
      case "4":
        navigate(`/o/${getUserProduct(currentUser.uid)}/setting`);
        break;
      default:
        navigate(`/o/${getUserProduct(currentUser.uid)}/overview`);
    }
  };
  const getActiveKey = () => {
    const path = location.pathname;
    if (path.endsWith("overview")) return "1";
    if (path.endsWith("teams") || path.endsWith("user")) return "2";
    if (path.endsWith("product")) return "3";
    if (path.endsWith("setting")) return "4";
    return "1"; // Mặc định
  };
  const items = [
    {
      key: "1",
      label: "Overview",
    },
    {
      key: "2",
      label: "Diretory",
    },
    {
      key: "3",
      label: "Product",
    },
    {
      key: "4",
      label: "Setting",
    },
  ];
  const content = {
    left: (
      <div className={cx("header-tab")}>
        <button className={cx("btn-sw-product")}>
          <ProductOutlined />
        </button>
        <button className={cx("btn-setting")}>
          <SettingOutlined />
        </button>
        <p className={cx("title-product")}>product</p>
        <div className={cx("dash")}></div>
      </div>
    ),
  };
  return (
    <div className={cx("container")}>
      <Tabs
        tabBarExtraContent={content}
        size="large"
        activeKey={getActiveKey()}
        items={items}
        onChange={onChange}
      />
      {children}
    </div>
  );
}

export default ManagerUsersLayout;
