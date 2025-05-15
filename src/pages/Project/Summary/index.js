import React, { useState, useEffect } from "react";
import { Row, Col, Button, Space, Spin } from "antd";
import {
  FilterOutlined,
  CheckCircleOutlined,
  EditOutlined,
  PlusCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import StatsCard from "~/components/ProjectSummary/StatsCard";
import StatusOverviewCard from "~/components/ProjectSummary/StatusOverviewCard";
import PriorityBreakdownCard from "~/components/ProjectSummary/PriorityBreakdownCard";
import RecentActivityCard from "~/components/ProjectSummary/RecentActivityCard";
import TypesOfWorkCard from "~/components/ProjectSummary/TypesOfWorkCard";
import styles from "./Summary.module.scss";
import classNames from "classnames/bind";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "~/components/services/firebase";
import moment from "moment";

const cx = classNames.bind(styles);

const SummaryPage = ({ projectId }) => {
  const [statusCounts, setStatusCounts] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [workTypeCounts, setWorkTypeCounts] = useState({});
  const [loadingWorkTypes, setLoadingWorkTypes] = useState(true);
  const [statsData, setStatsData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoadingStatus(false);
      setLoadingWorkTypes(false);
      setLoadingStats(false);
      return;
    }

    const fetchSummaryData = async () => {
      setLoadingStatus(true);
      setLoadingWorkTypes(true);
      setLoadingStats(true);
      try {
        const collectionsToFetch = ["tasks", "bugs", "test_cases"];
        let allItems = [];

        // Get current date and calculate date ranges
        const now = moment();
        const sevenDaysAgo = moment().subtract(7, "days");
        const sevenDaysFromNow = moment().add(7, "days");

        for (const collName of collectionsToFetch) {
          const q = query(
            collection(db, collName),
            where("project_id", "==", projectId)
          );
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore Timestamp to milliseconds for due_date
            if (data.due_date && typeof data.due_date.toMillis === "function") {
              data.due_date = data.due_date.toMillis();
            }
            // Convert created_at and updated_at to milliseconds if they exist
            if (
              data.created_at &&
              typeof data.created_at.toMillis === "function"
            ) {
              data.created_at = data.created_at.toMillis();
            }
            if (
              data.updated_at &&
              typeof data.updated_at.toMillis === "function"
            ) {
              data.updated_at = data.updated_at.toMillis();
            }
            allItems.push({ id: doc.id, ...data });
          });
        }

        // Calculate status counts
        const counts = allItems.reduce((acc, item) => {
          const status = item.status || "Unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        // Calculate work type counts
        const typeCounts = allItems.reduce((acc, item) => {
          const type = item.work_type || "Unknown";
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        // Calculate stats
        const completedLast7Days = allItems.filter(
          (item) =>
            item.status === "DONE" &&
            item.updated_at &&
            moment(item.updated_at).isAfter(sevenDaysAgo)
        ).length;

        const updatedLast7Days = allItems.filter(
          (item) =>
            item.updated_at && moment(item.updated_at).isAfter(sevenDaysAgo)
        ).length;

        const createdLast7Days = allItems.filter(
          (item) =>
            item.created_at && moment(item.created_at).isAfter(sevenDaysAgo)
        ).length;

        const dueSoon = allItems.filter(
          (item) =>
            item.due_date &&
            moment(item.due_date).isBetween(now, sevenDaysFromNow) &&
            item.status !== "DONE"
        ).length;

        setStatsData([
          {
            title: "completed",
            value: completedLast7Days.toString(),
            period: "in the last 7 days",
            icon: <CheckCircleOutlined />,
          },
          {
            title: "updated",
            value: updatedLast7Days.toString(),
            period: "in the last 7 days",
            icon: <EditOutlined />,
          },
          {
            title: "created",
            value: createdLast7Days.toString(),
            period: "in the last 7 days",
            icon: <PlusCircleOutlined />,
          },
          {
            title: "due soon",
            value: dueSoon.toString(),
            period: "in the next 7 days",
            icon: <ClockCircleOutlined />,
          },
        ]);

        // Set predefined statuses
        const predefinedStatuses = [
          "TO DO",
          "IN PROGRESS",
          "IN REVIEW",
          "DONE",
        ];
        predefinedStatuses.forEach((status) => {
          if (!counts[status]) {
            counts[status] = 0;
          }
        });

        setStatusCounts(counts);

        // Set predefined work types
        const predefinedWorkTypes = ["Test Case", "Task", "Bug"];
        predefinedWorkTypes.forEach((type) => {
          if (!typeCounts[type]) {
            typeCounts[type] = 0;
          }
        });
        setWorkTypeCounts(typeCounts);
      } catch (error) {
        console.error("Error fetching summary data: ", error);
      } finally {
        setLoadingStatus(false);
        setLoadingWorkTypes(false);
        setLoadingStats(false);
      }
    };

    fetchSummaryData();
  }, [projectId]);

  return (
    <div className={cx("summaryContainer")}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        className={cx("filterButton")}
      >
        <Space>{/* Placeholder for potential future filter controls */}</Space>
        <Button icon={<FilterOutlined />}>Filter</Button>
      </div>

      <Row gutter={[24, 24]} className={cx("statsRow")}>
        {statsData.map((stat) => (
          <Col xs={24} sm={12} md={6} key={stat.title}>
            <StatsCard
              title={stat.title}
              value={stat.value}
              period={stat.period}
              icon={stat.icon}
            />
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12} lg={8}>
          <Spin spinning={loadingStatus}>
            <StatusOverviewCard statusCounts={statusCounts} />
          </Spin>
          <PriorityBreakdownCard />
        </Col>
        <Col xs={24} md={12} lg={16}>
          <RecentActivityCard projectId={projectId} />
          <Spin spinning={loadingWorkTypes}>
            <TypesOfWorkCard workTypeCounts={workTypeCounts} />
          </Spin>
        </Col>
      </Row>
    </div>
  );
};

export default SummaryPage;
