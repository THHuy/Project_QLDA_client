import React from 'react';
import {
  WarningOutlined,
  ArrowUpOutlined,
  LineOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";

// Component for rendering priority icons
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
      return <ArrowDownOutlined style={{ color: "green" }} />;
    default:
      return <LineOutlined style={{ color: "grey" }} />;
  }
};

export default PriorityIcon; 