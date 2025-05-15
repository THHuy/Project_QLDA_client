import React from "react";
import {
  Spin,
  Timeline,
  Card,
  Avatar,
  Typography,
  Tag,
} from "antd";
import {
  HistoryOutlined,
  UserOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import classNames from "classnames/bind";
import styles from "../ItemDetailsDrawer.module.scss";

const cx = classNames.bind(styles);
const { Text } = Typography;

const ActivityTabContent = ({
  isLoadingHistory,
  itemActivityHistory,
}) => {
  return (
    <div className={cx("activity-content")}>
      {isLoadingHistory ? (
        <div className={cx("loading-spinner-container")}>
          <Spin size="large" />
        </div>
      ) : itemActivityHistory.length > 0 ? (
        <Timeline className={cx("activity-timeline")}>
          {itemActivityHistory.map((activity) => (
            <Timeline.Item
              key={activity.id}
              dot={<HistoryOutlined style={{ fontSize: "16px" }} />}
            >
              <Card
                className={cx("activity-card")}
                size="small"
                bordered={false}
              >
                <div className={cx("activity-header")}>
                  <Avatar
                    src={activity.userAvatar}
                    icon={!activity.userAvatar && <UserOutlined />}
                    size="small"
                  />
                  <Text strong>{activity.userName || "Unknown User"}</Text>
                  <Text type="secondary" className={cx("activity-time")}>
                    {activity.timestamp
                      ? moment(activity.timestamp.seconds * 1000).fromNow()
                      : "No date"}
                  </Text>
                </div>

                <div className={cx("activity-description")}>
                  <Text>{activity.changeDescription}</Text>
                </div>

                <div className={cx("activity-changes")}>
                  <Tag color="default">
                    {activity.oldValue === undefined ||
                    activity.oldValue === null
                      ? "None"
                      : String(activity.oldValue)}
                  </Tag>
                  <ArrowRightOutlined className={cx("arrow-icon")} />
                  <Tag color="blue">
                    {activity.newValue === undefined ||
                    activity.newValue === null
                      ? "None"
                      : String(activity.newValue)}
                  </Tag>
                </div>
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
      ) : (
        <div className={cx("empty-activity")}>
          <InfoCircleOutlined
            style={{ fontSize: "24px", marginBottom: "8px" }}
          />
          <Text>No activity history for this item.</Text>
        </div>
      )}
    </div>
  );
};

export default React.memo(ActivityTabContent); 