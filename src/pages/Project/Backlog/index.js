import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./Backlog.module.scss";
import {
  Collapse,
  Button,
  Avatar,
  Select,
  Checkbox,
  Space,
  Typography,
  Tooltip,
  Input,
  Dropdown,
  Menu,
  message,
  Spin,
  Drawer,
} from "antd";
import {
  EditOutlined,
  EllipsisOutlined,
  PlusOutlined,
  BookOutlined, // For issue type icon
  ArrowUpOutlined, // Example for priority
  ArrowDownOutlined, // Example for priority
  LineOutlined, // Example for priority
  CalendarOutlined,
  UserOutlined,
  ArrowRightOutlined,
  DownOutlined,
  LineChartOutlined,
  ControlOutlined,
  WarningOutlined, // Added for "Highest" priority
} from "@ant-design/icons";
import EditSprintModal from "~/components/Modal/EditSprintModal";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "~/components/services/firebase";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import { getUserProduct } from "~/utils/productStorage";
const cx = classNames.bind(styles);
const { Panel } = Collapse;
const { Text } = Typography;
const { Option } = Select;
const { Search } = Input;

// --- Helper function to convert Draft.js RawContentState to plain text ---
const convertDraftToText = (rawContentState) => {
  if (
    !rawContentState ||
    !rawContentState.blocks ||
    rawContentState.blocks.length === 0
  ) {
    return "N/A"; // Or an empty string, depending on desired output for no content
  }
  return rawContentState.blocks.map((block) => block.text).join("\n"); // Join blocks with newline
};
// --- End Helper function ---

// Helper to render priority icon
const PriorityIcon = ({ priority }) => {
  switch (priority) {
    case "Highest":
      return <WarningOutlined style={{ color: "red" }} />;
    case "High":
      return <ArrowUpOutlined style={{ color: "orange" }} />;
    case "Medium":
      return <LineOutlined style={{ color: "blue" }} />;
    case "Low":
      return <ArrowDownOutlined style={{ color: "green" }} />;
    case "Lowest":
      return <ArrowDownOutlined style={{ color: "green" }} />; // Same as Low as per image
    default:
      return <LineOutlined style={{ color: "grey" }} />; // Default for unknown priorities
  }
};

// Header for Collapse Panels
const CustomPanelHeader = ({ title, count, actions }) => (
  <div className={cx("section-header")}>
    <div className={cx("header-title")}>
      {title}
      {count !== undefined && (
        <Text type="secondary">({count} work items)</Text>
      )}
    </div>
    <div className={cx("header-actions")}>{actions}</div>
  </div>
);

// Dropdown menu example (can be customized)
const versionMenu = (
  <Menu>
    <Menu.Item key="1">Version 1.0</Menu.Item>
    <Menu.Item key="2">Version 2.0</Menu.Item>
  </Menu>
);

