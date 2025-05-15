import React from "react";
import { Badge, Popover, List, Typography, Button, Spin } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNotifications } from "~/components/hook/useNotifications";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import moment from "moment";
import "moment/locale/vi";
import classNames from "classnames/bind";
import styles from "./Notifications.module.scss";

const cx = classNames.bind(styles);
const { Text } = Typography;

moment.locale("vi");

const Notifications = () => {
  const { currentUser } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications(currentUser?.uid);

  const content = (
    <div className={cx("notifications-container")}>
      <div className={cx("notifications-header")}>
        <Text strong>Thông báo</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllAsRead}>
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>
      {loading ? (
        <div className={cx("loading-container")}>
          <Spin />
        </div>
      ) : (
        <List
          className={cx("notifications-list")}
          dataSource={notifications}
          renderItem={(notification) => (
            <List.Item
              className={cx("notification-item", {
                unread: !notification.isRead,
              })}
              onClick={() =>
                !notification.isRead && markAsRead(notification.id)
              }
            >
              <List.Item.Meta
                title={notification.title}
                description={
                  <>
                    <Text>{notification.body}</Text>
                    <br />
                    <Text type="secondary" className={cx("timestamp")}>
                      {moment(notification.timestamp).fromNow()}
                    </Text>
                  </>
                }
              />
            </List.Item>
          )}
          locale={{
            emptyText: "Không có thông báo mới",
          }}
        />
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      overlayClassName={cx("notifications-popover")}
    >
      <Badge count={unreadCount} offset={[-2, 2]}>
        <BellOutlined className={cx("notification-icon")} />
      </Badge>
    </Popover>
  );
};

export default Notifications;
