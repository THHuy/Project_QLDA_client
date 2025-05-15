import React, { useState, useEffect, memo } from "react";
import { Drawer, Button, message, Tabs } from "antd";
import { HistoryOutlined, InfoCircleOutlined } from "@ant-design/icons";
import classNames from "classnames/bind";
import styles from "./ItemDetailsDrawer.module.scss";
import { doc, getDoc } from "firebase/firestore";
import { db } from "~/components/services/firebase";
import moment from "moment";

// Import new components
import DrawerHeader from "./components/DrawerHeader";
import DetailsTabContent from "./components/DetailsTabContent";
import ActivityTabContent from "./components/ActivityTabContent";

const cx = classNames.bind(styles);
const { TabPane } = Tabs;

const ItemDetailsDrawer = ({
  visible,
  onClose,
  selectedItem,
  assigneeDetails,
  itemActivityHistory,
  isLoadingHistory,
  updateWorkItem,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitleValue, setCurrentTitleValue] = useState("");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [currentAssigneeId, setCurrentAssigneeId] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [currentDescriptionValue, setCurrentDescriptionValue] = useState("");
  const [isEditingActualResult, setIsEditingActualResult] = useState(false);
  const [currentActualResultValue, setCurrentActualResultValue] = useState("");
  const [internalLinkedItemDetails, setInternalLinkedItemDetails] =
    useState(null);
  const [isLoadingInternalLinkedItem, setIsLoadingInternalLinkedItem] =
    useState(false);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (selectedItem && selectedItem.id && visible) {
      setIsLoadingInternalLinkedItem(false);
      setInternalLinkedItemDetails(null);
      if (
        selectedItem.work_type === "Test Case" &&
        selectedItem.linked_task_id
      ) {
        fetchLinkedItem(selectedItem.linked_task_id, "tasks", "Task");
      } else if (
        selectedItem.work_type === "Bug" &&
        selectedItem.linked_test_case_id
      ) {
        fetchLinkedItem(
          selectedItem.linked_test_case_id,
          "test_cases",
          "Test Case"
        );
      }
    } else if (!visible) {
      setInternalLinkedItemDetails(null);
      setIsLoadingInternalLinkedItem(false);
    }
  }, [selectedItem, visible]);

  const fetchLinkedItem = (itemId, collection, type) => {
    setIsLoadingInternalLinkedItem(true);
    const docRef = doc(db, collection, itemId);
    getDoc(docRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInternalLinkedItemDetails({
            id: docSnap.id,
            name: collection === "tasks" ? data.summary : data.test_case_name,
            type: type,
            steps: data.steps || [],
          });
        } else {
          setInternalLinkedItemDetails({
            id: itemId,
            name: "Not Found",
            type: type,
            steps: [],
          });
        }
      })
      .catch((error) => {
        console.error(`Error fetching linked ${type} for drawer:`, error);
        setInternalLinkedItemDetails({
          id: itemId,
          name: "Error Loading",
          type: type,
          steps: [],
        });
      })
      .finally(() => setIsLoadingInternalLinkedItem(false));
  };

  const handleTitleClick = () => {
    if (selectedItem) {
      const title =
        selectedItem.work_type === "Test Case"
          ? selectedItem.test_case_name
          : selectedItem.summary;
      setCurrentTitleValue(title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleChange = (e) => {
    setCurrentTitleValue(e.target.value);
  };

  const handleTitleSave = async () => {
    if (selectedItem) {
      const fieldName =
        selectedItem.work_type === "Test Case" ? "test_case_name" : "summary";
      const originalTitle =
        selectedItem.work_type === "Test Case"
          ? selectedItem.test_case_name
          : selectedItem.summary;
      if (
        currentTitleValue !== originalTitle &&
        currentTitleValue.trim() !== ""
      ) {
        await updateWorkItem(selectedItem.id, {
          [fieldName]: currentTitleValue,
        });
        message.success("Title updated successfully");
      }
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") handleTitleSave();
    if (e.key === "Escape") setIsEditingTitle(false);
  };

  const handleStatusClick = () => {
    setIsEditingStatus(true);
  };

  const handleStatusChangeAndSave = async (newStatus) => {
    if (selectedItem && newStatus !== selectedItem.status) {
      await updateWorkItem(selectedItem.id, { status: newStatus });
      message.success("Status updated successfully");
    }
    setIsEditingStatus(false);
  };

  const handlePriorityClick = () => {
    setIsEditingPriority(true);
  };

  const handlePriorityChangeAndSave = async (newPriority) => {
    if (selectedItem && newPriority !== selectedItem.priority) {
      await updateWorkItem(selectedItem.id, { priority: newPriority });
      message.success("Priority updated successfully");
    }
    setIsEditingPriority(false);
  };

  const handleAssigneeClick = () => {
    if (selectedItem) {
      setCurrentAssigneeId(selectedItem.assignee_id || "");
      setIsEditingAssignee(true);
    }
  };

  const handleAssigneeChangeAndSave = async (newAssigneeId) => {
    if (selectedItem && newAssigneeId !== selectedItem.assignee_id) {
      await updateWorkItem(selectedItem.id, { assignee_id: newAssigneeId });
      message.success("Assignee updated successfully");
    }
    setIsEditingAssignee(false);
  };

  const handleDescriptionClick = () => {
    if (selectedItem) {
      let descriptionText = "N/A";
      if (typeof selectedItem.description === "string") {
        descriptionText = selectedItem.description.trim()
          ? selectedItem.description
          : "N/A";
      } else if (
        selectedItem.description &&
        selectedItem.description.blocks &&
        selectedItem.description.blocks.length > 0
      ) {
        descriptionText = selectedItem.description.blocks
          .map((block) => block.text)
          .join("\n");
      }
      setCurrentDescriptionValue(descriptionText);
      setIsEditingDescription(true);
    }
  };

  const handleDescriptionChange = (e) => {
    setCurrentDescriptionValue(e.target.value);
  };

  const handleDescriptionSave = async () => {
    if (selectedItem) {
      let originalDescriptionText = "N/A";
      if (typeof selectedItem.description === "string") {
        originalDescriptionText = selectedItem.description.trim()
          ? selectedItem.description
          : "N/A";
      } else if (
        selectedItem.description &&
        selectedItem.description.blocks &&
        selectedItem.description.blocks.length > 0
      ) {
        originalDescriptionText = selectedItem.description.blocks
          .map((block) => block.text)
          .join("\n");
      }
      if (currentDescriptionValue !== originalDescriptionText) {
        await updateWorkItem(selectedItem.id, {
          description: currentDescriptionValue,
        });
        message.success("Description updated successfully");
      }
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsEditingDescription(false);
    }
  };

  const handleActualResultClick = () => {
    if (selectedItem && selectedItem.work_type === "Test Case") {
      setCurrentActualResultValue(selectedItem.actual_result || "");
      setIsEditingActualResult(true);
    }
  };

  const handleActualResultChange = (e) => {
    setCurrentActualResultValue(e.target.value);
  };

  const handleActualResultSave = async () => {
    if (selectedItem && selectedItem.work_type === "Test Case") {
      if (currentActualResultValue !== (selectedItem.actual_result || "")) {
        await updateWorkItem(selectedItem.id, {
          actual_result: currentActualResultValue,
        });
        message.success("Actual Result updated successfully");
      }
    }
    setIsEditingActualResult(false);
  };

  const handleActualResultKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsEditingActualResult(false);
    }
  };

  if (!selectedItem) return null;

  return (
    <Drawer
      title={
        <DrawerHeader
          selectedItem={selectedItem}
          isEditingTitle={isEditingTitle}
          currentTitleValue={currentTitleValue}
          handleTitleChange={handleTitleChange}
          handleTitleSave={handleTitleSave}
          handleTitleKeyDown={handleTitleKeyDown}
          handleTitleClick={handleTitleClick}
        />
      }
      placement="right"
      width={700}
      onClose={() => {
        onClose();
        setIsEditingTitle(false);
        setIsEditingStatus(false);
        setIsEditingPriority(false);
        setIsEditingAssignee(false);
        setIsEditingDescription(false);
        setIsEditingActualResult(false);
        setActiveTab("details"); // Reset tab on close
      }}
      visible={visible}
      className={cx("item-details-drawer-override")}
      headerStyle={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}
      bodyStyle={{ padding: 0 }}
      footer={
        <div className={cx("drawer-footer")}>
          <Button onClick={onClose}>Close</Button>
        </div>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className={cx("drawer-tabs")}
      >
        <TabPane
          tab={
            <span>
              <InfoCircleOutlined />
              Details
            </span>
          }
          key="details"
        >
          <DetailsTabContent
            selectedItem={selectedItem}
            assigneeDetails={assigneeDetails}
            isEditingStatus={isEditingStatus}
            handleStatusClick={handleStatusClick}
            handleStatusChangeAndSave={handleStatusChangeAndSave}
            setIsEditingStatus={setIsEditingStatus}
            isEditingPriority={isEditingPriority}
            handlePriorityClick={handlePriorityClick}
            handlePriorityChangeAndSave={handlePriorityChangeAndSave}
            setIsEditingPriority={setIsEditingPriority}
            isEditingAssignee={isEditingAssignee}
            currentAssigneeId={currentAssigneeId}
            handleAssigneeClick={handleAssigneeClick}
            handleAssigneeChangeAndSave={handleAssigneeChangeAndSave}
            setIsEditingAssignee={setIsEditingAssignee}
            isEditingDescription={isEditingDescription}
            currentDescriptionValue={currentDescriptionValue}
            handleDescriptionClick={handleDescriptionClick}
            handleDescriptionChange={handleDescriptionChange}
            handleDescriptionSave={handleDescriptionSave}
            handleDescriptionKeyDown={handleDescriptionKeyDown}
            isEditingActualResult={isEditingActualResult}
            currentActualResultValue={currentActualResultValue}
            handleActualResultClick={handleActualResultClick}
            handleActualResultChange={handleActualResultChange}
            handleActualResultSave={handleActualResultSave}
            handleActualResultKeyDown={handleActualResultKeyDown}
            internalLinkedItemDetails={internalLinkedItemDetails}
            isLoadingInternalLinkedItem={isLoadingInternalLinkedItem}
          />
        </TabPane>
        <TabPane
          tab={
            <span>
              <HistoryOutlined />
              Activity
            </span>
          }
          key="activity"
          className={cx("activity-tab")}
        >
          <ActivityTabContent
            isLoadingHistory={isLoadingHistory}
            itemActivityHistory={itemActivityHistory}
          />
        </TabPane>
      </Tabs>
    </Drawer>
  );
};

export default memo(ItemDetailsDrawer);
