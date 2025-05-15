import React from "react";
import { Card, Progress, List, Typography } from "antd";
import {
  FileTextOutlined,
  CheckSquareOutlined,
  BugOutlined,
  // PartitionOutlined, // Removed as Sub-task is no longer displayed
  QuestionCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

// Helper to map work types to icons
const workTypeIcons = {
  "Test Case": <FileTextOutlined />, // Assuming Test Case uses FileTextOutlined
  Task: <CheckSquareOutlined />,
  Bug: <BugOutlined />,
  Default: <QuestionCircleOutlined />, // Fallback for any unexpected types
};

// Mock data - replace with actual data later
// const typesOfWorkData = [...]; // We will remove or comment this out

const TypesOfWorkCard = ({ workTypeCounts = {} }) => {
  const relevantTypes = ["Test Case", "Task", "Bug"];

  const displayData = Object.entries(workTypeCounts)
    .filter(
      ([type]) => relevantTypes.includes(type) && workTypeCounts[type] > 0
    ) // Only include relevant types with count > 0
    .map(([type, count]) => ({
      type,
      count,
      icon: workTypeIcons[type] || workTypeIcons.Default,
    }))
    .sort((a, b) => b.count - a.count); // Example: sort by count descending

  // Calculate totalItems based only on the counts of relevant types that will be displayed
  const totalRelevantItems = displayData.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <Card title="Types of work" style={{ marginTop: "24px" }}>
      <p>
        Get a breakdown of work items by their types. <a>View all items</a>
      </p>
      {displayData.length > 0 ? (
        <List
          dataSource={displayData}
          renderItem={(item) => (
            <List.Item>
              <span style={{ marginRight: "8px" }}>{item.icon}</span>
              <Text style={{ flexGrow: 1 }}>{item.type}</Text>
              <div
                style={{
                  width: "100px",
                  textAlign: "right",
                  marginRight: "10px",
                }}
              >
                {totalRelevantItems > 0 && item.count > 0
                  ? `${Math.round((item.count / totalRelevantItems) * 100)}% (${
                      item.count
                    })`
                  : "0% (0)"}
              </div>
              <Progress
                percent={
                  totalRelevantItems > 0
                    ? (item.count / totalRelevantItems) * 100
                    : 0
                }
                showInfo={false}
                style={{ width: "150px" }}
              />
            </List.Item>
          )}
        />
      ) : (
        <Text>No data for Task, Bug, or Test Case.</Text>
      )}
    </Card>
  );
};

export default TypesOfWorkCard;
