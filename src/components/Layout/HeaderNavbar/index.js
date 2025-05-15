import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquareCaretUp, faGear } from "@fortawesome/free-solid-svg-icons";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import { Input, Tooltip, Button, Popover, Drawer, Badge } from "antd";
import { AppstoreOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import DrawerProduct from "./DrawerProduct";
import LogoutHeader from "./LogoutHeader";
import CreateIssueModal from "../../Modal/CreateIssueModal";
import classNames from "classnames/bind";
import styles from "./HeaderNavbar.module.scss";
import { useNotifications } from "~/components/hook/useNotifications";
import { useNavigate } from "react-router-dom";

const cx = classNames.bind(styles);

function HeaderNavbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useNotifications(currentUser?.uid);
  const [openPopover, setOpenPopover] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);

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

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      // TODO: Gọi hàm cập nhật isRead: true trong Firestore
      // Ví dụ: await markNotificationAsRead(notification.id);
      // Hàm markNotificationAsRead này bạn sẽ cần tự định nghĩa,
      // có thể nằm trong useNotifications hook hoặc một service riêng.
      // Sau khi cập nhật Firestore, onSnapshot sẽ tự động cập nhật lại unreadCount.
    }
    navigate(notification.link);
    setPopoverVisible(false);
  };

  const contentNotifications = (
    <div>
      {notifications.length === 0 ? (
        <p>Không có thông báo nào.</p>
      ) : (
        notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => handleNotificationClick(notif)}
            style={{
              padding: "8px",
              cursor: "pointer",
              borderBottom: "1px solid #f0f0f0",
              backgroundColor: notif.isRead ? "transparent" : "#e6f7ff",
            }}
          >
            <p>{notif.message}</p>
            <small>
              {new Date(notif.createdAt?.toDate()).toLocaleString()}
            </small>
          </div>
        ))
      )}
    </div>
  );

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
        <Popover
          content={contentNotifications}
          title="Thông báo"
          trigger="click"
          open={popoverVisible}
          onOpenChange={setPopoverVisible}
          placement="bottomRight"
        >
          <div
            className={cx("notification", "right")}
            style={{ cursor: "pointer" }}
          >
            <Tooltip placement="bottom" title={"Notifications"}>
              <Badge count={unreadCount} size="small">
                <FontAwesomeIcon icon={faBell} />
              </Badge>
            </Tooltip>
          </div>
        </Popover>
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
