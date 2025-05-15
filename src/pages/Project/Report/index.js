import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
  Spin,
  Alert,
  Button,
  message,
} from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import classNames from "classnames/bind";
import styles from "./Report.module.scss";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "~/components/services/firebase";
import { useParams } from "react-router-dom";
import * as XLSX from "xlsx";

const cx = classNames.bind(styles);
const { Option } = Select;

function Report() {
  const [reportType, setReportType] = useState("progress");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    kpi: {
      taskCompletion: 0,
      onTimeDelivery: 0,
      qualityScore: 0,
    },
    taskStats: {
      total: 0,
      done: 0,
      inProgress: 0,
      todo: 0,
    },
    testStats: {
      total: 0,
      done: 0,
      inProgress: 0,
      todo: 0,
    },
    bugStats: {
      total: 0,
      done: 0,
      inProgress: 0,
      todo: 0,
    },
    taskList: [],
    testCaseList: [],
    bugList: [],
  });
  const { projectId } = useParams();
  const [exportType, setExportType] = useState("tasks");
  const [users, setUsers] = useState([]);

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch tasks
      const tasksRef = collection(db, "tasks");
      const tasksQuery = query(tasksRef, where("project_id", "==", projectId));
      const tasksSnapshot = await getDocs(tasksQuery);

      // Fetch test cases
      const testCasesRef = collection(db, "test_cases");
      const testCasesQuery = query(
        testCasesRef,
        where("project_id", "==", projectId)
      );
      const testCasesSnapshot = await getDocs(testCasesQuery);

      // Fetch bugs
      const bugsRef = collection(db, "bugs");
      const bugsQuery = query(bugsRef, where("project_id", "==", projectId));
      const bugsSnapshot = await getDocs(bugsQuery);

      // Process tasks data
      const tasks = tasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Process test cases data
      const testCases = testCasesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Process bugs data
      const bugs = bugsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Log the raw data
      console.log("Raw Data:", {
        tasks: tasks.length,
        testCases: testCases.length,
        bugs: bugs.length,
      });

      // Calculate task statistics
      const totalTasks = tasks.length;
      const doneTasks = tasks.filter((task) => task.status === "DONE").length;
      const inProgressTasks = tasks.filter(
        (task) => task.status === "IN PROGRESS"
      ).length;
      const todoTasks = tasks.filter((task) => task.status === "TO DO").length;

      // Calculate test case statistics
      const totalTests = testCases.length;
      const doneTests = testCases.filter(
        (test) => test.status === "DONE"
      ).length;
      const inProgressTests = testCases.filter(
        (test) => test.status === "IN PROGRESS"
      ).length;
      const todoTests = testCases.filter(
        (test) => test.status === "TO DO"
      ).length;

      // Calculate bug statistics
      const totalBugs = bugs.length;
      const doneBugs = bugs.filter((bug) => bug.status === "DONE").length;
      const inProgressBugs = bugs.filter(
        (bug) => bug.status === "IN PROGRESS"
      ).length;
      const todoBugs = bugs.filter((bug) => bug.status === "TO DO").length;

      // Calculate KPI metrics
      const taskCompletion =
        totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
      const onTimeTasks = tasks.filter(
        (task) =>
          task.status === "DONE" &&
          new Date(task.completedAt) <= new Date(task.dueDate)
      ).length;
      const onTimeDelivery =
        doneTasks > 0 ? (onTimeTasks / doneTasks) * 100 : 0;

      // Generate timeline data with all three metrics
      const timelineData = generateTimelineData(tasks, testCases, bugs);
      console.log("Timeline Data:", timelineData);

      // Update state with new data
      setPerformanceData({
        kpi: {
          taskCompletion: Math.round(taskCompletion),
          onTimeDelivery: Math.round(onTimeDelivery),
          qualityScore: Math.round((taskCompletion + onTimeDelivery) / 2),
        },
        taskStats: {
          total: totalTasks,
          done: doneTasks,
          inProgress: inProgressTasks,
          todo: todoTasks,
        },
        testStats: {
          total: totalTests,
          done: doneTests,
          inProgress: inProgressTests,
          todo: todoTests,
        },
        bugStats: {
          total: totalBugs,
          done: doneBugs,
          inProgress: inProgressBugs,
          todo: todoBugs,
        },
        taskList: tasks,
        testCaseList: testCases,
        bugList: bugs,
      });

      setTimelineData(timelineData);
    } catch (error) {
      console.error("Error fetching project data:", error);
      setError("Failed to load project data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial data fetch
  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, fetchProjectData]);

  // Add real-time listener for status updates
  useEffect(() => {
    if (!projectId) return;

    const unsubscribeTasks = onSnapshot(
      query(collection(db, "tasks"), where("project_id", "==", projectId)),
      () => {
        // Refetch data when tasks collection changes
        fetchProjectData();
      }
    );

    const unsubscribeTestCases = onSnapshot(
      query(collection(db, "test_cases"), where("project_id", "==", projectId)),
      () => {
        // Refetch data when test_cases collection changes
        fetchProjectData();
      }
    );

    const unsubscribeBugs = onSnapshot(
      query(collection(db, "bugs"), where("project_id", "==", projectId)),
      () => {
        // Refetch data when bugs collection changes
        fetchProjectData();
      }
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribeTasks();
      unsubscribeTestCases();
      unsubscribeBugs();
    };
  }, [projectId, fetchProjectData]);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      } catch (err) {
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  const generateTimelineData = (tasks, testCases, bugs) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentDate = new Date();
    const timelineData = [];

    // Generate last 6 months of data
    for (let i = 5; i >= 0; i--) {
      const month = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthName = months[month.getMonth()];

      // Filter tasks for this month using start_date
      const monthTasks = tasks.filter((task) => {
        if (!task.start_date) return false;
        const taskDate = new Date(
          task.start_date.seconds
            ? task.start_date.seconds * 1000
            : task.start_date
        );
        return (
          taskDate.getMonth() === month.getMonth() &&
          taskDate.getFullYear() === month.getFullYear()
        );
      });

      // Filter test cases for this month using start_date
      const monthTestCases = testCases.filter((tc) => {
        if (!tc.start_date) return false;
        const tcDate = new Date(
          tc.start_date.seconds ? tc.start_date.seconds * 1000 : tc.start_date
        );
        return (
          tcDate.getMonth() === month.getMonth() &&
          tcDate.getFullYear() === month.getFullYear()
        );
      });

      // Filter bugs for this month using start_date
      const monthBugs = bugs.filter((bug) => {
        if (!bug.start_date) return false;
        const bugDate = new Date(
          bug.start_date.seconds
            ? bug.start_date.seconds * 1000
            : bug.start_date
        );
        return (
          bugDate.getMonth() === month.getMonth() &&
          bugDate.getFullYear() === month.getFullYear()
        );
      });

      // Calculate in-progress rates
      const inProgressTasks = monthTasks.filter(
        (task) => task.status === "IN PROGRESS"
      ).length;
      const inProgressTests = monthTestCases.filter(
        (tc) => tc.status === "IN PROGRESS"
      ).length;
      const inProgressBugs = monthBugs.filter(
        (bug) => bug.status === "IN PROGRESS"
      ).length;

      const taskProgress =
        monthTasks.length > 0
          ? Math.round((inProgressTasks / monthTasks.length) * 100)
          : 0;
      const testProgress =
        monthTestCases.length > 0
          ? Math.round((inProgressTests / monthTestCases.length) * 100)
          : 0;
      const bugProgress =
        monthBugs.length > 0
          ? Math.round((inProgressBugs / monthBugs.length) * 100)
          : 0;

      // Add debug logging
      console.log(`Month ${monthName}:`, {
        tasks: {
          total: monthTasks.length,
          inProgress: inProgressTasks,
          progress: taskProgress,
        },
        testCases: {
          total: monthTestCases.length,
          inProgress: inProgressTests,
          progress: testProgress,
        },
        bugs: {
          total: monthBugs.length,
          inProgress: inProgressBugs,
          progress: bugProgress,
        },
      });

      timelineData.push({
        name: monthName,
        tasks: taskProgress,
        testCases: testProgress,
        bugs: bugProgress,
      });
    }

    return timelineData;
  };

  // Helper to get display name for status
  const getStatusDisplay = (status) => {
    if (status === "DONE") return "Done";
    if (status === "IN PROGRESS") return "In Progress";
    if (status === "TO DO") return "To Do";
    return status;
  };

  // Helper to get percent complete for a task
  const getTaskPercent = (task) => {
    if (task.status === "DONE") return 100;
    if (task.status === "IN PROGRESS") return 60;
    if (task.status === "TO DO") return 0;
    return 0;
  };

  // Helper to get assignee name from users list
  const getAssigneeName = (assigneeId) => {
    const user = users.find((u) => u.uid === assigneeId);
    return user ? user.displayName : assigneeId || "";
  };

  // Helper to format due date
  const formatDueDate = (dueDate) => {
    if (!dueDate) return "";
    // Firestore Timestamp object
    if (dueDate.seconds) {
      const d = new Date(dueDate.seconds * 1000);
      return d.toLocaleDateString("en-GB");
    }
    // Milliseconds number
    if (typeof dueDate === "number") {
      const d = new Date(dueDate);
      return d.toLocaleDateString("en-GB");
    }
    // ISO string or other string
    const d = new Date(dueDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB");
    }
    return dueDate;
  };

  // Export handler
  const handleExport = () => {
    let data = [];
    let sheetName = "";
    if (exportType === "tasks") {
      data =
        performanceData.taskList?.map((task) => ({
          Task: task.summary || task.title || "",
          Assignee: getAssigneeName(task.assignee_id),
          Status: getStatusDisplay(task.status),
          "Due Date": formatDueDate(task.due_date),
          "% Complete": getTaskPercent(task) + "%",
        })) || [];
      sheetName = "Tasks";
    } else if (exportType === "bugs") {
      data =
        performanceData.bugList?.map((bug) => ({
          Bug: bug.summary || bug.title || "",
          Assignee: getAssigneeName(bug.assignee_id),
          Status: getStatusDisplay(bug.status),
          "Due Date": formatDueDate(bug.due_date),
        })) || [];
      sheetName = "Bugs";
    } else if (exportType === "test_cases") {
      data =
        performanceData.testCaseList?.map((tc) => ({
          "Test Case": tc.test_case_name || tc.summary || "",
          Assignee: getAssigneeName(tc.assignee_id),
          Status: getStatusDisplay(tc.status),
          "Due Date": formatDueDate(tc.due_date),
        })) || [];
      sheetName = "TestCases";
    }
    if (data.length === 0) {
      message.warning("No data to export!");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName}_export.xlsx`);
  };

  const renderProgressReport = () => (
    <div className={cx("report-section")}>
      <Card
        title="Project Timeline Progress (In Progress Items)"
        className={cx("card")}
      >
        <LineChart width={800} height={400} data={timelineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="tasks"
            stroke="#8884d8"
            name="Tasks In Progress"
          />
          <Line
            type="monotone"
            dataKey="testCases"
            stroke="#82ca9d"
            name="Test Cases In Progress"
          />
          <Line
            type="monotone"
            dataKey="bugs"
            stroke="#ff7300"
            name="Bugs In Progress"
          />
        </LineChart>
      </Card>

      <Card title="Task Progress Overview" className={cx("card")}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="To Do Tasks"
              value={performanceData.taskStats.todo}
              suffix={`/ ${performanceData.taskStats.total}`}
            />
            <Progress
              percent={
                Math.round(
                  (performanceData.taskStats.todo /
                    performanceData.taskStats.total) *
                    100
                ) || 0
              }
              status="active"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="In Progress Tasks"
              value={performanceData.taskStats.inProgress}
              suffix={`/ ${performanceData.taskStats.total}`}
            />
            <Progress
              percent={
                Math.round(
                  (performanceData.taskStats.inProgress /
                    performanceData.taskStats.total) *
                    100
                ) || 0
              }
              status="active"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Done Tasks"
              value={performanceData.taskStats.done}
              suffix={`/ ${performanceData.taskStats.total}`}
            />
            <Progress
              percent={
                Math.round(
                  (performanceData.taskStats.done /
                    performanceData.taskStats.total) *
                    100
                ) || 0
              }
              status="success"
            />
          </Col>
        </Row>
      </Card>

      <Card title="Test Cases Overview" className={cx("card")}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="To Do Tests"
              value={performanceData.testStats.todo}
              suffix={`/ ${performanceData.testStats.total}`}
            />
            <Progress
              percent={
                Math.round(
                  (performanceData.testStats.todo /
                    performanceData.testStats.total) *
                    100
                ) || 0
              }
              status="active"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="In Progress Tests"
              value={performanceData.testStats.inProgress}
              suffix={`/ ${performanceData.testStats.total}`}
            />
            <Progress
              percent={
                Math.round(
                  (performanceData.testStats.inProgress /
                    performanceData.testStats.total) *
                    100
                ) || 0
              }
              status="active"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Done Tests"
              value={performanceData.testStats.done}
              suffix={`/ ${performanceData.testStats.total}`}
            />
            <Progress
              percent={
                Math.round(
                  (performanceData.testStats.done /
                    performanceData.testStats.total) *
                    100
                ) || 0
              }
              status="success"
            />
          </Col>
        </Row>
      </Card>

      <Card title="Bugs Overview" className={cx("card")}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="To Do Bugs"
              value={performanceData.bugStats.todo}
              suffix={`/ ${performanceData.bugStats.total}`}
            />
            <Progress
              percent={
                Math.round(
                  (performanceData.bugStats.todo /
                    performanceData.bugStats.total) *
                    100
                ) || 0
              }
              status="active"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="In Progress Bugs"
              value={performanceData.bugStats.inProgress}
              suffix={`/ ${performanceData.bugStats.total}`}
            />
            <Progress
              percent={
                Math.round(
                  (performanceData.bugStats.inProgress /
                    performanceData.bugStats.total) *
                    100
                ) || 0
              }
              status="active"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Done Bugs"
              value={performanceData.bugStats.done}
              suffix={`/ ${performanceData.bugStats.total}`}
            />
            <Progress
              percent={
                Math.round(
                  (performanceData.bugStats.done /
                    performanceData.bugStats.total) *
                    100
                ) || 0
              }
              status="success"
            />
          </Col>
        </Row>
      </Card>
    </div>
  );

  const renderPerformanceReport = () => (
    <div className={cx("report-section")}>
      <Card title="KPI Performance" className={cx("card")}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Task Completion Rate"
              value={performanceData.kpi.taskCompletion}
              suffix="%"
            />
            <Progress
              percent={performanceData.kpi.taskCompletion}
              status="active"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="On-time Delivery"
              value={performanceData.kpi.onTimeDelivery}
              suffix="%"
            />
            <Progress
              percent={performanceData.kpi.onTimeDelivery}
              status="active"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Quality Score"
              value={performanceData.kpi.qualityScore}
              suffix="%"
            />
            <Progress
              percent={performanceData.kpi.qualityScore}
              status="active"
            />
          </Col>
        </Row>
      </Card>

      <Card title="Task Completion Status" className={cx("card")}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total Tasks"
              value={performanceData.taskStats.total}
            />
          </Col>
          <Col span={6}>
            <Statistic title="To Do" value={performanceData.taskStats.todo} />
          </Col>
          <Col span={6}>
            <Statistic
              title="In Progress"
              value={performanceData.taskStats.inProgress}
            />
          </Col>
          <Col span={6}>
            <Statistic title="Done" value={performanceData.taskStats.done} />
          </Col>
        </Row>
      </Card>

      <Card title="Test Cases Status" className={cx("card")}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total Tests"
              value={performanceData.testStats.total}
            />
          </Col>
          <Col span={6}>
            <Statistic title="To Do" value={performanceData.testStats.todo} />
          </Col>
          <Col span={6}>
            <Statistic
              title="In Progress"
              value={performanceData.testStats.inProgress}
            />
          </Col>
          <Col span={6}>
            <Statistic title="Done" value={performanceData.testStats.done} />
          </Col>
        </Row>
      </Card>

      <Card title="Bugs Status" className={cx("card")}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total Bugs"
              value={performanceData.bugStats.total}
            />
          </Col>
          <Col span={6}>
            <Statistic title="To Do" value={performanceData.bugStats.todo} />
          </Col>
          <Col span={6}>
            <Statistic
              title="In Progress"
              value={performanceData.bugStats.inProgress}
            />
          </Col>
          <Col span={6}>
            <Statistic title="Done" value={performanceData.bugStats.done} />
          </Col>
        </Row>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className={cx("loading-container")}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("error-container")}>
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div className={cx("report-container")}>
      <div className={cx("report-header")}>
        <h2>Project Reports</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Select
            defaultValue="progress"
            style={{ width: 200 }}
            onChange={setReportType}
          >
            <Option value="progress">Project Progress Report</Option>
            <Option value="performance">Performance Report</Option>
          </Select>
          <Select
            value={exportType}
            style={{ width: 140 }}
            onChange={setExportType}
          >
            <Option value="tasks">Tasks</Option>
            <Option value="bugs">Bugs</Option>
            <Option value="test_cases">Test Cases</Option>
          </Select>
          <Button onClick={handleExport} type="primary">
            Export Excel
          </Button>
        </div>
      </div>

      {reportType === "progress"
        ? renderProgressReport()
        : renderPerformanceReport()}
    </div>
  );
}

export default Report;
