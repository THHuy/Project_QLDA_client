import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal, Form, Select, DatePicker, Input, Button } from "antd";
import Swal from "sweetalert2";

// Import Draft.js modules
import {
  Editor,
  EditorState,
  RichUtils,
  convertToRaw,
  // convertFromRaw, // For loading existing content later if needed
} from "draft-js";
import "draft-js/dist/Draft.css"; // Import default Draft.js styles

import {
  CheckSquareOutlined,
  BugOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  WarningFilled,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "~/components/services/firebase";
import { message } from "antd"; // Import message từ Ant Design

const { Option } = Select;

// Helper function để tạo danh sách người dùng fallback
const taoDanhSachNguoiDungFallback = (currentUser) => {
  if (!currentUser) return [];
  return [
    {
      uid: currentUser.uid,
      displayName: currentUser.displayName || currentUser.email,
      email: currentUser.email,
      photoURL: currentUser.photoURL || null,
    },
  ];
};

function CreateIssueModal({ open, onClose, currentUser }) {
  const [form] = Form.useForm();
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const editorRef = useRef(null);
  const [testCaseSteps, setTestCaseSteps] = useState([{ id: 1, value: "" }]);
  const [testCasesList, setTestCasesList] = useState([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [tasksList, setTasksList] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState(null);
  const [stepsOfLinkedTestCase, setStepsOfLinkedTestCase] = useState([]);

  // MOVED DEFINITIONS UP HERE
  const fetchTestCasesForProject = useCallback(
    async (projectId) => {
      if (!open || !currentUser || !projectId) {
        setTestCasesList([]);
        setLoadingTestCases(false);
        return;
      }
      setLoadingTestCases(true);
      try {
        const testCasesQuery = query(
          collection(db, "test_cases"),
          where("project_id", "==", projectId)
        );
        const testCasesSnapshot = await getDocs(testCasesQuery);
        const fetchedTestCases = testCasesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().test_case_name,
          steps: doc.data().steps || [],
          ...doc.data(),
        }));
        if (fetchedTestCases.length === 0) {
          console.warn(
            `CreateIssueModal: Không tìm thấy test cases nào cho Project ID: ${projectId}`
          );
        }
        setTestCasesList(fetchedTestCases);
      } catch (error) {
        console.error("CreateIssueModal: Lỗi khi tải test cases:", error);
        setTestCasesList([]);
      } finally {
        setLoadingTestCases(false);
      }
    },
    [open, currentUser, setLoadingTestCases, setTestCasesList]
  );

  const fetchTasksForProject = useCallback(
    async (projectId) => {
      if (!open || !currentUser || !projectId) {
        setTasksList([]);
        setLoadingTasks(false);
        return;
      }
      setLoadingTasks(true);
      try {
        const tasksQuery = query(
          collection(db, "tasks"),
          where("project_id", "==", projectId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const fetchedTasks = tasksSnapshot.docs.map((doc) => ({
          id: doc.id,
          summary: doc.data().summary,
          ...doc.data(),
        }));
        if (fetchedTasks.length === 0) {
          console.warn(
            `CreateIssueModal: Không tìm thấy tasks nào cho Project ID: ${projectId}`
          );
        }
        setTasksList(fetchedTasks);
      } catch (error) {
        console.error("CreateIssueModal: Lỗi khi tải tasks:", error);
        setTasksList([]);
      } finally {
        setLoadingTasks(false);
      }
    },
    [open, currentUser, setLoadingTasks, setTasksList]
  );

  useEffect(() => {
    const fetchProjects = async () => {
      if (!open || !currentUser) {
        setProjectsList([]);
        return;
      }
      setLoadingProjects(true);
      const selectedProductId = localStorage.getItem(
        `selectedProduct-${currentUser.uid}`
      );
      if (!selectedProductId) {
        console.warn(
          "CreateIssueModal: Không có sản phẩm được chọn. Không thể tải dự án."
        );
        setProjectsList([]);
        setLoadingProjects(false);
        return;
      }
      try {
        const projectsQuery = query(
          collection(db, "project"),
          where("product_id", "==", selectedProductId)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const fetchedProjects = projectsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().project_name,
          ...doc.data(),
        }));
        if (fetchedProjects.length === 0) {
          console.warn(
            `CreateIssueModal: Không tìm thấy dự án nào cho Product ID: ${selectedProductId}`
          );
        }
        setProjectsList(fetchedProjects);
      } catch (error) {
        console.error("CreateIssueModal: Lỗi khi tải dự án:", error);
        setProjectsList([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    const fetchUsersForProduct = async () => {
      if (!open || !currentUser) {
        setUsersList([]);
        return;
      }
      setLoadingUsers(true);
      const productIdForUsers = localStorage.getItem(
        `selectedProduct-${currentUser.uid}`
      );
      if (!productIdForUsers) {
        console.warn(
          "CreateIssueModal: Không tìm thấy Product ID để tải người dùng."
        );
        setUsersList(taoDanhSachNguoiDungFallback(currentUser));
        setLoadingUsers(false);
        return;
      }
      try {
        const q = query(
          collection(db, "product_members"),
          where("product_id", "==", productIdForUsers),
          where("status", "==", "Active")
        );
        const productMembersSnapshot = await getDocs(q);
        const userDataPromises = productMembersSnapshot.docs.map(
          async (docSnap) => {
            const { user_id } = docSnap.data();
            const userRef = doc(db, "users", user_id);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                uid: user_id,
                displayName: userData.displayName,
                email: userData.email,
                photoURL: userData.photoURL || null,
              };
            }
            return null;
          }
        );
        let fetchedUsers = (await Promise.all(userDataPromises)).filter(
          Boolean
        );
        const currentUserInList = fetchedUsers.some(
          (u) => u.uid === currentUser.uid
        );
        if (!currentUserInList && currentUser) {
          fetchedUsers.unshift(...taoDanhSachNguoiDungFallback(currentUser));
        }
        setUsersList(
          fetchedUsers.length > 0
            ? fetchedUsers
            : taoDanhSachNguoiDungFallback(currentUser)
        );
      } catch (error) {
        console.error(
          "CreateIssueModal: Lỗi khi tải người dùng cho sản phẩm:",
          error
        );
        setUsersList(taoDanhSachNguoiDungFallback(currentUser));
      } finally {
        setLoadingUsers(false);
      }
    };

    if (open) {
      fetchProjects();
      fetchUsersForProduct();

      // Initial reset of linked items when modal opens
      setTestCasesList([]);
      setTasksList([]);
      setStepsOfLinkedTestCase([]);
      form.setFieldsValue({
        linkedTestCase: undefined,
        linkedTask: undefined,
        stepFailed: undefined,
      });

      setEditorState(EditorState.createEmpty());
      setSelectedWorkType(form.getFieldValue("workType") || "Task");
    }
    if (!open) {
      form.resetFields();
      setEditorState(EditorState.createEmpty());
      setTestCaseSteps([{ id: 1, value: "" }]);
      setSelectedWorkType(null);
      setStepsOfLinkedTestCase([]);
    }
  }, [open, currentUser, form]);

  useEffect(() => {
    if (open && currentUser) {
      const initialProject =
        projectsList.length > 0 ? projectsList[0].id : undefined;
      form.setFieldsValue({
        summary: "",
        assignee: currentUser.uid,
        priority: "Medium",
        status: "To Do",
        workType: "Task",
        project: initialProject,
        dueDate: null,
        startDate: null,
        testCaseName: "",
        expectedResult: "",
        actualResult: "",
        linkedTask: undefined,
        linkedTestCase: undefined,
        stepFailed: undefined,
      });

      // Fetch linked items based on the initial/default project
      if (initialProject) {
        fetchTestCasesForProject(initialProject);
        fetchTasksForProject(initialProject);
      } else {
        // If no initial project, clear lists
        setTestCasesList([]);
        setTasksList([]);
      }
      setTestCaseSteps([{ id: 1, value: "" }]);
      setSelectedWorkType("Task");
      setEditorState(EditorState.createEmpty());
      setStepsOfLinkedTestCase([]);
    } else if (!open) {
      form.resetFields();
      setEditorState(EditorState.createEmpty());
      setTestCaseSteps([{ id: 1, value: "" }]);
      setSelectedWorkType(null);
      setStepsOfLinkedTestCase([]);
    }
  }, [
    open,
    currentUser,
    form,
    projectsList,
    fetchTestCasesForProject,
    fetchTasksForProject,
  ]);

  const handleProjectChange = (selectedProjectId) => {
    // Fetch new lists based on the selected project
    fetchTestCasesForProject(selectedProjectId);
    fetchTasksForProject(selectedProjectId);

    // Reset dependent fields as their options have changed
    form.setFieldsValue({
      linkedTestCase: undefined,
      linkedTask: undefined,
      stepFailed: undefined,
    });
    setStepsOfLinkedTestCase([]); // Clear steps for bug linking
  };

  // Handle Draft.js editor state change
  const handleEditorChange = (newEditorState) => {
    setEditorState(newEditorState);
  };
  // Handle key commands for Draft.js (e.g., Ctrl+B for bold)
  const handleKeyCommand = (command, currentEditorState) => {
    const newState = RichUtils.handleKeyCommand(currentEditorState, command);
    if (newState) {
      handleEditorChange(newState);
      return "handled";
    }
    return "not-handled";
  };

  // Function to focus the editor
  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Functions to manage Test Case Steps
  const handleAddStep = () => {
    setTestCaseSteps([
      ...testCaseSteps,
      { id: Date.now(), value: "" }, // Use timestamp for unique ID
    ]);
  };

  const handleStepChange = (id, newValue) => {
    setTestCaseSteps(
      testCaseSteps.map((step) =>
        step.id === id ? { ...step, value: newValue } : step
      )
    );
  };

  const handleRemoveStep = (id) => {
    setTestCaseSteps(testCaseSteps.filter((step) => step.id !== id));
  };

  const handleWorkTypeChange = (value) => {
    setSelectedWorkType(value);
    form.setFieldsValue({ stepFailed: undefined }); // Always reset stepFailed on workType change
    setStepsOfLinkedTestCase([]); // Always reset steps for bug linking on workType change

    if (value === "Task") {
      form.setFieldsValue({
        testCaseName: undefined,
        expectedResult: undefined,
        actualResult: undefined,
        linkedTask: undefined,
        stepFailed: undefined,
      });
      setTestCaseSteps([{ id: 1, value: "" }]);
    } else if (value === "Bug") {
      form.setFieldsValue({
        testCaseName: undefined,
        expectedResult: undefined,
        actualResult: undefined,
        linkedTask: undefined,
      });
      setTestCaseSteps([{ id: 1, value: "" }]);
    } else if (value === "Test Case") {
      form.setFieldsValue({
        summary: undefined,
        linkedTestCase: undefined,
        stepFailed: undefined,
      });
    }
  };

  const handleLinkedTestCaseChange = (selectedTestCaseId) => {
    form.setFieldsValue({ stepFailed: undefined }); // Reset step failed selection
    if (selectedTestCaseId) {
      const foundTestCase = testCasesList.find(
        (tc) => tc.id === selectedTestCaseId
      );
      if (foundTestCase && foundTestCase.steps) {
        setStepsOfLinkedTestCase(foundTestCase.steps);
      } else {
        setStepsOfLinkedTestCase([]);
      }
    } else {
      setStepsOfLinkedTestCase([]);
    }
  };

  const handleCreateOk = async (values) => {
    const currentContent = editorState.getCurrentContent();
    const rawContentState = convertToRaw(currentContent);

    // Tùy chọn: Kiểm tra (validate) nội dung mô tả thủ công
    if (
      !currentContent.hasText() ||
      (rawContentState.blocks.length === 1 &&
        rawContentState.blocks[0].text.trim() === "" &&
        rawContentState.blocks[0].type === "unstyled")
    ) {
      message.error("Description is required and cannot be empty.");
      return;
    }

    let collectionName = "";
    if (values.workType === "Task") {
      collectionName = "tasks";
    } else if (values.workType === "Bug") {
      collectionName = "bugs";
    } else if (values.workType === "Test Case") {
      collectionName = "test_cases"; // New collection for test cases
    } else {
      message.error("Invalid work type selected.");
      return;
    }

    const dataToSave = {
      summary: values.workType !== "Test Case" ? values.summary : undefined, // Summary only for Task/Bug
      project_id: values.project,
      assignee_id: values.assignee,
      priority: values.priority,
      description: rawContentState,
      start_date: values.startDate
        ? Timestamp.fromDate(values.startDate.toDate())
        : Timestamp.fromDate(new Date()), // Firestore Timestamp for start_date
      due_date: values.dueDate
        ? Timestamp.fromDate(values.dueDate.toDate())
        : null, // Firestore Timestamp for due_date (will always have value due to form validation)
      status: values.status,
      work_type: values.workType,
      created_at: new Date().getTime(),
    };

    if (values.workType === "Test Case") {
      // Specific fields for Test Case
      dataToSave.test_case_name = values.testCaseName; // Rename to match DB
      console.log(values.linkedTask);
      dataToSave.steps = testCaseSteps
        .map((step) => step.value)
        .filter((s) => s.trim() !== ""); // Save step values
      dataToSave.expected_result = values.expectedResult;
      dataToSave.actual_result = values.actualResult || null; // Optional
      dataToSave.linked_task_id = values.linkedTask ? values.linkedTask : null;
      // Test Case ID will be auto-generated by Firestore/backend or use docRef.id
      delete dataToSave.summary; // Not needed for Test Case type
    } else if (values.workType === "Task") {
      dataToSave.linked_test_case_id = values.linkedTestCase || null;
    } else if (values.workType === "Bug") {
      dataToSave.linked_test_case_id = values.linkedTestCase || null;
      dataToSave.step_failed = values.stepFailed || null;
    }

    try {
      const docRef = await addDoc(collection(db, collectionName), dataToSave);
      let successMessageTitle = "";
      if (values.workType === "Test Case") {
        successMessageTitle = values.testCaseName;
      } else {
        successMessageTitle = values.summary;
      }

      message.success({
        content: `Đã tạo '${successMessageTitle}' thành công! (ID: ${docRef.id})`,
        key: "creatingIssue",
        duration: 3,
      });
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Create '${successMessageTitle}' successfully!`,
        timer: 2000,
        showConfirmButton: false,
      });

      onClose();
      form.resetFields();
      setEditorState(EditorState.createEmpty());
      setTestCaseSteps([{ id: 1, value: "" }]); // Reset steps on success
      setSelectedWorkType(null); // Reset selected work type
    } catch (e) {
      console.error("Lỗi khi thêm document: ", e);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: `Create '${
          values.workType === "Test Case" ? values.testCaseName : values.summary
        }' failed: ${e.message || "Please try again."}`,
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleCancel = () => {
    onClose();
    // Form reset and editorState reset is handled by useEffect when 'open' changes to false
  };

  // Quill modules removed

  // Basic styling for Draft.js editor wrapper
  const editorStyle = {
    border: "1px solid #d9d9d9",
    borderRadius: "2px",
    minHeight: "150px",
    padding: "10px",
    marginBottom: "20px",
  };

  return (
    <Modal
      title="Create Issue"
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      width={800}
      okText="Create"
      destroyOnClose // Important to destroy form state when modal is closed
    >
      <Form
        form={form}
        layout="vertical"
        name="create_issue_form_modal"
        onFinish={handleCreateOk}
        // initialValues set by useEffect
      >
        <Form.Item
          name="project"
          label="Project"
          rules={[{ required: true, message: "Please select a project!" }]}
        >
          <Select
            placeholder="Select project"
            loading={loadingProjects}
            showSearch
            optionFilterProp="children"
            onChange={handleProjectChange}
          >
            {projectsList.map((proj) => (
              <Option key={proj.id} value={proj.id}>
                {proj.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="workType"
          label="Work type"
          rules={[{ required: true, message: "Please select a work type!" }]}
        >
          <Select
            placeholder="Select work type"
            onChange={handleWorkTypeChange}
          >
            <Option value="Task">
              <CheckSquareOutlined style={{ marginRight: 8 }} /> Task
            </Option>
            <Option value="Bug">
              <BugOutlined style={{ marginRight: 8 }} /> Bug
            </Option>
            <Option value="Test Case">
              <FileTextOutlined style={{ marginRight: 8 }} /> Test Case
            </Option>
          </Select>
        </Form.Item>

        {selectedWorkType !== "Test Case" && (
          <Form.Item
            name="summary"
            label="Summary"
            rules={[{ required: true, message: "Please enter a summary!" }]}
          >
            <Input placeholder="Enter a concise summary or title" />
          </Form.Item>
        )}

        {selectedWorkType === "Test Case" && (
          <>
            <Form.Item label="Test Case ID">
              <Input placeholder="Auto-generated" disabled />
            </Form.Item>
            <Form.Item
              name="testCaseName"
              label="Test Case Name"
              rules={[
                { required: true, message: "Please enter Test Case Name!" },
              ]}
            >
              <Input placeholder="Enter Test Case Name" />
            </Form.Item>

            <Form.Item label="Steps">
              {testCaseSteps.map((step, index) => (
                <div key={step.id} style={{ display: "flex", marginBottom: 8 }}>
                  <Input
                    placeholder={`Step ${index + 1}`}
                    value={step.value}
                    onChange={(e) => handleStepChange(step.id, e.target.value)}
                    style={{ marginRight: 8 }}
                  />
                  {testCaseSteps.length > 1 && (
                    <Button
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveStep(step.id)}
                      danger
                    />
                  )}
                </div>
              ))}
              <Button
                type="dashed"
                onClick={handleAddStep}
                icon={<PlusOutlined />}
              >
                Add Step
              </Button>
            </Form.Item>

            <Form.Item
              name="expectedResult"
              label="Expected Result"
              rules={[
                { required: true, message: "Please enter expected result!" },
              ]}
            >
              <Input.TextArea rows={3} placeholder="Enter expected result" />
            </Form.Item>

            <Form.Item name="actualResult" label="Actual Result">
              <Input.TextArea
                rows={3}
                placeholder="Enter actual result (optional, update after test)"
              />
            </Form.Item>

            <Form.Item name="linkedTask" label="Linked Task">
              <Select
                placeholder="Select linked task (optional)"
                loading={loadingTasks}
                disabled={!form.getFieldValue("project") || loadingTasks}
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option.children || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {tasksList.map((task) => (
                  <Option key={task.id} value={task.id}>
                    {task.summary}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </>
        )}

        <Form.Item
          label="Description"
          // No 'name' prop for direct form binding with Draft.js basic setup
          // rules for required can be handled manually in handleCreateOk if needed
        >
          <div
            style={editorStyle}
            onClick={focusEditor} // Call focusEditor on click
          >
            <Editor
              ref={editorRef} // Assign the ref to the Editor
              editorState={editorState}
              onChange={handleEditorChange}
              handleKeyCommand={handleKeyCommand}
              placeholder="Enter detailed description... (Ctrl+B for bold, Ctrl+I for italic)"
            />
          </div>
        </Form.Item>

        {selectedWorkType === "Task" && (
          <Form.Item name="linkedTestCase" label="Test Case Linked">
            <Select
              placeholder="Select linked test case (optional)"
              loading={loadingTestCases}
              disabled={!form.getFieldValue("project") || loadingTestCases}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option.children || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={handleLinkedTestCaseChange}
            >
              {testCasesList.map((tc) => (
                <Option key={tc.id} value={tc.id}>
                  {tc.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {selectedWorkType === "Bug" && (
          <>
            <Form.Item name="linkedTestCase" label="Linked Test Case">
              <Select
                placeholder="Select linked test case (optional)"
                loading={loadingTestCases}
                disabled={!form.getFieldValue("project") || loadingTestCases}
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option.children || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={handleLinkedTestCaseChange}
              >
                {testCasesList.map((tc) => (
                  <Option key={tc.id} value={tc.id}>
                    {tc.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="stepFailed" label="Step Failed">
              <Select
                placeholder="Select failed step (optional)"
                allowClear
                showSearch
                disabled={
                  !form.getFieldValue("linkedTestCase") ||
                  stepsOfLinkedTestCase.length === 0
                }
                optionFilterProp="children"
                filterOption={
                  (input, option) =>
                    (option.children[2] || "")
                      .toLowerCase()
                      .includes(input.toLowerCase()) // Filter on step text
                }
              >
                {stepsOfLinkedTestCase.map((step, index) => (
                  <Option key={index} value={index + 1}>
                    {`Step ${index + 1}: ${step}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </>
        )}

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: "Please select a status!" }]}
        >
          <Select placeholder="Select status">
            <Option value="To Do">To Do</Option>
            <Option value="In Progress">In Progress</Option>
            <Option value="In Review">In Review</Option>
            <Option value="Done">Done</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="assignee"
          label="Assignee"
          rules={[{ required: true, message: "Please select an assignee!" }]}
        >
          <Select
            placeholder="Select assignee"
            loading={loadingUsers}
            allowClear
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option.children.props.children[1] || "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {usersList.map((user) => (
              <Option key={user.uid} value={user.uid}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || user.email}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        marginRight: 8,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        marginRight: 8,
                        backgroundColor: "#ccc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                      }}
                    >
                      {(user.displayName || user.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  {user.displayName || user.email}
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="Priority">
          <Select defaultValue="Medium">
            <Option value="Highest">
              <WarningFilled style={{ marginRight: 8, color: "red" }} /> Highest
            </Option>
            <Option value="High">
              <ArrowUpOutlined style={{ marginRight: 8, color: "orange" }} />{" "}
              High
            </Option>
            <Option value="Medium">
              <MinusOutlined style={{ marginRight: 8, color: "blue" }} /> Medium
            </Option>
            <Option value="Low">
              <ArrowDownOutlined style={{ marginRight: 8, color: "green" }} />{" "}
              Low
            </Option>
            <Option value="Lowest">
              <ArrowDownOutlined
                style={{ marginRight: 8, color: "limegreen" }}
              />{" "}
              Lowest
            </Option>
          </Select>
        </Form.Item>

        <Form.Item name="startDate" label="Start date">
          <DatePicker
            style={{ width: "100%" }}
            showTime
            format="MMMM D, YYYY [at] h:mm:ss A [UTC]Z"
            placeholder="Select start date and time (optional)"
          />
        </Form.Item>

        <Form.Item
          name="dueDate"
          label="Due date"
          rules={[{ required: true, message: "Please select a due date!" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            showTime
            format="MMMM D, YYYY [at] h:mm:ss A [UTC]Z"
            placeholder="Select date and time"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default CreateIssueModal;
