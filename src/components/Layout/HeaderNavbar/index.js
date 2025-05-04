import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquareCaretUp, faGear } from "@fortawesome/free-solid-svg-icons";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import { Input, Tooltip, Button, Popover, Drawer } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { useState } from "react";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import DrawerProduct from "./DrawerProduct";
import LogoutHeader from "./LogoutHeader";
import classNames from "classnames/bind";
import styles from "./HeaderNavbar.module.scss";
// import Aurora from "./Aurora";
const cx = classNames.bind(styles);
function HeaderNavbar() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const showDrawer = () => {
    setOpenDrawer(true);
  };
  const onClose = () => {
    setOpenDrawer(false);
  };
  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
  };
  const textEmail = <span>{currentUser?.email}</span>;
  const contentLogout = <LogoutHeader />;
  return (
    <div className={cx("Navbar")}>
      <div className={cx("left-nav")}>
        <button className={cx("btn-collapse")}>
          <FontAwesomeIcon icon={faSquareCaretUp} />
        </button>
        <button onClick={showDrawer} className={cx("btn-product")}>
          {" "}
          <Tooltip placement="bottom" title={"Switch product"}>
            <AppstoreOutlined />
          </Tooltip>
        </button>
        <Drawer
          width={600}
          title="PRODUCT"
          placement="left"
          closable={false}
          onClose={onClose}
          open={openDrawer}
          key="left"
        >
          <DrawerProduct />
        </Drawer>
        <div className={cx("icon")}>
          <img src="/assets/images/logo-techtrack.png" alt="icon" />
          <p>TechTrack</p>
        </div>
      </div>
      <div className={cx("mid-nav")}>
        <Input
          className={cx("input-search")}
          placeholder="Search"
          prefix={<SearchOutlined />}
        />
        <Button type="primary" icon={<PlusOutlined />}>
          Create
        </Button>
      </div>
      <div className={cx("right-nav")}>
        <div className={cx("notification", "right")}>
          {" "}
          <Tooltip placement="bottom" title={"Notifications"}>
            <FontAwesomeIcon icon={faBell} />
          </Tooltip>
        </div>
        <div className={cx("setting", "right")}>
          <Tooltip placement="bottom" title={"Setting"}>
            <FontAwesomeIcon icon={faGear} />
          </Tooltip>
        </div>
        <Popover
          content={contentLogout}
          trigger="click"
          open={open}
          onOpenChange={handleOpenChange}
        >
          <Tooltip placement="bottom" title={textEmail} mouseEnterDelay={0.5}>
            <img
              src={currentUser.photoURL}
              alt="Ảnh đại diện"
              className={cx("avatar")}
            />
          </Tooltip>
        </Popover>
      </div>
    </div>
  );
}
export default HeaderNavbar;
