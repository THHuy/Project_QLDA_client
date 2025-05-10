import React, { useState, useEffect, useRef } from "react";
import { Modal, Form, Select, DatePicker, Input } from "antd";
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
} from "@ant-design/icons";
// import { useAuth } from "~/components/hook/useAuth/useAuth"; // Removed as currentUser is a prop
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  // serverTimestamp, // Tùy chọn: dùng cho thời gian phía server
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

  const [projectsList, setProjectsList] = useState([]); // Initialize as empty
  const [loadingProjects, setLoadingProjects] = useState(false);
  // Replace descriptionHtml state with editorState for Draft.js
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const editorRef = useRef(null); // Create a ref for the Editor

  useEffect(() => {
    const fetchProjects = async () => {
      if (!open || !currentUser) {
        setProjectsList([]); // Clear projects if modal not open or no user
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
        // Adjust collection name to 'project' (singular) to match security rules
        const projectsQuery = query(
          collection(db, "project"), // Changed from "projects" to "project"
          where("product_id", "==", selectedProductId)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const fetchedProjects = projectsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().project_name, // Assuming project name field is project_name like in TableProject
          ...doc.data(), // Spread the rest of the project data
        }));

        if (fetchedProjects.length === 0) {
          console.warn(
            `CreateIssueModal: Không tìm thấy dự án nào cho Product ID: ${selectedProductId}`
          );
        }
        setProjectsList(fetchedProjects);
      } catch (error) {
        console.error("CreateIssueModal: Lỗi khi tải dự án:", error);
        setProjectsList([]); // Reset on error
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
      // Reset Draft.js editor state on modal open
      setEditorState(EditorState.createEmpty());
    }
  }, [open, currentUser]);

  useEffect(() => {
    if (open && currentUser) {
      form.setFieldsValue({
        summary: "", // Initialize summary field
        // description is handled by editorState state
        assignee: currentUser.uid,
        priority: "Medium",
        status: "To Do",
        // Set default project after projects are loaded, if any
        project: projectsList.length > 0 ? projectsList[0].id : undefined,
        dueDate: null, // Initialize dueDate
      });
      // Also reset Draft.js editor if modal re-opens with old state
      setEditorState(EditorState.createEmpty());
    } else if (!open) {
      form.resetFields(); // Reset form when modal is closed externally
      // Ensure Draft.js editor is cleared when modal is closed externally
      setEditorState(EditorState.createEmpty());
    }
  }, [open, currentUser, form, projectsList]); // Added projectsList to dependencies for default project setting

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
      message.error("Mô tả là bắt buộc và không được để trống.");
      return;
    }
    const collectionName = values.workType === "Task" ? "tasks" : "bugs";
    const dataToSave = {
      summary: values.summary,
      project_id: values.project,
      assignee_id: values.assignee,
      priority: values.priority,
      description: rawContentState, // Lưu trữ raw content state của Draft.js
      due_date: values.dueDate ? values.dueDate.valueOf() : null, // Lưu timestamp milliseconds
      status: values.status,
      work_type: values.workType,
      created_at: new Date().getTime(), // Lưu timestamp milliseconds; hoặc dùng serverTimestamp()
      // reporter_id: currentUser?.uid, // Đã được bạn xóa ở bước trước
      // product_id: localStorage.getItem(`selectedProduct-${currentUser?.uid}`), // Đã được bạn xóa ở bước trước
    };

    try {
      // Hiện message loading (tùy chọn)
      // message.loading({ content: 'Đang tạo issue...', key: 'creatingIssue' });

      const docRef = await addDoc(collection(db, collectionName), dataToSave);
      message.success({
        content: `Đã tạo '${values.summary}' thành công! (ID: ${docRef.id})`,
        key: "creatingIssue",
        duration: 3,
      });
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Create '${values.summary}' successfully!`,
        timer: 2000,
        showConfirmButton: false,
      });

      onClose();
      form.resetFields();
      setEditorState(EditorState.createEmpty());
    } catch (e) {
      console.error("Lỗi khi thêm document: ", e);
      // message.error({ content: `Tạo issue thất bại: ${e.message}`, key: 'creatingIssue', duration: 3 });
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: `Create '${values.summary}' failed: ${
          e.message || "Please try again."
        }`,
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
          >
            {/* Replace with actual dynamic project data */}
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
          <Select placeholder="Select work type">
            <Option value="Task">
              <CheckSquareOutlined style={{ marginRight: 8 }} /> Task
            </Option>
            <Option value="Bug">
              <BugOutlined style={{ marginRight: 8 }} /> Bug
            </Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="summary"
          label="Summary"
          rules={[{ required: true, message: "Please enter a summary!" }]}
        >
          <Input placeholder="Enter a concise summary or title" />
        </Form.Item>

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

        <Form.Item name="dueDate" label="Due date">
          <DatePicker
            style={{ width: "100%" }}
            showTime
            format="YYYY-MM-DD HH:mm"
            placeholder="Select date and time"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default CreateIssueModal;
