import React from "react";
import { Input, Badge, Typography, Tooltip } from "antd";
import { EditOutlined } from "@ant-design/icons";
import classNames from "classnames/bind";
import styles from "../ItemDetailsDrawer.module.scss"; // Assuming styles can be reused

const cx = classNames.bind(styles);
const { Text } = Typography;

const DrawerHeader = ({
  selectedItem,
  isEditingTitle,
  currentTitleValue,
  handleTitleChange,
  handleTitleSave,
  handleTitleKeyDown,
  handleTitleClick,
}) => {
  if (!selectedItem) return null;

  const title =
    selectedItem.work_type === "Test Case"
      ? selectedItem.test_case_name
      : selectedItem.summary;

  return (
    <div className={cx("drawer-header")}>
      <Badge
        count={selectedItem.work_type}
        style={{
          backgroundColor:
            selectedItem.work_type === "Bug"
              ? "#FF5630"
              : selectedItem.work_type === "Test Case"
              ? "#36B37E"
              : "#0052CC",
        }}
      />
      <div className={cx("id-title-container")}>
        {isEditingTitle ? (
          <Input
            value={currentTitleValue}
            onChange={handleTitleChange}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            placeholder={
              selectedItem.work_type === "Test Case"
                ? "Test Case Name"
                : "Summary"
            }
            className={cx("item-title-edit")}
          />
        ) : (
          <div onClick={handleTitleClick} className={cx("item-title-view")}>
            <Text
              type="secondary"
              style={{ fontSize: "12px", display: "block" }}
            >
              {selectedItem.id}
            </Text>
            <Text
              style={{ fontSize: "16px", fontWeight: 500 }}
              ellipsis={{
                tooltip: title,
              }}
            >
              {title}
            </Text>
            <Tooltip title="Edit title">
              <EditOutlined className={cx("edit-icon")} />
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DrawerHeader);
