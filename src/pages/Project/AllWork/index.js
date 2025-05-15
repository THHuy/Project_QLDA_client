import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "~/components/services/firebase";
import styles from "./AllWork.module.scss";
import WorkTypeIcon from "../Backlog/components/WorkTypeIcon";
import { convertDraftToText } from "../Backlog/utils/backlogUtils";
import { EditOutlined, SearchOutlined } from "@ant-design/icons";

const AllWork = () => {
  const { projectId } = useParams();
  const [searchText, setSearchText] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [assigneeDetails, setAssigneeDetails] = useState({});
  const [activity, setActivity] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedTask, setSelectedTask] = useState(null);
  const [linkedItems, setLinkedItems] = useState([]);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editSummaryValue, setEditSummaryValue] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescriptionValue, setEditDescriptionValue] = useState("");
  const [editStatusValue, setEditStatusValue] = useState("");
  const [editAssigneeValue, setEditAssigneeValue] = useState("");
  const [editPriorityValue, setEditPriorityValue] = useState("");
  const [isEditingAssigneeDetail, setIsEditingAssigneeDetail] = useState(false);
  const [isEditingPriorityDetail, setIsEditingPriorityDetail] = useState(false);

  // Fetch product_id from project
  useEffect(() => {
    const fetchProjectAndAssignees = async () => {
      try {
        setLoading(true);
        let productId = "";
        let projectName = "";
        if (projectId) {
          const projectRef = doc(db, "project", projectId);
          const projectSnap = await getDoc(projectRef);
          if (projectSnap.exists()) {
            const projectData = projectSnap.data();
            productId = projectData.product_id;
            projectName = projectData.project_name;
            setSelectedProject(projectName);
          }
        }
        // Fetch product_members
        let members = [];
        let memberDetails = {};
        if (productId) {
          const membersQuery = query(
            collection(db, "product_members"),
            where("product_id", "==", productId)
          );
          const membersSnapshot = await getDocs(membersQuery);
          const userIds = [];
          membersSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.user_id) userIds.push(data.user_id);
          });
          // Fetch user details
          if (userIds.length > 0) {
            const usersQuery = query(
              collection(db, "users"),
              where("__name__", "in", userIds.slice(0, 10))
            );
            // Firestore 'in' chỉ cho tối đa 10 phần tử/lần
            const usersSnapshot = await getDocs(usersQuery);
            usersSnapshot.forEach((userDoc) => {
              const userData = userDoc.data();
              memberDetails[userDoc.id] = {
                id: userDoc.id,
                displayName: userData.displayName || "Unknown",
                avatarUrl: userData.photoURL || null,
              };
              members.push({
                id: userDoc.id,
                displayName: userData.displayName || "Unknown",
                avatarUrl: userData.photoURL || null,
              });
            });
          }
        }
        setAssignees(members);
        setAssigneeDetails(memberDetails);
      } catch (err) {
        setError("Failed to load assignees.");
      } finally {
        setLoading(false);
      }
    };
    fetchProjectAndAssignees();
  }, [projectId]);

  // Fetch tasks, bugs, test_cases
  useEffect(() => {
    const fetchAllWorkItems = async () => {
      try {
        setLoading(true);
        const collectionsToFetch = [
          { name: "tasks", type: "Task", summaryField: "summary" },
          { name: "bugs", type: "Bug", summaryField: "summary" },
          {
            name: "test_cases",
            type: "Test Case",
            summaryField: "test_case_name",
          },
        ];
        let allItems = [];
        for (const coll of collectionsToFetch) {
          const q = projectId
            ? query(
                collection(db, coll.name),
                where("project_id", "==", projectId)
              )
            : collection(db, coll.name);
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => {
            const data = doc.data();
            allItems.push({
              id: doc.id,
              summary: data[coll.summaryField] || data.summary || "",
              test_case_name: data.test_case_name || "",
              type: data.work_type || coll.type,
              status: data.status,
              assignee: data.assignee_id,
              description: data.description
                ? convertDraftToText(data.description)
                : "",
              createdAt: data.created_at ? new Date(data.created_at) : null,
              linked_task_id: data.linked_task_id,
              linked_test_case_id: data.linked_test_case_id,
              work_type: data.work_type || coll.type,
              project_id: data.project_id,
              priority: data.priority || "",
            });
          });
        }
        setTasks(allItems);
        setError(null);
      } catch (err) {
        setError("Failed to load work items. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllWorkItems();
  }, [projectId]);

  // Fetch activity for selected task
  useEffect(() => {
    if (!selectedTask) return;
    const fetchActivity = async () => {
      try {
        const q = query(
          collection(db, "item_activities"),
          where("itemId", "==", selectedTask.id),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        setActivity(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (err) {
        setActivity([]);
      }
    };
    fetchActivity();
  }, [selectedTask]);

  // Fetch linked items for selected task
  useEffect(() => {
    if (!selectedTask) return;
    if (selectedTask.type === "Task") {
      // Find all bugs/test cases linked to this task
      setLinkedItems(
        tasks.filter(
          (t) =>
            t.linked_task_id === selectedTask.id &&
            (t.type === "Bug" ||
              t.type === "TestCase" ||
              t.type === "Test Case")
        )
      );
    } else if (
      selectedTask.type === "Bug" ||
      selectedTask.type === "TestCase" ||
      selectedTask.type === "Test Case"
    ) {
      // Find the parent task
      setLinkedItems(tasks.filter((t) => t.id === selectedTask.linked_task_id));
    } else {
      setLinkedItems([]);
    }
  }, [selectedTask, tasks]);

  useEffect(() => {
    if (selectedTask) {
      setEditSummaryValue(
        selectedTask.summary || selectedTask.test_case_name || ""
      );
      setEditDescriptionValue(selectedTask.description || "");
      setEditStatusValue(selectedTask.status || "TO DO");
      setEditAssigneeValue(selectedTask.assignee || "");
      setEditPriorityValue(selectedTask.priority || "Medium");
    }
  }, [selectedTask]);

  // Helper để lấy collection name đúng
  const getCollectionName = (type) => {
    if (type === "Bug") return "bugs";
    if (type === "Test Case") return "test_cases";
    return "tasks";
  };

  const handleSaveSummary = async () => {
    if (!selectedTask) return;
    setIsEditingSummary(false);
    const collectionName = getCollectionName(selectedTask.type);
    const docRef = doc(db, collectionName, selectedTask.id);
    const field =
      selectedTask.type === "Test Case" ? "test_case_name" : "summary";
    await updateDoc(docRef, { [field]: editSummaryValue });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id
          ? {
              ...t,
              summary: editSummaryValue,
              test_case_name: editSummaryValue,
            }
          : t
      )
    );
    setSelectedTask((prev) =>
      prev
        ? {
            ...prev,
            summary: editSummaryValue,
            test_case_name: editSummaryValue,
          }
        : prev
    );
  };
  const handleSaveDescription = async () => {
    if (!selectedTask) return;
    setIsEditingDescription(false);
    const collectionName = getCollectionName(selectedTask.type);
    const docRef = doc(db, collectionName, selectedTask.id);
    await updateDoc(docRef, { description: editDescriptionValue });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id
          ? { ...t, description: editDescriptionValue }
          : t
      )
    );
    setSelectedTask((prev) =>
      prev ? { ...prev, description: editDescriptionValue } : prev
    );
  };
  const handleSaveStatus = async (newStatus) => {
    if (!selectedTask) return;
    setEditStatusValue(newStatus);
    const collectionName = getCollectionName(selectedTask.type);
    const docRef = doc(db, collectionName, selectedTask.id);
    await updateDoc(docRef, { status: newStatus });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id ? { ...t, status: newStatus } : t
      )
    );
    setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : prev));
  };
  const handleSaveAssignee = async (newAssignee) => {
    if (!selectedTask) return;
    setEditAssigneeValue(newAssignee);
    const collectionName = getCollectionName(selectedTask.type);
    const docRef = doc(db, collectionName, selectedTask.id);
    await updateDoc(docRef, { assignee_id: newAssignee });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id ? { ...t, assignee: newAssignee } : t
      )
    );
    setSelectedTask((prev) =>
      prev ? { ...prev, assignee: newAssignee } : prev
    );
  };
  const handleSavePriority = async (newPriority) => {
    if (!selectedTask) return;
    setEditPriorityValue(newPriority);
    const collectionName = getCollectionName(selectedTask.type);
    const docRef = doc(db, collectionName, selectedTask.id);
    await updateDoc(docRef, { priority: newPriority });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id ? { ...t, priority: newPriority } : t
      )
    );
    setSelectedTask((prev) =>
      prev ? { ...prev, priority: newPriority } : prev
    );
  };

  const filteredTasks = tasks.filter((task) => {
    const search = searchText.toLowerCase();
    const matchesSearch =
      (task.summary && task.summary.toLowerCase().includes(search)) ||
      (task.test_case_name &&
        task.test_case_name.toLowerCase().includes(search)) ||
      (task.status && task.status.toLowerCase().includes(search)) ||
      (task.priority && task.priority.toLowerCase().includes(search)) ||
      (task.assignee &&
        assigneeDetails[task.assignee] &&
        assigneeDetails[task.assignee].displayName
          .toLowerCase()
          .includes(search));
    const matchesType = !selectedType || task.type === selectedType;
    const matchesStatus = !selectedStatus || task.status === selectedStatus;
    const matchesAssignee =
      !selectedAssignee ||
      task.assignee === selectedAssignee ||
      (selectedAssignee === "unassigned" && !task.assignee);
    return matchesSearch && matchesType && matchesStatus && matchesAssignee;
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.workManagementContainer}>
      {/* Header navigation */}
      <div className={styles.navContainer}>
        <div className={styles.navLeft}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search by summary, assignee, status, priority..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <SearchOutlined className={styles.searchIcon} />
          </div>
        </div>

        <div className={styles.navFilters}>
          <div className={styles.filterItem}>
            <span>Project</span>
            <div className={styles.dropdownValue}>
              <span>{selectedProject}</span>
            </div>
          </div>

          <div className={styles.filterItem}>
            <span>Assignee</span>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Users</option>
              {assignees.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))}
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <span>Type</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Types</option>
              <option value="Task">Task</option>
              <option value="Bug">Bug</option>
              <option value="TestCase">TestCase</option>
              <option value="Test Case">Test Case</option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <span>Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Status</option>
              <option value="TO DO">To Do</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={styles.contentContainer}>
        {/* Left sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span>Created</span>
            <div className={styles.headerActions}>
              <button className={styles.iconBtn}>↓</button>
              <button className={styles.iconBtn}>↻</button>
            </div>
          </div>

          <div className={styles.taskList}>
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={styles.taskItem}
                onClick={() => setSelectedTask(task)}
                style={{
                  cursor: "pointer",
                  background:
                    selectedTask && selectedTask.id === task.id
                      ? "#deebff"
                      : undefined,
                }}
              >
                <WorkTypeIcon
                  workType={task.type === "TestCase" ? "Test Case" : task.type}
                />
                <span>
                  {task.summary || task.test_case_name || "(No summary)"}
                </span>
                {task.assignee && assigneeDetails[task.assignee] && (
                  <div
                    className={styles.userAvatar}
                    title={assigneeDetails[task.assignee].displayName}
                  >
                    {assigneeDetails[task.assignee].avatarUrl ? (
                      <img
                        src={assigneeDetails[task.assignee].avatarUrl}
                        alt="avatar"
                        style={{ width: 24, height: 24, borderRadius: "50%" }}
                      />
                    ) : (
                      assigneeDetails[task.assignee].displayName
                        .substring(0, 2)
                        .toUpperCase()
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main task detail */}
        <div className={styles.taskDetail}>
          {selectedTask ? (
            <>
              <div className={styles.taskHeader}>
                <div className={styles.taskPath}>
                  <span className={styles.separator}>/</span>
                </div>
              </div>

              <div className={styles.taskTitle}>
                <WorkTypeIcon
                  workType={
                    selectedTask.type === "TestCase"
                      ? "Test Case"
                      : selectedTask.type
                  }
                />
                <h2>{selectedTask.summary}</h2>
                <div className={styles.taskStatus}>
                  <span>{selectedTask.status}</span>
                </div>
                <button className={styles.actionBtn}>⚡</button>
              </div>

              <div className={styles.taskContent}>
                <div className={styles.taskSections}>
                  <div className={styles.section}>
                    <h3>Summary</h3>
                    {isEditingSummary ? (
                      <input
                        value={editSummaryValue}
                        onChange={(e) => setEditSummaryValue(e.target.value)}
                        onBlur={handleSaveSummary}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveSummary()
                        }
                        autoFocus
                      />
                    ) : (
                      <p
                        className={styles.descriptionPlaceholder}
                        onClick={() => setIsEditingSummary(true)}
                        style={{ cursor: "pointer" }}
                      >
                        {selectedTask.summary ||
                          selectedTask.test_case_name ||
                          "(No summary)"}{" "}
                        <EditOutlined style={{ fontSize: 14, marginLeft: 4 }} />
                      </p>
                    )}
                  </div>
                  <div className={styles.section}>
                    <h3>Description</h3>
                    {isEditingDescription ? (
                      <textarea
                        value={editDescriptionValue}
                        onChange={(e) =>
                          setEditDescriptionValue(e.target.value)
                        }
                        onBlur={handleSaveDescription}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveDescription()
                        }
                        autoFocus
                        rows={4}
                      />
                    ) : (
                      <p
                        className={styles.descriptionPlaceholder}
                        onClick={() => setIsEditingDescription(true)}
                        style={{ cursor: "pointer" }}
                      >
                        {selectedTask.description || "(No description)"}{" "}
                        <EditOutlined style={{ fontSize: 14, marginLeft: 4 }} />
                      </p>
                    )}
                  </div>
                  <div className={styles.section}>
                    <h3>Activity</h3>
                    <div
                      style={{
                        border: "1px solid #dfe1e6",
                        borderRadius: 4,
                        padding: 12,
                        background: "#f9f9f9",
                      }}
                    >
                      {activity.length === 0 ? (
                        <span>No activity yet.</span>
                      ) : (
                        <ul style={{ listStyle: "none", padding: 0 }}>
                          {activity.map((act) => (
                            <li key={act.id} style={{ marginBottom: 8 }}>
                              <span style={{ fontWeight: 500 }}>
                                {act.userName || "Unknown"}
                              </span>
                              {": "}
                              <span>{act.changeDescription}</span>
                              <span
                                style={{
                                  color: "#888",
                                  marginLeft: 8,
                                  fontSize: 12,
                                }}
                              >
                                {act.timestamp &&
                                  new Date(
                                    act.timestamp.seconds
                                      ? act.timestamp.seconds * 1000
                                      : act.timestamp
                                  ).toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.taskDetailsPanel}>
                  <div className={styles.panelHeader}>
                    <h3>Details</h3>
                    <span className={styles.toggleIcon}>▲</span>
                  </div>

                  {/* Linked Items */}
                  {linkedItems.length > 0 && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Linked Items</span>
                      <div className={styles.detailValue}>
                        <ul style={{ paddingLeft: 0, margin: 0 }}>
                          {linkedItems.map((item) => (
                            <li
                              key={item.id}
                              style={{ listStyle: "none", marginBottom: 4 }}
                            >
                              <WorkTypeIcon
                                workType={
                                  item.type === "TestCase"
                                    ? "Test Case"
                                    : item.type
                                }
                              />
                              <span style={{ marginLeft: 8 }}>
                                {item.summary ||
                                  item.test_case_name ||
                                  "(No summary)"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Priority */}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Priority</span>
                    <div className={styles.detailValue}>
                      {isEditingPriorityDetail ? (
                        <select
                          value={editPriorityValue}
                          onChange={(e) => handleSavePriority(e.target.value)}
                          onBlur={() => setIsEditingPriorityDetail(false)}
                          autoFocus
                        >
                          <option value="Highest">Highest</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                          <option value="Lowest">Lowest</option>
                        </select>
                      ) : (
                        <span
                          onClick={() => setIsEditingPriorityDetail(true)}
                          style={{ cursor: "pointer" }}
                        >
                          <span className={styles.priorityIcon}>
                            {editPriorityValue?.[0] || "="}
                          </span>
                          <span>{editPriorityValue}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Assignee</span>
                    <div className={styles.detailValue}>
                      {isEditingAssigneeDetail ? (
                        <select
                          value={editAssigneeValue}
                          onChange={(e) => handleSaveAssignee(e.target.value)}
                          onBlur={() => setIsEditingAssigneeDetail(false)}
                          autoFocus
                        >
                          <option value="">Unassigned</option>
                          {assignees.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.displayName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => setIsEditingAssigneeDetail(true)}
                          style={{ cursor: "pointer" }}
                        >
                          {selectedTask.assignee &&
                          assigneeDetails[selectedTask.assignee] ? (
                            <>
                              <div className={styles.userAvatar}>
                                {assigneeDetails[selectedTask.assignee]
                                  .avatarUrl ? (
                                  <img
                                    src={
                                      assigneeDetails[selectedTask.assignee]
                                        .avatarUrl
                                    }
                                    alt="avatar"
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: "50%",
                                    }}
                                  />
                                ) : (
                                  assigneeDetails[
                                    selectedTask.assignee
                                  ].displayName
                                    .substring(0, 2)
                                    .toUpperCase()
                                )}
                              </div>
                              <span>
                                {
                                  assigneeDetails[selectedTask.assignee]
                                    .displayName
                                }
                              </span>
                            </>
                          ) : (
                            <>
                              <span className={styles.userIcon}>👤</span>
                              <span>Unassigned</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Type, Status, Created giữ nguyên */}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Type</span>
                    <div className={styles.detailValue}>
                      <span>{selectedTask.type}</span>
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status</span>
                    <div className={styles.detailValue}>
                      <span>{selectedTask.status}</span>
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Created</span>
                    <div className={styles.detailValue}>
                      <span>
                        {selectedTask.createdAt &&
                          selectedTask.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.noTasks}>
              <p>Select a task to see details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllWork;
