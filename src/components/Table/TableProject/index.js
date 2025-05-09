import { useEffect, useState } from "react";
import { Table, Tag, Button, message, Popconfirm } from "antd";
import classNames from "classnames/bind";
import styles from "./TableProject.module.scss";
import { db } from "~/components/services/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";

const cx = classNames.bind(styles);

function TableProject() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy tất cả project từ Firestore
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "project"));
        const data = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setProjects(data);
      } catch (err) {
        message.error("Cannot fetch projects: " + (err.message || ""));
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

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
      render: (_, record) => (
        <>
          <Button
            type="link"
            onClick={() => alert(`View project ${record.project_name}`)}
          >
            View
          </Button>
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
              <Button type="link" style={{ color: "green" }} loading={loading}>
                Set Active
              </Button>
            </Popconfirm>
          )}
        </>
      ),
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
