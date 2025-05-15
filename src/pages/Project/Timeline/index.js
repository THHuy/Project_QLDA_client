import React, { useState, useEffect } from "react";
import {
  Input,
  Select,
  Button,
  Space,
  Tag,
  Tooltip,
  Dropdown,
  Menu,
} from "antd";
import {
  UserOutlined,
  FilterOutlined,
  SearchOutlined,
  CalendarOutlined,
  PlusOutlined,
  SettingOutlined,
  EllipsisOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import classNames from "classnames/bind";
import styles from "./Timeline.module.scss";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "~/components/services/firebase";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";

const cx = classNames.bind(styles);

const Timeline = () => {
  const [viewMode, setViewMode] = useState("months");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [workItems, setWorkItems] = useState([]);
  const { projectId } = useParams();
  const [filters, setFilters] = useState({
    status: "all",
    searchText: "",
  });

  // Helper function to get color based on work type
  const getItemColor = (workType) => {
    const colors = {
      bug: { background: "#ffcdd2", border: "#e57373" },
      task: { background: "#bbdefb", border: "#64b5f6" },
      test_case: { background: "#c8e6c9", border: "#81c784" },
    };
    return colors[workType] || { background: "#e0e0e0", border: "#9e9e9e" };
  };

  // Get time periods based on view mode
  const getTimePeriods = () => {
    const periods = [];
    const today = currentDate;

    switch (viewMode) {
      case "weeks":
        // Show next 8 weeks
        for (let i = 0; i < 8; i++) {
          const weekStart = today.add(i, "week").startOf("week");
          const weekEnd = weekStart.endOf("week");
          periods.push({
            label: (
              <div className={cx("week-header")}>
                <div className={cx("week-title")}>Week {i + 1}</div>
                <div className={cx("week-dates")}>
                  {weekStart.format("MMM D")} - {weekEnd.format("MMM D, YYYY")}
                </div>
              </div>
            ),
            start: weekStart,
            end: weekEnd,
          });
        }
        break;

      case "months":
        // Show next 6 months
        for (let i = 0; i < 6; i++) {
          const monthStart = today.add(i, "month").startOf("month");
          periods.push({
            label: (
              <div className={cx("month-header")}>
                <div className={cx("month-title")}>
                  {monthStart.format("MMMM YYYY")}
                </div>
                <div className={cx("month-days")}>
                  {monthStart.format("D")} -{" "}
                  {monthStart.endOf("month").format("D")}
                </div>
              </div>
            ),
            start: monthStart,
            end: monthStart.endOf("month"),
          });
        }
        break;

      default:
        break;
    }

    return periods;
  };

  // Fetch work items from Firebase
  useEffect(() => {
    const fetchWorkItems = async () => {
      if (!projectId) return;

      try {
        const collectionsToFetch = ["tasks", "bugs", "test_cases"];
        let allItems = [];

        for (const collName of collectionsToFetch) {
          const q = query(
            collection(db, collName),
            where("project_id", "==", projectId)
          );
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => {
            allItems.push({
              id: doc.id,
              ...doc.data(),
              work_type: collName.slice(0, -1),
            });
          });
        }

        setWorkItems(allItems);
      } catch (error) {
        console.error("Error fetching work items:", error);
      }
    };

    fetchWorkItems();
  }, [projectId]);

  const renderWorkItems = () => {
    const workTypes = ["task", "bug", "test_case"];
    const periods = getTimePeriods();

    return workTypes.map((type) => {
      const items = workItems.filter((item) => {
        // Filter by work type
        const matchesType = item.work_type === type;

        // Filter by status if not "all"
        const matchesStatus =
          filters.status === "all" || item.status === filters.status;

        // Filter by search text
        const matchesSearch =
          !filters.searchText ||
          (item.summary || item.test_case_name || item.name || "")
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          (item.key || "")
            .toLowerCase()
            .includes(filters.searchText.toLowerCase());

        return matchesType && matchesStatus && matchesSearch;
      });

      if (items.length === 0) return null;

      return (
        <tr key={type} className={cx("timeline-row")}>
          <td className={cx("work-type-header")}>
            {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}s
          </td>
          {periods.map((period) => {
            const periodItems = items.filter((item) => {
              const itemDate = dayjs(item.due_date?.toDate() || item.due_date);
              return (
                itemDate.isAfter(period.start) && itemDate.isBefore(period.end)
              );
            });

            return (
              <td key={period.label} className={cx("timeline-cell")}>
                {periodItems.map((item) => {
                  const colors = getItemColor(type);
                  return (
                    <div
                      key={item.id}
                      className={cx("work-item")}
                      style={{
                        backgroundColor: colors.background,
                        borderLeft: `4px solid ${colors.border}`,
                      }}
                    >
                      <div className={cx("work-item-title")}>
                        {item.summary || item.test_case_name || item.name}
                      </div>
                      <div className={cx("work-item-info")}>
                        <span>{item.key || type.toUpperCase()}</span>
                        <Tag
                          color={
                            item.status === "DONE" ? "success" : "processing"
                          }
                        >
                          {item.status}
                        </Tag>
                      </div>
                    </div>
                  );
                })}
              </td>
            );
          })}
        </tr>
      );
    });
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleDateNavigation = (direction) => {
    setCurrentDate((prev) => {
      switch (viewMode) {
        case "weeks":
          return prev.add(direction === "next" ? 8 : -8, "week");
        case "months":
          return prev.add(direction === "next" ? 6 : -6, "month");
        default:
          return prev;
      }
    });
  };

  return (
    <div className={cx("timeline-container")}>
      <div className={cx("timeline-toolbar")}>
        <Space>
          <Input.Search
            placeholder="Search by title or key"
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            value={filters.searchText}
            onChange={(e) => handleFilterChange("searchText", e.target.value)}
          />
          <Select
            placeholder="Status"
            style={{ width: 150 }}
            value={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
          >
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="TO DO">TO DO</Select.Option>
            <Select.Option value="IN PROGRESS">IN PROGRESS</Select.Option>
            <Select.Option value="DONE">DONE</Select.Option>
          </Select>
        </Space>
        <Space>
          <Button icon={<UserOutlined />} shape="circle" />
          <Button icon={<SettingOutlined />} shape="circle" />
          <Button icon={<EllipsisOutlined />} shape="circle" />
        </Space>
      </div>

      <div className={cx("timeline-table-wrapper")}>
        <table className={cx("timeline-table")}>
          <thead>
            <tr>
              <th style={{ width: 200 }}></th>
              {getTimePeriods().map((period) => (
                <th key={period.label} className={cx("period-header")}>
                  {period.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{renderWorkItems()}</tbody>
        </table>
      </div>

      <div className={cx("timeline-footer")}>
        <Button type="link" onClick={() => setCurrentDate(dayjs())}>
          Today
        </Button>
        <Space>
          <Button
            icon={<LeftOutlined />}
            onClick={() => handleDateNavigation("prev")}
          />
          <Button
            icon={<RightOutlined />}
            onClick={() => handleDateNavigation("next")}
          />
          <Button
            type={viewMode === "weeks" ? "primary" : "default"}
            onClick={() => setViewMode("weeks")}
          >
            Weeks
          </Button>
          <Button
            type={viewMode === "months" ? "primary" : "default"}
            onClick={() => setViewMode("months")}
          >
            Months
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Timeline;
