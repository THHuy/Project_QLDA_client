import React from "react";
import { Card } from "antd";

const StatsCard = ({ title, value, period, icon }) => {
  return (
    <Card size="small" style={{ textAlign: "center" }}>
      <div style={{ marginBottom: "8px" }}>{icon}</div>
      <h3>{value}</h3>
      <p>{title}</p>
      <small>{period}</small>
    </Card>
  );
};

export default StatsCard;