function Backlog() {
  const { currentUser } = useAuth();
  const { projectId } = useParams();
  const [isEditSprintModalVisible, setIsEditSprintModalVisible] =
    useState(false);
  const [currentSprintName, setCurrentSprintName] = useState("TES Sprint 1");
  const [isLoadingBacklog, setIsLoadingBacklog] = useState(false);
  const [backlogItems, setBacklogItems] = useState([]); // New state for backlog items
  const [productMembers, setProductMembers] = useState([]); // State for product members
  const [assigneeDetails, setAssigneeDetails] = useState({}); // State for assignee details (id -> {displayName, avatarUrl})
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [isDrawerVisible, setIsDrawerVisible] = useState(false); // State for Drawer visibility
  const [selectedItem, setSelectedItem] = useState(null); // State for the selected item to show in Drawer
  const [itemActivityHistory, setItemActivityHistory] = useState([]); // State for item's activity history
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // State for loading history

  // Derived state for filtered backlog items
  const filteredBacklogItems = backlogItems.filter((item) =>
    item.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to update a work item in Firebase and local state
  const updateWorkItem = async (itemId, newValues) => {
    if (!currentUser) {
      message.error("User not authenticated. Cannot update item.");
      return;
    }
    setIsLoadingBacklog(true);
    try {
      const itemToUpdate = backlogItems.find((item) => item.id === itemId);
      if (!itemToUpdate) {
        message.error("Item not found.");
        setIsLoadingBacklog(false);
        return;
      }

      const collectionName =
        itemToUpdate.work_type === "Task" ? "tasks" : "bugs";
      const itemRef = doc(db, collectionName, itemId);

      // --- Start History Logging Preparation ---
      const fieldChanged = Object.keys(newValues)[0]; // Assumes newValues has only one key
      const oldValue = itemToUpdate[fieldChanged];
      const newValue = newValues[fieldChanged];
      let changeDescription = "";

      switch (fieldChanged) {
        case "status":
          changeDescription = "updated the Status";
          break;
        case "priority":
          changeDescription = "updated the Priority";
          break;
        case "assignee_id":
          changeDescription = "changed the Assignee";
          // For assignee, oldValue and newValue are IDs. We might want to log names if available.
          // This part can be enhanced later if assigneeDetails is readily available here.
          break;
        case "due_date":
          changeDescription = "updated the Due date";
          // Format dates for logging if they are timestamps/Date objects
          // oldValue = oldValue ? new Date(oldValue).toLocaleDateString("en-CA") : "None";
          // newValue = newValue ? new Date(newValue).toLocaleDateString("en-CA") : "None";
          break;
        case "summary":
          changeDescription = "updated the Summary";
          break;
        // Add more cases for other fields like story points, description etc.
        default:
          changeDescription = `updated ${fieldChanged}`;
      }
      // --- End History Logging Preparation ---

      await updateDoc(itemRef, newValues);

      // --- Start Saving History Log ---
      if (oldValue !== newValue) {
        // Only log if there was an actual change
        const activityLog = {
          itemId: itemId,
          itemType: itemToUpdate.work_type,
          projectId: itemToUpdate.project_id, // Ensure project_id is part of itemToUpdate
          userId: currentUser.uid,
          userName: currentUser.displayName || "Unknown User",
          userAvatar: currentUser.photoURL || null,
          timestamp: serverTimestamp(),
          fieldChanged: fieldChanged,
          oldValue: oldValue !== undefined ? oldValue : null, // Store null if oldValue was undefined
          newValue: newValue !== undefined ? newValue : null, // Store null if newValue was undefined
          changeDescription: `${
            currentUser.displayName || "User"
          } ${changeDescription}`,
        };
        try {
          await addDoc(collection(db, "item_activities"), activityLog);
        } catch (logError) {
          console.error("Error saving activity log:", logError);
          // Decide if you want to inform the user about logging failure
        }
      }
      // --- End Saving History Log ---

      setBacklogItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, ...newValues } : item
        )
      );
      message.success("Item updated successfully!");
    } catch (error) {
      console.error("Error updating item:", error);
      message.error("Failed to update item.");
    }
    setIsLoadingBacklog(false);
  };

  const showEditSprintModal = () => {
    setIsEditSprintModalVisible(true);
  };

  const handleCloseEditSprintModal = () => {
    setIsEditSprintModalVisible(false);
  };

  const handleUpdateSprint = (values) => {
    console.log("Sprint Updated:", values);
    if (values.sprintName) {
      setCurrentSprintName(values.sprintName);
    }
  };

  const sprintActions = (
    <Space>
      <Button type="primary" ghost>
        Start sprint
      </Button>
      <Button type="text" icon={<EllipsisOutlined />} />
    </Space>
  );

  const backlogActions = (
    <Space>
      <Button>Create sprint</Button>
    </Space>
  );

  useEffect(() => {
    if (!projectId) return; // Không làm gì nếu không có projectId

    const fetchData = async () => {
      setIsLoadingBacklog(true);
      try {
        // 1. Fetch Work Items (Tasks and Bugs)
        const collectionsToFetch = ["tasks", "bugs"];
        const allItems = [];
        for (const collName of collectionsToFetch) {
          const q = query(
            collection(db, collName),
            where("project_id", "==", projectId)
          );
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => {
            allItems.push({ id: doc.id, ...doc.data() });
          });
        }
        setBacklogItems(allItems);
        const productId = getUserProduct(currentUser.uid);
        // 2. Fetch Product Members and their details
        const membersQuery = query(
          collection(db, "product_members"),
          where("product_id", "==", productId)
        );
        const membersSnapshot = await getDocs(membersQuery);
        const memberPromises = [];
        const fetchedMemberDetails = {};

        membersSnapshot.forEach((memberDoc) => {
          const memberData = memberDoc.data();
          if (memberData.user_id) {
            const userDocRef = doc(db, "users", memberData.user_id);
            memberPromises.push(
              getDocs(
                query(
                  collection(db, "users"),
                  where("__name__", "==", memberData.user_id)
                )
              ).then((userSnapshot) => {
                if (!userSnapshot.empty) {
                  const userData = userSnapshot.docs[0].data();
                  // Ensure userData and its properties are defined before accessing them
                  const displayName = userData.displayName || "Unknown User";
                  const avatarUrl = userData.photoURL || null;
                  const memberInfo = {
                    id: userSnapshot.docs[0].id,
                    displayName: displayName,
                    avatarUrl: avatarUrl,
                  };
                  fetchedMemberDetails[userSnapshot.docs[0].id] = memberInfo;
                  return memberInfo;
                }
                return null; // Or handle cases where user doc doesn't exist
              })
            );
          }
        });

        const resolvedMembers = (await Promise.all(memberPromises)).filter(
          (member) => member !== null
        );
        setProductMembers(resolvedMembers);
        setAssigneeDetails(fetchedMemberDetails);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to fetch project data.");
      }
      setIsLoadingBacklog(false);
    };

    fetchData();
  }, [projectId]);

  const handlePriorityChange = (itemId, newPriority) => {
    updateWorkItem(itemId, { priority: newPriority });
  };

  const handleStatusChange = (itemId, newStatus) => {
    updateWorkItem(itemId, { status: newStatus });
  };

  const handleAssigneeChange = (itemId, newAssigneeId) => {
    updateWorkItem(itemId, { assignee_id: newAssigneeId }); // Ensure field name is 'assignee_id'
  };

  // --- Drawer Functions ---
  const showItemDetailsDrawer = (item) => {
    setSelectedItem(item);
    setIsDrawerVisible(true);
  };

  const closeItemDetailsDrawer = () => {
    setIsDrawerVisible(false);
    setSelectedItem(null); // Clear selected item when closing
  };
  // --- End Drawer Functions ---

  // --- useEffect to fetch activity history when selectedItem changes ---
  useEffect(() => {
    if (selectedItem && selectedItem.id) {
      setIsLoadingHistory(true);
      const historyQuery = query(
        collection(db, "item_activities"),
        where("itemId", "==", selectedItem.id),
        orderBy("timestamp", "desc")
      );

      getDocs(historyQuery)
        .then((snapshot) => {
          const history = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("History:", history);
          setItemActivityHistory(history);
        })
        .catch((error) => {
          console.error("Error fetching item history:", error);
          message.error("Failed to load item history.");
          setItemActivityHistory([]); // Clear history on error
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    } else {
      setItemActivityHistory([]); // Clear history if no item is selected
    }
  }, [selectedItem]); // Re-run when selectedItem changes
  // --- End useEffect for activity history ---

  // Define priority menu items
  const priorityMenuItems = [
    { key: "Highest", label: "Highest" },
    { key: "High", label: "High" },
    { key: "Medium", label: "Medium" },
    { key: "Low", label: "Low" },
    { key: "Lowest", label: "Lowest" },
  ];

  return (
    <div className={cx("backlog-container")}>
      {/* Filter Bar Section */}
      <div className={cx("filter-bar")}>
        <div className={cx("filter-group-left")}>
          <Search
            placeholder="Search backlog by summary"
            onSearch={(value) => setSearchTerm(value)}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Avatar.Group
            maxCount={5}
            maxStyle={{ color: "#f56a00", backgroundColor: "#fde3cf" }}
          >
            {productMembers.map((member) => (
              <Tooltip
                title={member.displayName}
                placement="top"
                key={member.id}
              >
                <Avatar
                  src={member.avatarUrl}
                  icon={!member.avatarUrl && <UserOutlined />}
                />
              </Tooltip>
            ))}
          </Avatar.Group>
          <Dropdown overlay={versionMenu} trigger={["click"]}>
            <Button type="text" className={cx("filter-dropdown-button")}>
              Version <DownOutlined />
            </Button>
          </Dropdown>
          <Dropdown overlay={versionMenu} trigger={["click"]}>
            <Button type="text" className={cx("filter-dropdown-button")}>
              Epic <DownOutlined />
            </Button>
          </Dropdown>
          <Dropdown overlay={versionMenu} trigger={["click"]}>
            <Button type="text" className={cx("filter-dropdown-button")}>
              Quick filters <DownOutlined />
            </Button>
          </Dropdown>
        </div>
        <div className={cx("filter-group-right")}>
          <Tooltip title="Reports">
            <Button type="text" icon={<LineChartOutlined />} />
          </Tooltip>
          <Tooltip title="Configure board">
            <Button type="text" icon={<ControlOutlined />} />
          </Tooltip>
          <Tooltip title="More options">
            <Button type="text" icon={<EllipsisOutlined />} />
          </Tooltip>
        </div>
      </div>

      {/* Sprint Section */}
      <Collapse
        defaultActiveKey={["sprint-1"]}
        ghost
        expandIconPosition="start"
      >
        <Panel
          header={
            <CustomPanelHeader
              title={currentSprintName}
              count={0}
              actions={sprintActions}
            />
          }
          key="sprint-1"
          extra={
            <Tooltip title="Add/Edit dates">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={showEditSprintModal}
                style={{ color: "#5e6c84" }}
              >
                Add dates
              </Button>
            </Tooltip>
          }
        >
          <div className={cx("sprint-planning-area")}>
            <Typography.Title level={5}>Plan your sprint</Typography.Title>
            <Text type="secondary">
              Drag work items from the <Text strong>Backlog</Text> section or
              create new ones to plan the work for this sprint. Select{" "}
              <Text strong>Start sprint</Text> when you're ready.
            </Text>
          </div>
          <div className={cx("create-button-bar")}>
            <Button type="text" icon={<PlusOutlined />}>
              Create
            </Button>
          </div>
        </Panel>
      </Collapse>

      {/* Backlog List Section */}
      <Collapse
        defaultActiveKey={["backlog-list"]}
        ghost
        expandIconPosition="start"
      >
        <Panel
          header={
            <CustomPanelHeader
              title="Backlog"
              count={filteredBacklogItems.length} // Update count to use filtered items length
              actions={backlogActions}
            />
          }
          key="backlog-list"
        >
          {/* Work Item Row - Placeholder */}
          {isLoadingBacklog ? (
            <div className={cx("loading-spinner")}>
              <Spin size="large" />
            </div>
          ) : (
            filteredBacklogItems.map((item) => {
              // Also update this map
              // console.log("Item ID:", item.id, "Due Date:", item.due_date);
              return (
                <div className={cx("work-item-row")} key={item.id}>
                  <Checkbox onClick={(e) => e.stopPropagation()} />
                  <div className={cx("item-details")}>
                    <Tooltip title={item.work_type === "Task" ? "Task" : "Bug"}>
                      <BookOutlined
                        style={{
                          color: item.work_type === "Task" ? "blue" : "red",
                        }}
                      />
                    </Tooltip>
                    <Text
                      className={cx("item-summary")}
                      onClick={() => showItemDetailsDrawer(item)}
                      style={{ cursor: "pointer" }}
                    >
                      {item.summary}
                    </Text>
                  </div>
                  <div className={cx("item-actions")}>
                    <Select
                      defaultValue={item.status}
                      style={{ width: 150 }}
                      size="small"
                      onChange={(newStatus) =>
                        handleStatusChange(item.id, newStatus)
                      }
                    >
                      <Option value="TO DO">TO DO</Option>
                      <Option value="IN PROGRESS" style={{ color: "#8fb8f6" }}>
                        IN PROGRESS
                      </Option>
                      <Option value="DONE" style={{ color: "green" }}>
                        DONE
                      </Option>
                    </Select>
                    <Button size="small" icon={<CalendarOutlined />}>
                      {item.due_date
                        ? new Date(item.due_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })
                        : "N/A"}
                    </Button>
                    <Dropdown
                      overlay={
                        <Menu
                          onClick={({ key }) =>
                            handlePriorityChange(item.id, key)
                          }
                        >
                          {priorityMenuItems.map((p) => (
                            <Menu.Item key={p.key}>
                              <PriorityIcon priority={p.key} /> {p.label}
                            </Menu.Item>
                          ))}
                        </Menu>
                      }
                      trigger={["click"]}
                    >
                      <Tooltip title={`Priority: ${item.priority}`}>
                        <Button
                          size="small"
                          type="text"
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          <PriorityIcon priority={item.priority} />
                        </Button>
                      </Tooltip>
                    </Dropdown>
                    <Dropdown
                      overlay={
                        <Menu
                          onClick={({ key }) => {
                            handleAssigneeChange(item.id, key); // key here is the user.id
                          }}
                        >
                          {productMembers.map((member) => (
                            <Menu.Item key={member.id}>
                              <Avatar
                                src={member.avatarUrl}
                                size="small"
                                icon={!member.avatarUrl && <UserOutlined />}
                                style={{ marginRight: 8 }}
                              />
                              {member.displayName}
                            </Menu.Item>
                          ))}
                          <Menu.Divider />
                          <Menu.Item
                            key={null} /* Or a special value for unassigning */
                          >
                            <UserOutlined style={{ marginRight: 8 }} /> Unassign
                          </Menu.Item>
                        </Menu>
                      }
                      trigger={["click"]}
                    >
                      <Tooltip
                        title={
                          assigneeDetails[item.assignee_id]?.displayName ||
                          "Unassigned"
                        }
                      >
                        <Button
                          size="small"
                          type="text"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "0 4px",
                          }}
                        >
                          <Avatar
                            size="small"
                            src={assigneeDetails[item.assignee_id]?.avatarUrl}
                            icon={
                              !assigneeDetails[item.assignee_id]?.avatarUrl && (
                                <UserOutlined />
                              )
                            }
                          />
                        </Button>
                      </Tooltip>
                    </Dropdown>
                  </div>
                </div>
              );
            })
          )}

          <div className={cx("create-button-bar")}>
            <Button type="text" icon={<PlusOutlined />}>
              Create
            </Button>
          </div>
        </Panel>
      </Collapse>

      <EditSprintModal
        visible={isEditSprintModalVisible}
        sprintName={currentSprintName}
        onClose={handleCloseEditSprintModal}
        onUpdate={handleUpdateSprint}
      />

      {/* Item Details Drawer */}
      {selectedItem && (
        <Drawer
          title={`[${selectedItem.id}] ${selectedItem.summary}`}
          placement="right"
          width={700}
          onClose={closeItemDetailsDrawer}
          visible={isDrawerVisible}
          bodyStyle={{ paddingBottom: 80 }}
        >
          <p>
            <strong>Description:</strong>{" "}
            {convertDraftToText(selectedItem.description)}
          </p>
          <p>
            <strong>Status:</strong> {selectedItem.status}
          </p>
          <p>
            <strong>Priority:</strong>{" "}
            <PriorityIcon priority={selectedItem.priority} />{" "}
            {selectedItem.priority}
          </p>
          <p>
            <strong>Assignee:</strong>{" "}
            {assigneeDetails[selectedItem.assignee_id]?.displayName ||
              "Unassigned"}
          </p>
          <p>
            <strong>Due Date:</strong>{" "}
            {selectedItem.due_date
              ? new Date(selectedItem.due_date).toLocaleDateString("en-GB")
              : "N/A"}
          </p>
          <p>
            <strong>Work Type:</strong> {selectedItem.work_type}
          </p>
          <Typography.Title level={4} style={{ marginTop: 20 }}>
            Activity
          </Typography.Title>
          {isLoadingHistory ? (
            <Spin />
          ) : itemActivityHistory.length > 0 ? (
            <ul
              className={cx("activity-list")}
              style={{ listStyleType: "none", paddingLeft: 0 }}
            >
              {itemActivityHistory.map((activity) => (
                <li
                  key={activity.id}
                  className={cx("activity-item")}
                  style={{
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Avatar
                    src={activity.userAvatar}
                    icon={!activity.userAvatar && <UserOutlined />}
                    size="small"
                    style={{ marginRight: 8 }}
                  />
                  <div>
                    <Text>{activity.changeDescription}</Text>
                    <br />
                    <Text>{activity.oldValue}</Text>
                    <ArrowRightOutlined />
                    <Text>{activity.newValue}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: "0.8em" }}>
                      {activity.timestamp
                        ? new Date(
                            activity.timestamp.seconds * 1000
                          ).toLocaleString()
                        : "No date"}
                    </Text>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No activity history for this item.</p>
          )}
        </Drawer>
      )}
    </div>
  );
}

export default Backlog;
