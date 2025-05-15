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
} from "antd";
import {
  EditOutlined,
  EllipsisOutlined,
  PlusOutlined,
  BookOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LineOutlined,
  CalendarOutlined,
  UserOutlined,
  ArrowRightOutlined,
  DownOutlined,
  LineChartOutlined,
  ControlOutlined,
  WarningOutlined,
  FileTextOutlined,
  DeleteOutlined,
  BugOutlined,
  CheckSquareOutlined,
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
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "~/components/services/firebase";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import { getUserProduct } from "~/utils/productStorage";
import WorkItemRow from "~/components/WorkItemRow";
import ItemDetailsDrawer from "~/components/ItemDetailsDrawer";
import CreateIssueModal from "~/components/Modal/CreateIssueModal";
import {
  convertDraftToText,
  getCollectionName,
  getChangeDescription,
} from "./utils/backlogUtils";
import PriorityIcon from "./components/PriorityIcon";
import WorkTypeIcon from "./components/WorkTypeIcon";
import CustomPanelHeader from "./components/CustomPanelHeader";

const cx = classNames.bind(styles);
const { Panel } = Collapse;
const { Text } = Typography;
const { Option } = Select;
const { Search } = Input;

// --- Helper Functions ---
// ... existing code ...
// Component for rendering priority icons
// ... existing code ...
// Component for rendering work type icons
// ... existing code ...
// Custom header for collapse panels
// ... existing code ...
// Version dropdown menu
const versionMenu = (
  <Menu>
    <Menu.Item key="1">Version 1.0</Menu.Item>
    <Menu.Item key="2">Version 2.0</Menu.Item>
  </Menu>
);

// Priority menu items constant
const PRIORITY_MENU_ITEMS = [
  { key: "Highest", label: "Highest" },
  { key: "High", label: "High" },
  { key: "Medium", label: "Medium" },
  { key: "Low", label: "Low" },
  { key: "Lowest", label: "Lowest" },
];

// Status options constant
const STATUS_OPTIONS = [
  { key: "To Do", label: "To Do" },
  { key: "In Progress", label: "In Progress" },
  { key: "Done", label: "Done" },
];

function Backlog() {
  const { currentUser } = useAuth();
  const { projectId } = useParams();

  // State management
  const [isEditSprintModalVisible, setIsEditSprintModalVisible] =
    useState(false);
  const [currentSprintName, setCurrentSprintName] = useState("TES Sprint 1");
  const [isLoadingBacklog, setIsLoadingBacklog] = useState(false);
  const [backlogItems, setBacklogItems] = useState([]);
  const [productMembers, setProductMembers] = useState([]);
  const [assigneeDetails, setAssigneeDetails] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemActivityHistory, setItemActivityHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isCreateIssueModalVisible, setIsCreateIssueModalVisible] =
    useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(null);

  // Derived state for filtered backlog items
  const filteredBacklogItems = backlogItems.filter((item) => {
    // Text search filter
    const textMatch = (item.summary || item.test_case_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Work type filter
    const workTypeMatch =
      !selectedWorkType || item.work_type === selectedWorkType;

    // Assignee filter
    const assigneeMatch =
      !selectedAssigneeId ||
      (selectedAssigneeId === "unassigned"
        ? !item.assignee_id
        : item.assignee_id === selectedAssigneeId);

    return textMatch && workTypeMatch && assigneeMatch;
  });

  // Function to update a work item in Firebase and local state
  const updateWorkItem = async (itemId, newValues) => {
    if (!currentUser) {
      message.error("User not authenticated. Cannot update item.");
      return;
    }

    try {
      const itemToUpdate = backlogItems.find((item) => item.id === itemId);
      if (!itemToUpdate) {
        message.error("Item not found.");
        return;
      }

      // Check if this is a task being marked as DONE
      if (itemToUpdate.work_type === "Task" && newValues.status === "DONE") {
        // Get all linked bugs and test cases
        const linkedBugs = backlogItems.filter(
          (item) => item.work_type === "Bug" && item.linked_task_id === itemId
        );
        const linkedTestCases = backlogItems.filter(
          (item) => item.work_type === "Test Case" && item.linked_task_id === itemId
        );

        // Check if any linked items are not DONE
        const incompleteBugs = linkedBugs.filter((bug) => bug.status !== "DONE");
        const incompleteTestCases = linkedTestCases.filter(
          (tc) => tc.status !== "DONE"
        );

        if (incompleteBugs.length > 0 || incompleteTestCases.length > 0) {
          let errorMessage = "Cannot mark task as DONE because:";
          if (incompleteBugs.length > 0) {
            errorMessage += `\n- ${incompleteBugs.length} linked bug(s) are not DONE`;
          }
          if (incompleteTestCases.length > 0) {
            errorMessage += `\n- ${incompleteTestCases.length} linked test case(s) are not DONE`;
          }
          message.error(errorMessage);
          return;
        }
      }

      const collectionName = getCollectionName(itemToUpdate.work_type);
      const itemRef = doc(db, collectionName, itemId);

      // History logging preparation
      const fieldChanged = Object.keys(newValues)[0];
      const oldValue = itemToUpdate[fieldChanged];
      const newValue = newValues[fieldChanged];
      const changeDescription = getChangeDescription(
        fieldChanged,
        currentUser.displayName
      );

      await updateDoc(itemRef, newValues);

      // Save history log
      if (oldValue !== newValue) {
        await logActivity({
          itemId,
          itemType: itemToUpdate.work_type,
          projectId: itemToUpdate.project_id,
          userId: currentUser.uid,
          userName: currentUser.displayName || "Unknown User",
          userAvatar: currentUser.photoURL || null,
          fieldChanged,
          oldValue: oldValue !== undefined ? oldValue : null,
          newValue: newValue !== undefined ? newValue : null,
          changeDescription,
        });
      }

      // Update local state
      updateLocalState(itemId, newValues);
      message.success("Item updated successfully!");
    } catch (error) {
      console.error("Error updating item:", error);
      message.error("Failed to update item.");
    }
  };

  // Helper function to get collection name based on work type
  const getCollectionName = (workType) => {
    switch (workType) {
      case "Bug":
        return "bugs";
      case "Test Case":
        return "test_cases";
      default:
        return "tasks";
    }
  };

  // Helper function to get change description
  const getChangeDescription = (fieldChanged, userName) => {
    const user = userName || "User";
    switch (fieldChanged) {
      case "status":
        return `${user} updated the Status`;
      case "priority":
        return `${user} updated the Priority`;
      case "assignee_id":
        return `${user} changed the Assignee`;
      case "due_date":
        return `${user} updated the Due date`;
      case "summary":
        return `${user} updated the Summary`;
      case "test_case_name":
        return `${user} updated the Test Case Name`;
      default:
        return `${user} updated ${fieldChanged}`;
    }
  };

  // Helper function to update local state after work item changes
  const updateLocalState = (itemId, newValues) => {
    // Update backlogItems array
    setBacklogItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, ...newValues } : item
      )
    );

    // Update selectedItem if it's the one being edited
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem((prevSelectedItem) => ({
        ...prevSelectedItem,
        ...newValues,
      }));
    }
  };

  // Helper function to log activity to Firestore
  const logActivity = async (activityData) => {
    try {
      await addDoc(collection(db, "item_activities"), {
        ...activityData,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving activity log:", error);
    }
  };

  // Delete work item function
  const deleteWorkItem = async (itemId) => {
    if (!currentUser) {
      message.error("User not authenticated. Cannot delete item.");
      return false;
    }

    try {
      const itemToDelete = backlogItems.find((item) => item.id === itemId);
      if (!itemToDelete) {
        message.error("Item not found for deletion.");
        return false;
      }

      const collectionName = getCollectionName(itemToDelete.work_type);
      const itemRef = doc(db, collectionName, itemId);

      await deleteDoc(itemRef);

      // Log deletion activity
      await logActivity({
        itemId,
        itemType: itemToDelete.work_type,
        projectId: itemToDelete.project_id,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Unknown User",
        userAvatar: currentUser.photoURL || null,
        fieldChanged: "item",
        oldValue: itemToDelete.summary || itemToDelete.test_case_name || "N/A",
        newValue: null,
        changeDescription: `${
          currentUser.displayName || "User"
        } deleted the ${itemToDelete.work_type.toLowerCase()}`,
      });

      // Update local state
      setBacklogItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemId)
      );
      return true;
    } catch (error) {
      console.error("Error deleting item:", error);
      message.error(`Failed to delete item ${itemId}.`);
      return false;
    }
  };

  // Create issue handler
  const handleCreateIssue = async (newIssueData) => {
    if (!currentUser || !projectId) {
      message.error(
        "User not authenticated or project ID missing. Cannot create item."
      );
      return;
    }

    try {
      setIsLoadingBacklog(true);
      const collectionName = getCollectionName(newIssueData.work_type);

      const docRef = await addDoc(collection(db, collectionName), {
        ...newIssueData,
        project_id: projectId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        created_by: currentUser.uid,
        status: newIssueData.status || "To Do",
        priority: newIssueData.priority || "Medium",
      });

      const newItem = {
        id: docRef.id,
        ...newIssueData,
        project_id: projectId,
      };

      setBacklogItems((prevItems) => [newItem, ...prevItems]);

      // Log creation activity
      await logActivity({
        itemId: docRef.id,
        itemType: newIssueData.work_type || "Task",
        projectId: projectId,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Unknown User",
        userAvatar: currentUser.photoURL || null,
        fieldChanged: "item",
        oldValue: null,
        newValue: newIssueData.summary || newIssueData.test_case_name || "N/A",
        changeDescription: `${
          currentUser.displayName || "User"
        } created a new ${newIssueData.work_type || "Task"}`,
      });

      message.success(
        `${newIssueData.work_type || "Item"} created successfully!`
      );
      setIsCreateIssueModalVisible(false);
    } catch (error) {
      console.error("Error creating item:", error);
      message.error("Failed to create item.");
    } finally {
      setIsLoadingBacklog(false);
    }
  };

  // Sprint modal handlers
  const showEditSprintModal = () => setIsEditSprintModalVisible(true);
  const handleCloseEditSprintModal = () => setIsEditSprintModalVisible(false);
  const handleUpdateSprint = (values) => {
    console.log("Sprint Updated:", values);
    if (values.sprintName) {
      setCurrentSprintName(values.sprintName);
    }
  };

  // Sprint action buttons
  const sprintActions = (
    <Space>
      <Button type="primary" ghost>
        Start sprint
      </Button>
      <Button type="text" icon={<EllipsisOutlined />} />
    </Space>
  );

  // Backlog action buttons
  const backlogActions = (
    <Space>
      <Button>Create sprint</Button>
    </Space>
  );

  // Work type menu for filtering
  const workTypeMenu = (
    <Menu
      onClick={({ key }) => setSelectedWorkType(key === "all" ? null : key)}
      selectedKeys={[selectedWorkType || "all"]}
    >
      <Menu.Item key="all">All Types</Menu.Item>
      <Menu.Item key="Task">Task</Menu.Item>
      <Menu.Item key="Bug">Bug</Menu.Item>
      <Menu.Item key="Test Case">Test Case</Menu.Item>
    </Menu>
  );

  // User filter menu generator
  const getUserMenu = () => (
    <Menu
      onClick={({ key }) => setSelectedAssigneeId(key === "all" ? null : key)}
      selectedKeys={[selectedAssigneeId || "all"]}
    >
      <Menu.Item key="all">All Users</Menu.Item>
      {productMembers.map((member) => (
        <Menu.Item key={member.id}>{member.displayName}</Menu.Item>
      ))}
      <Menu.Item key="unassigned">Unassigned</Menu.Item>
    </Menu>
  );

  // Fetch data effect
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      setIsLoadingBacklog(true);
      try {
        // Fetch Work Items (Tasks, Bugs, and Test Cases)
        const collectionsToFetch = ["tasks", "bugs", "test_cases"];
        const allItems = [];

        for (const collName of collectionsToFetch) {
          const q = query(
            collection(db, collName),
            where("project_id", "==", projectId)
          );
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore Timestamp to milliseconds for due_date
            if (data.due_date && typeof data.due_date.toMillis === "function") {
              data.due_date = data.due_date.toMillis();
            }
            allItems.push({ id: doc.id, ...data });
          });
        }
        setBacklogItems(allItems);

        // Fetch Product Members and their details
        const productId = getUserProduct(currentUser.uid);
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
            memberPromises.push(
              getDocs(
                query(
                  collection(db, "users"),
                  where("__name__", "==", memberData.user_id)
                )
              ).then((userSnapshot) => {
                if (!userSnapshot.empty) {
                  const userData = userSnapshot.docs[0].data();
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
                return null;
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
      } finally {
        setIsLoadingBacklog(false);
      }
    };

    fetchData();
  }, [projectId, currentUser.uid]);

  // Item action handlers
  const handleItemStatusChange = (itemId, newStatus) => {
    updateWorkItem(itemId, { status: newStatus });
  };

  const handleItemPriorityChange = (itemId, newPriority) => {
    updateWorkItem(itemId, { priority: newPriority });
  };

  const handleItemAssigneeChange = (itemId, newAssigneeId) => {
    updateWorkItem(itemId, { assignee_id: newAssigneeId });
  };

  // Details drawer handlers
  const showItemDetailsDrawer = (item) => {
    setSelectedItem(item);
  };

  const closeItemDetailsDrawer = () => {
    setSelectedItem(null);
  };

  // Fetch activity history when selected item changes
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
          setItemActivityHistory(history);
        })
        .catch((error) => {
          console.error("Error fetching item history:", error);
          message.error("Failed to load item history.");
          setItemActivityHistory([]);
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    } else {
      setItemActivityHistory([]);
    }
  }, [selectedItem]);

  // Bulk action handlers
  const handleToggleItemSelected = (itemId) => {
    setSelectedItemIds((prevSelectedIds) =>
      prevSelectedIds.includes(itemId)
        ? prevSelectedIds.filter((id) => id !== itemId)
        : [...prevSelectedIds, itemId]
    );
  };

  const handleBulkUpdate = async (updateField, newValue) => {
    if (selectedItemIds.length === 0) {
      message.info("No items selected.");
      return;
    }

    setIsLoadingBacklog(true);
    let successCount = 0;

    for (const itemId of selectedItemIds) {
      try {
        const newValues = { [updateField]: newValue };
        await updateWorkItem(itemId, newValues);
        successCount++;
      } catch (error) {
        console.error(
          `Failed to update item ${itemId} during bulk operation:`,
          error
        );
      }
    }

    setIsLoadingBacklog(false);

    if (successCount > 0) {
      message.success(`${successCount} item(s) updated successfully.`);
    }
    if (successCount !== selectedItemIds.length) {
      message.warn(
        `${selectedItemIds.length - successCount} item(s) failed to update.`
      );
    }

    setSelectedItemIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedItemIds.length === 0) {
      message.info("No items selected to delete.");
      return;
    }

    setIsLoadingBacklog(true);
    let successCount = 0;
    const itemsToDeleteDetails = selectedItemIds
      .map((id) => backlogItems.find((item) => item.id === id))
      .filter(Boolean);

    for (const item of itemsToDeleteDetails) {
      const deleted = await deleteWorkItem(item.id);
      if (deleted) {
        successCount++;
      }
    }

    setIsLoadingBacklog(false);

    if (successCount > 0) {
      message.success(`${successCount} item(s) deleted successfully.`);
    }
    if (successCount !== selectedItemIds.length) {
      message.warn(
        `${
          selectedItemIds.length - successCount
        } item(s) failed to delete or were not found.`
      );
    }

    setSelectedItemIds([]);
  };

  // Create issue modal handlers
  const showCreateIssueModal = () => {
    setIsCreateIssueModalVisible(true);
  };

  const handleCloseCreateIssueModal = () => {
    setIsCreateIssueModalVisible(false);
  };

  // Filter label helpers
  const getWorkTypeFilterLabel = () => {
    return selectedWorkType ? selectedWorkType : "Work Type";
  };

  const getUserFilterLabel = () => {
    if (!selectedAssigneeId) return "Users";
    if (selectedAssigneeId === "unassigned") return "Unassigned";

    const selectedMember = productMembers.find(
      (member) => member.id === selectedAssigneeId
    );
    return selectedMember ? selectedMember.displayName : "Users";
  };

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
          <Dropdown overlay={workTypeMenu} trigger={["click"]}>
            <Button type="text" className={cx("filter-dropdown-button")}>
              {getWorkTypeFilterLabel()} <DownOutlined />
            </Button>
          </Dropdown>
          <Dropdown overlay={getUserMenu()} trigger={["click"]}>
            <Button type="text" className={cx("filter-dropdown-button")}>
              {getUserFilterLabel()} <DownOutlined />
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

      {/* Bulk Actions Bar - Conditionally Rendered */}
      {selectedItemIds.length > 0 && (
        <div className={cx("bulk-actions-bar")}>
          <Space>
            <Text>{selectedItemIds.length} item(s) selected</Text>
            <Select
              placeholder="Change status"
              style={{ width: 150 }}
              onChange={(newStatus) => handleBulkUpdate("status", newStatus)}
              allowClear
            >
              {STATUS_OPTIONS.map((option) => (
                <Option key={option.key} value={option.key}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Change priority"
              style={{ width: 150 }}
              onChange={(newPriority) =>
                handleBulkUpdate("priority", newPriority)
              }
              allowClear
            >
              {PRIORITY_MENU_ITEMS.map((p) => (
                <Option key={p.key} value={p.key}>
                  {p.label}
                </Option>
              ))}
            </Select>
            <Button danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
              Delete Selected
            </Button>
            <Button onClick={() => setSelectedItemIds([])}>
              Clear Selection
            </Button>
          </Space>
        </div>
      )}

      {/* Work Item List Section */}
      <div className={cx("work-item-list-container")}>
        {isLoadingBacklog ? (
          <div className={cx("loading-spinner")}>
            <Spin size="large" />
          </div>
        ) : filteredBacklogItems.length === 0 ? (
          <div className={cx("no-items")}>
            <Text type="secondary">No matching items found</Text>
          </div>
        ) : (
          filteredBacklogItems.map((item) => (
            <WorkItemRow
              key={item.id}
              item={item}
              assigneeDetails={assigneeDetails}
              productMembers={productMembers}
              priorityMenuItems={PRIORITY_MENU_ITEMS}
              onStatusChange={handleItemStatusChange}
              onPriorityChange={handleItemPriorityChange}
              onAssigneeChange={handleItemAssigneeChange}
              onShowDetails={showItemDetailsDrawer}
              isSelected={selectedItemIds.includes(item.id)}
              onToggleSelected={handleToggleItemSelected}
            />
          ))
        )}
        <div className={cx("create-button-bar")}>
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={showCreateIssueModal}
          >
            Create
          </Button>
        </div>
      </div>

      {/* Modals and Drawers */}
      <EditSprintModal
        visible={isEditSprintModalVisible}
        sprintName={currentSprintName}
        onClose={handleCloseEditSprintModal}
        onUpdate={handleUpdateSprint}
      />

      <ItemDetailsDrawer
        visible={!!selectedItem}
        onClose={closeItemDetailsDrawer}
        selectedItem={selectedItem}
        assigneeDetails={assigneeDetails}
        productMembers={productMembers}
        itemActivityHistory={itemActivityHistory}
        isLoadingHistory={isLoadingHistory}
        updateWorkItem={updateWorkItem}
      />

      <CreateIssueModal
        visible={isCreateIssueModalVisible}
        onClose={handleCloseCreateIssueModal}
        onCreateIssue={handleCreateIssue}
        assigneeOptions={productMembers}
      />
    </div>
  );
}

export default Backlog;
