import classNames from "classnames/bind";
import styles from "./Sidebar.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTable } from "@fortawesome/free-solid-svg-icons";
import {
  UserOutlined,
  RocketOutlined,
  AlignLeftOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";
import { useNavigate } from "react-router-dom";

// import Aurora from "./Aurora";
const cx = classNames.bind(styles);
function Sidebar() {
  const navigate = useNavigate();
  const items = [
    {
      key: "sub1",
      label: "For you",
      icon: <UserOutlined />,
    },
    {
      key: "sub2",
      label: "Project",
      icon: <RocketOutlined />,
      children: [
        {
          key: "g1",
          label: "Recent",
          type: "group",
          children: [
            {
              key: "sub2",
              label: "View all projects",
              icon: <AlignLeftOutlined />,
            },
          ],
        },
      ],
    },
    {
      key: "sub3",
      label: "Dashboards",
      icon: <FontAwesomeIcon icon={faTable} />,
      children: [
        {
          key: "g1",
          label: "Once you visit or create dashboards, they’ll show up here.",
          type: "group",
          children: [
            {
              key: "sub3",
              label: "View all dashboards",
              icon: <AlignLeftOutlined />,
            },
          ],
        },
      ],
    },
    { key: "sub4", label: "Teams", icon: <TeamOutlined /> },
  ];
  const routes = {
    sub1: "/your-work",
    sub2: "/projects",
    sub3: "/dashboard",
    sub4: "/teams",
  };
  const onClick = (e) => {
    if (routes[e.key]) {
      console.log(routes);
      navigate(routes[e.key]);
    }
  };
  return (
    <div className={cx("Sidebar")}>
      <Menu
        onClick={onClick}
        style={{ width: 256 }}
        defaultSelectedKeys={["sub2"]}
        defaultOpenKeys={["sub2"]}
        mode="inline"
        items={items}
      />
    </div>
  );
}

export default Sidebar;
