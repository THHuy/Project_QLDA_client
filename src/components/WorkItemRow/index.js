import React from "react";
import {
  Checkbox,
  Tooltip,
  Typography,
  Select,
  Button,
  Avatar,
  Dropdown,
  Menu,
} from "antd";
import {
  BookOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LineOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import classNames from "classnames/bind";
import styles from "./WorkItemRow.module.scss";

const cx = classNames.bind(styles);
const { Option } = Select;
const { Text } = Typography;
// Helper to render priority icon (moved here for encapsulation)
const PriorityIcon = ({ priority }) => {
  switch (priority) {
    case "Highest":
      return <WarningOutlined style={{ color: "red" }} />;
    case "High":
      return <ArrowUpOutlined style={{ color: "orange" }} />;
    case "Medium":
      return <LineOutlined style={{ color: "blue" }} />;
    case "Low":
      return <ArrowDownOutlined style={{ color: "green" }} />;
    case "Lowest":
      // Assuming Lowest uses the same icon as Low based on previous code
      return <ArrowDownOutlined style={{ color: "limegreen" }} />;
    default:
      return <LineOutlined style={{ color: "grey" }} />;
  }
};

const WorkItemRow = ({
  item,
  assigneeDetails,
  productMembers,
  priorityMenuItems,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onShowDetails,
  isSelected,
  onToggleSelected,
}) => {
  const handleLocalStatusChange = (newStatus) => {
    onStatusChange(item.id, newStatus);
  };

  const handleLocalPriorityChange = ({ key }) => {
    onPriorityChange(item.id, key);
  };

  const handleLocalAssigneeChange = ({ key }) => {
    onAssigneeChange(item.id, key); // key here is the user.id or null
  };

  return (
    <div className={cx("work-item-row")} key={item.id}>
      <Checkbox
        className={cx("item-checkbox")}
        checked={isSelected}
        onChange={() => onToggleSelected(item.id)}
        onClick={(e) => e.stopPropagation()}
      />
      <div className={cx("item-main-content")}>
        <div className={cx("item-details")}>
          <Tooltip
            title={
              item.work_type === "Task"
                ? "Task"
                : item.work_type === "Bug"
                ? "Bug"
                : "Test Case"
            }
          >
            <span className={cx("item-type-icon")}>
              {item.work_type === "Task" ? (
                <BookOutlined style={{ color: "#4A90E2" }} />
              ) : item.work_type === "Bug" ? (
                <BookOutlined style={{ color: "#D0021B" }} />
              ) : (
                <FileTextOutlined style={{ color: "#50E3C2" }} />
              )}
            </span>
          </Tooltip>
          <Text
            className={cx("item-summary")}
            onClick={() => onShowDetails(item)}
          >
            {item.work_type === "Test Case"
              ? item.test_case_name
              : item.summary}
          </Text>
        </div>
        <div className={cx("item-actions")}>
          <Select
            defaultValue={item.status}
            className={cx("status-select")}
            size="small"
            onChange={handleLocalStatusChange}
            onClick={(e) => e.stopPropagation()}
          >
            <Option value="TO DO">TO DO</Option>
            <Option value="IN PROGRESS">IN PROGRESS</Option>
            <Option value="IN REVIEW">IN REVIEW</Option>
            <Option value="DONE">DONE</Option>
          </Select>

          <Tooltip
            title={
              item.due_date
                ? `Due: ${new Date(item.due_date).toLocaleDateString("en-GB")}`
                : "No due date"
            }
          >
            <Button
              size="small"
              icon={<CalendarOutlined />}
              className={cx("action-button")}
              onClick={(e) => e.stopPropagation()}
            >
              {item.due_date
                ? new Date(item.due_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })
                : "N/A"}
            </Button>
          </Tooltip>

          <Dropdown
            overlay={
              <Menu onClick={handleLocalPriorityChange}>
                {priorityMenuItems.map((p) => (
                  <Menu.Item key={p.key}>
                    <PriorityIcon priority={p.key} /> {p.label}
                  </Menu.Item>
                ))}
              </Menu>
            }
            trigger={["click"]}
          >
            <Tooltip title={`Priority: ${item.priority}`}>
              <Button
                size="small"
                type="text"
                className={cx("action-button", "priority-button")}
                onClick={(e) => e.stopPropagation()}
              >
                <PriorityIcon priority={item.priority} />
              </Button>
            </Tooltip>
          </Dropdown>

          <Dropdown
            overlay={
              <Menu onClick={handleLocalAssigneeChange}>
                {productMembers.map((member) => (
                  <Menu.Item key={member.id}>
                    <Avatar
                      src={member.avatarUrl}
                      size="small"
                      icon={!member.avatarUrl && <UserOutlined />}
                      style={{ marginRight: 8 }}
                    />
                    {member.displayName}
                  </Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item key={null}>
                  <UserOutlined style={{ marginRight: 8 }} /> Unassign
                </Menu.Item>
              </Menu>
            }
            trigger={["click"]}
          >
            <Tooltip
              title={
                assigneeDetails[item.assignee_id]?.displayName || "Unassigned"
              }
            >
              <Button
                size="small"
                type="text"
                className={cx("action-button", "assignee-button")}
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar
                  size="small"
                  src={assigneeDetails[item.assignee_id]?.avatarUrl}
                  icon={
                    !assigneeDetails[item.assignee_id]?.avatarUrl && (
                      <UserOutlined />
                    )
                  }
                />
              </Button>
            </Tooltip>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default WorkItemRow;
