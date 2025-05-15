import React from "react";
import { Card, Typography, Empty } from "antd";
// Import Chart.js components and the Pie component from react-chartjs-2
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title as ChartTitle,
} from "chart.js";
import { Pie } from "react-chartjs-2";

const { Title, Text } = Typography;

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, ChartTitle);

// Define colors for consistency
const statusColorsHex = {
  "To Do": "#FF8C00", // DarkOrange
  "TO DO": "#FF8C00",
  "In Progress": "#1890FF", // Ant Design Blue
  "IN PROGRESS": "#1890FF",
  "In Review": "#FFD700", // Gold
  "IN REVIEW": "#FFD700",
  "Done": "#52C41A", // Ant Design Green
  "DONE": "#52C41A",
  Unknown: "#BFBFBF", // Grey
};

const StatusOverviewCard = ({ statusCounts = {} }) => {
  const totalWorkItems = Object.values(statusCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const labels = Object.keys(statusCounts).filter(
    (status) => statusCounts[status] > 0
  );
  const dataValues = labels.map((label) => statusCounts[label]);
  const backgroundColors = labels.map(
    (label) => statusColorsHex[label] || statusColorsHex.Unknown
  );

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Work Items",
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map((color) => color.replace("0.2", "1")), // Make border opaque
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%", // This makes it a Donut chart
    plugins: {
      legend: {
        position: "right",
        labels: {
          padding: 15, // Add padding to legend items
          boxWidth: 12,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed !== null) {
              label += context.parsed + " item(s)";
            }
            return label;
          },
        },
      },
      // We can't directly put text in the center with standard options easily in v3/v4 of Chart.js
      // This often requires a custom plugin or absolutely positioning HTML.
      // For now, we will display the total outside or below the chart.
      // A more advanced solution for text in center:
      // https://www.chartjs.org/docs/latest/samples/plugins/doughnutlabel.html
    },
  };

  // Custom plugin to draw text in the center of the doughnut chart
  const centerTextPlugin = {
    id: "centerText",
    afterDraw: (chart) => {
      if (chart.config.type !== "doughnut") return;
      const { ctx, chartArea, _metasets } = chart;
      if (_metasets.length === 0 || _metasets[0].data.length === 0) return;

      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Total Value
      ctx.font = "bold 24px sans-serif"; // Font for the number
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillText(totalWorkItems.toString(), centerX, centerY - 7); // Adjusted Y for spacing

      // "Total work item..." text
      ctx.font = "14px sans-serif"; // Font for the label
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillText("Total work item...", centerX, centerY + 14); // Adjusted Y for spacing
      ctx.restore();
    },
  };

  ChartJS.register(centerTextPlugin); // Register the custom plugin

  return (
    <Card title="Status overview">
      <p>
        Get a snapshot of the status of your work items.{" "}
        <a>View all work items</a>
      </p>

      {totalWorkItems > 0 ? (
        <div style={{ height: "250px", position: "relative" }}>
          {" "}
          {/* Ensure container has height */}
          <Pie data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No work items to display status for."
          />
        </div>
      )}
    </Card>
  );
};

export default StatusOverviewCard;
