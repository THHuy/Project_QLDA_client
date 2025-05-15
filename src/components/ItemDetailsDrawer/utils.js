import React from "react";
import { Tag } from "antd";
import {
  CaretUpOutlined,
  CaretDownOutlined,
  StopOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

// Helper function to convert Draft.js RawContentState to plain text
export const convertDraftToText = (content) => {
  if (typeof content === "string") {
    return content.trim() ? content : "N/A";
  }
  if (!content || !content.blocks || content.blocks.length === 0) {
    return "N/A";
  }
  return content.blocks.map((block) => block.text).join("\\n");
};

// PriorityIcon with improved visuals
export const PriorityIcon = ({ priority }) => {
  const getIconAndColor = () => {
    switch (priority) {
      case "Highest":
        return {
          icon: <CaretUpOutlined style={{ transform: "scale(1.2)" }} />,
          color: "#FF0000",
          bg: "#FFEDED",
        };
      case "High":
        return { icon: <CaretUpOutlined />, color: "#FF4D00", bg: "#FFF1E6" };
      case "Medium":
        return { icon: <MinusOutlined />, color: "#0052CC", bg: "#E6F0FF" }; // Updated to use MinusOutlined component
      case "Low":
        return { icon: <CaretDownOutlined />, color: "#00875A", bg: "#E3FCEF" };
      case "Lowest":
        return {
          icon: <CaretDownOutlined style={{ transform: "scale(1.2)" }} />,
          color: "#008E00",
          bg: "#E3FCEF",
        };
      default:
        return { icon: <MinusOutlined />, color: "#6B778C", bg: "#F4F5F7" }; // Updated to use MinusOutlined component
    }
  };

  const { icon, color, bg } = getIconAndColor();

  return (
    <Tag
      color={bg}
      style={{
        color: color,
        border: `1px solid ${color}`,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {icon} {priority}
    </Tag>
  );
};

// Custom icon for status
export const StatusIcon = ({ status }) => {
  switch (status) {
    case "TO DO":
      return <StopOutlined style={{ color: "#6B778C" }} />;
    case "IN PROGRESS":
      return <ClockCircleOutlined style={{ color: "#0052CC" }} />;
    case "IN REVIEW":
      return <ExclamationCircleOutlined style={{ color: "#FF8B00" }} />;
    case "DONE":
      return <CheckCircleOutlined style={{ color: "#00875A" }} />;
    default:
      return <InfoCircleOutlined style={{ color: "#6B778C" }} />;
  }
};

// MinusOutlined component for Medium priority (and default in PriorityIcon)
export const MinusOutlined = ({ style }) => (
  <span
    style={{
      ...style,
      display: "inline-block",
      width: "1em",
      textAlign: "center",
    }}
  >
    —
  </span>
); 