import { useState, useEffect } from "react";
import {
  rtdb,
  requestNotificationPermission,
  onMessageListener,
} from "~/components/services/firebase";
import { ref, onValue, off, update } from "firebase/database";
import { message } from "antd";

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState(null);

  // Yêu cầu quyền thông báo và lấy FCM token
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const token = await requestNotificationPermission();
        setFcmToken(token);
      } catch (error) {
        console.error("Không thể thiết lập thông báo:", error);
      }
    };

    setupNotifications();
  }, []);

  // Lắng nghe thông báo khi ứng dụng đang mở
  useEffect(() => {
    onMessageListener().then((payload) => {
      message.info(payload.notification.body);
    });
  }, []);

  // Lắng nghe thông báo từ Realtime Database
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const notificationsRef = ref(rtdb, `notifications/${userId}`);

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationsList = Object.entries(data).map(
          ([id, notification]) => ({
            id,
            ...notification,
          })
        );
        setNotifications(notificationsList);
        setUnreadCount(notificationsList.filter((n) => !n.isRead).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      setLoading(false);
    });

    return () => {
      off(notificationsRef);
    };
  }, [userId]);

  // Đánh dấu thông báo đã đọc
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = ref(
        rtdb,
        `notifications/${userId}/${notificationId}`
      );
      await update(notificationRef, { isRead: true });
    } catch (error) {
      console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);
    }
  };

  // Đánh dấu tất cả thông báo đã đọc
  const markAllAsRead = async () => {
    try {
      const updates = {};
      notifications.forEach((notification) => {
        if (!notification.isRead) {
          updates[`notifications/${userId}/${notification.id}/isRead`] = true;
        }
      });
      await update(ref(rtdb), updates);
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả thông báo đã đọc:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    fcmToken,
    markAsRead,
    markAllAsRead,
  };
};
