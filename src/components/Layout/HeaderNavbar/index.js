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
import CreateIssueModal from "../../Modal/CreateIssueModal";
import classNames from "classnames/bind";
import styles from "./HeaderNavbar.module.scss";
const cx = classNames.bind(styles);

function HeaderNavbar() {
  const { currentUser } = useAuth();
  const [openPopover, setOpenPopover] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const showDrawer = () => {
    setOpenDrawer(true);
  };
  const onCloseDrawer = () => {
    setOpenDrawer(false);
  };
  const handleOpenPopoverChange = (newOpen) => {
    setOpenPopover(newOpen);
  };

  const showCreateIssueModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateIssueModal = () => {
    setIsCreateModalOpen(false);
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
          onClose={onCloseDrawer}
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCreateIssueModal}
        >
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
          open={openPopover}
          onOpenChange={handleOpenPopoverChange}
        >
          <Tooltip placement="bottom" title={textEmail} mouseEnterDelay={0.5}>
            <img
              src={currentUser?.photoURL || "/assets/images/default-avatar.png"}
              alt="Ảnh đại diện"
              className={cx("avatar")}
            />
          </Tooltip>
        </Popover>
      </div>

      {currentUser && (
        <CreateIssueModal
          open={isCreateModalOpen}
          onClose={handleCloseCreateIssueModal}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
export default HeaderNavbar;
