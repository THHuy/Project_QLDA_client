import { useEffect, useState } from "react";
import { Table, Tag, Button, message, Popconfirm, Dropdown, Menu } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import classNames from "classnames/bind";
import styles from "./TableProject.module.scss";
import { db } from "~/components/services/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { useAuth } from "~/components/hook/useAuth/useAuth";

const cx = classNames.bind(styles);

function TableProject({ refreshTrigger }) {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  // Fetch projects based on selected product and user membership
  useEffect(() => {
    const fetchProjectsForSelectedProduct = async () => {
      if (!currentUser) {
        setProjects([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const selectedProductId = localStorage.getItem(
        `selectedProduct-${currentUser.uid}`
      );

      if (!selectedProductId) {
        setProjects([]);
        setLoading(false);
        // message.info("No product selected. Please select a product to view projects.");
        return;
      }

      try {
        // 1. Check if the current user is a member of the selected product
        const membershipQuery = query(
          collection(db, "product_members"),
          where("user_id", "==", currentUser.uid),
          where("product_id", "==", selectedProductId)
        );
        const membershipSnapshot = await getDocs(membershipQuery);

        if (membershipSnapshot.empty) {
          // User is not a member of the selected product
          setProjects([]);
          //   message.warn("You are not a member of the selected product, or no projects found.");
          setLoading(false);
          return;
        }

        // 2. User is a member, fetch projects for that product_id
        const projectsQuery = query(
          collection(db, "project"),
          where("product_id", "==", selectedProductId) // Assuming projects in 'project' collection have a 'product_id' field
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const fetchedProjects = projectsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setProjects(fetchedProjects);
      } catch (err) {
        message.error("Cannot fetch projects: " + (err.message || ""));
        setProjects([]); // Clear projects on error
      }
      setLoading(false);
    };

    fetchProjectsForSelectedProduct();
  }, [currentUser, refreshTrigger]); // Re-fetch if currentUser changes

  // Lấy tất cả users để ánh xạ manager_id -> displayName
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const data = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          uid: doc.id,
        }));
        setUsers(data);
      } catch (err) {
        message.error("Cannot fetch users: " + (err.message || ""));
      }
    };
    fetchUsers();
  }, []);

  // Helper: lấy tên user từ uid
  const getManagerName = (uid) => {
    const user = users.find((u) => u.uid === uid);
    return user ? user.displayName : uid;
  };

  const handleStatusChange = async (record, newStatus) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "project", record.id), {
        status_id: newStatus,
      });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === record.id ? { ...p, status_id: newStatus } : p
        )
      );
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Project status updated!",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        customClass: {
          popup: "swal2-toast-custom",
        },
      });
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Update failed: " + (err.message || ""),
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        customClass: {
          popup: "swal2-toast-custom",
        },
      });
    }
    setLoading(false);
  };

  const handleDeleteProject = async (projectId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "project", projectId));
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project.id !== projectId)
      );
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Project deleted successfully!",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        customClass: {
          popup: "swal2-toast-custom",
        },
      });
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Failed to delete project: " + (err.message || ""),
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        customClass: {
          popup: "swal2-toast-custom",
        },
      });
    }
    setLoading(false);
  };

  // Định nghĩa cột cho bảng
  const columns = [
    { title: "Project Name", dataIndex: "project_name", key: "project_name" },
    {
      title: "Lead",
      dataIndex: "manager_id",
      key: "manager_id",
      render: (manager_id) => getManagerName(manager_id),
    },
    { title: "Start Date", dataIndex: "start_date", key: "start_date" },
    { title: "End Date", dataIndex: "end_date", key: "end_date" },
    {
      title: "Status",
      dataIndex: "status_id",
      key: "status_id",
      render: (status_id) =>
        status_id === 1 ? (
          <Tag color="green">ACTIVE</Tag>
        ) : (
          <Tag color="red">INACTIVE</Tag>
        ),
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (created_at) =>
        created_at && created_at.toDate
          ? created_at.toDate().toLocaleString()
          : String(created_at),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        const menu = (
          <Menu>
            <Menu.Item key="view">
              <Button
                type="link"
                onClick={() => alert(`View project ${record.project_name}`)}
              >
                View
              </Button>
            </Menu.Item>
            <Menu.Item key="status">
              {record.status_id === 1 ? (
                <Popconfirm
                  title="Set project to INACTIVE?"
                  onConfirm={() => handleStatusChange(record, 0)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger type="link" loading={loading}>
                    Set Inactive
                  </Button>
                </Popconfirm>
              ) : (
                <Popconfirm
                  title="Set project to ACTIVE?"
                  onConfirm={() => handleStatusChange(record, 1)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="link"
                    style={{ color: "green" }}
                    loading={loading}
                  >
                    Set Active
                  </Button>
                </Popconfirm>
              )}
            </Menu.Item>
            <Menu.Item key="delete">
              <Popconfirm
                title="Are you sure you want to delete this project?"
                onConfirm={() => handleDeleteProject(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" danger loading={loading}>
                  Delete
                </Button>
              </Popconfirm>
            </Menu.Item>
          </Menu>
        );

        return (
          <Dropdown overlay={menu} trigger={["hover"]}>
            <Button
              type="text"
              icon={<EllipsisOutlined style={{ fontSize: "20px" }} />}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className={cx("container")}>
      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
}

export default TableProject;
