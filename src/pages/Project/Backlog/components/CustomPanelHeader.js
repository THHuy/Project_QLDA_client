import React from 'react';
import classNames from "classnames/bind";
import styles from "../Backlog.module.scss"; // Adjust path as needed
import { Typography } from "antd";

const cx = classNames.bind(styles);
const { Text } = Typography;

// Custom header for collapse panels
const CustomPanelHeader = ({ title, count, actions }) => (
  <div className={cx("section-header")}>
    <div className={cx("header-title")}>
      {title}
      {count !== undefined && (
        <Text type="secondary">({count} work items)</Text>
      )}
    </div>
    <div className={cx("header-actions")}>{actions}</div>
  </div>
);

export default CustomPanelHeader; 