import React from 'react';
import {
  CheckSquareOutlined,
  BugOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

// Component for rendering work type icons
const WorkTypeIcon = ({ workType }) => {
  switch (workType) {
    case "Task":
      return <CheckSquareOutlined style={{ color: "#4287f5" }} />;
    case "Bug":
      return <BugOutlined style={{ color: "#e54c4c" }} />;
    case "Test Case":
      return <FileTextOutlined style={{ color: "#7a43b6" }} />;
    default:
      return <CheckSquareOutlined style={{ color: "#4287f5" }} />;
  }
};

export default WorkTypeIcon; 