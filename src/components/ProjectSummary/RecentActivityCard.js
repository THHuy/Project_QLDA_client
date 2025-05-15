import React, { useState, useEffect } from "react";
import { Card, List, Avatar, Typography, Tag, Spin, Empty } from "antd";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "~/components/services/firebase";
import moment from "moment";

const { Text } = Typography;

const RecentActivityCard = ({ projectId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchActivities = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const q = query(
          collection(db, "item_activities"),
          where("projectId", "==", projectId),
          orderBy("timestamp", "desc"),
          limit(10)
        );

        const querySnapshot = await getDocs(q);
        const activityList = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            user: {
              name: data.userName || "Unknown User",
              avatar: data.userAvatar ? data.userAvatar[0].toUpperCase() : "U",
            },
            action: data.changeDescription || "made a change",
            task: {
              id: data.itemId,
              title: data.newValue || data.oldValue || "N/A",
              status: data.itemType || "Unknown",
            },
            time: data.timestamp
              ? moment(data.timestamp.seconds * 1000).fromNow()
              : "Unknown time",
            type: moment(data.timestamp.seconds * 1000).isSame(moment(), "day")
              ? "today"
              : "yesterday",
          };
        });

        setActivities(activityList);
      } catch (error) {
        console.error("Error fetching activities:", error);
        setError("Failed to load activities. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [projectId]);

  return (
    <Card title="Recent activity">
      <Text type="secondary">
        Stay up to date with what's happening across the project.
      </Text>
      <Spin spinning={loading}>
        {error ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Text type="danger">{error}</Text>
          </div>
        ) : activities.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={activities}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar style={{ backgroundColor: "#1890ff" }}>
                      {item.user.avatar}
                    </Avatar>
                  }
                  title={
                    <>
                      <strong>{item.user.name}</strong> {item.action}
                      <a href={`#${item.task.id}`}>
                        {item.task.id}: {item.task.title}
                      </a>
                      <Tag style={{ marginLeft: 8 }}>{item.task.status}</Tag>
                    </>
                  }
                  description={item.time}
                />
                {index === 0 &&
                  activities.filter((d) => d.type === "today").length > 1 && (
                    <Text strong>Today</Text>
                  )}
                {activities.findIndex((d) => d.type === "yesterday") ===
                  index && <Text strong>Yesterday</Text>}
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description="No recent activities"
            style={{ margin: "20px 0" }}
          />
        )}
      </Spin>
    </Card>
  );
};

export default RecentActivityCard;
