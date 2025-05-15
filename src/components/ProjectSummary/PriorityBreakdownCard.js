import React, { useEffect, useState } from "react";
import { Card, Typography, Row, Col, Statistic } from "antd";
import { Bar } from "@ant-design/plots";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "~/components/services/firebase";

const { Title, Text } = Typography;

const PriorityBreakdownCard = ({ projectId }) => {
  const [priorityData, setPriorityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPriorityData = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        const collections = ["tasks", "bugs", "test_cases"];
        const allItems = [];

        for (const collectionName of collections) {
          const q = query(
            collection(db, collectionName),
            where("project_id", "==", projectId)
          );
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            allItems.push({
              ...doc.data(),
              id: doc.id,
              work_type:
                collectionName === "test_cases"
                  ? "Test Case"
                  : collectionName === "bugs"
                  ? "Bug"
                  : "Task",
            });
          });
        }

        // Process data for the chart
        const priorityCounts = allItems.reduce((acc, item) => {
          const key = `${item.work_type}-${item.priority}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.entries(priorityCounts).map(([key, count]) => {
          const [workType, priority] = key.split("-");
          return {
            workType,
            priority,
            count,
          };
        });

        setPriorityData(chartData);
      } catch (error) {
        console.error("Error fetching priority data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriorityData();
  }, [projectId]);

  const config = {
    data: priorityData,
    isGroup: true,
    xField: "count",
    yField: "priority",
    seriesField: "workType",
    color: ["#4287f5", "#e54c4c", "#7a43b6"], // Colors for Task, Bug, Test Case
    label: {
      position: "right",
      formatter: (v) => `${v.count}`,
    },
    legend: {
      position: "top",
    },
    xAxis: {
      title: {
        text: "Number of items",
      },
    },
    yAxis: {
      title: {
        text: "Priority",
      },
    },
  };

  return (
    <Card
      title="Priority breakdown"
      style={{ marginTop: "24px" }}
      loading={loading}
    >
      <Text type="secondary">
        Get a holistic view of how work is being prioritized across different
        types of work items.
      </Text>
      <div style={{ height: "400px", marginTop: "16px" }}>
        {priorityData.length > 0 ? (
          <Bar {...config} />
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
            }}
          >
            No data available
          </div>
        )}
      </div>
    </Card>
  );
};

export default PriorityBreakdownCard;
