import classNames from "classnames/bind";
import styles from "./ActionUser.module.scss";
import { db } from "~/components/services/firebase";
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { Popconfirm, Modal, message, Tooltip, Input, Button, Spin } from "antd";
import { useState, useEffect } from "react";
const cx = classNames.bind(styles);

function ActionUser({ userId, memberId, role, onAction, status }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const [addRoleMode, setAddRoleMode] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [addingRole, setAddingRole] = useState(false);

  // Get productId from localStorage
  const productId = localStorage.getItem("selectedProduct-" + (userId || ""));

  useEffect(() => {
    // Fetch default roles from Firestore (collection 'role') and custom roles from 'role_product_by_user'
    const fetchRoles = async () => {
      setFetchingRoles(true);
      try {
        // 1. Fetch default roles
        const defaultRolesSnap = await getDocs(collection(db, "role"));
        const defaultRoles = defaultRolesSnap.docs.map((docSnap) => ({
          name: docSnap.data().role_name,
          description: docSnap.data().description,
        }));
        // 2. Fetch custom roles for this product
        let customRoles = [];
        if (productId) {
          const q = collection(db, "role_product_by_user");
          const querySnapshot = await getDocs(q);
          customRoles = querySnapshot.docs
            .map((doc) => doc.data())
            .filter((r) => r.product_id === productId)
            .map((r) => ({ name: r.name, description: r.description }));
        }
        // 3. Merge: custom role trùng tên sẽ override default, còn lại thì thêm vào
        const merged = defaultRoles.map((def) => {
          const found = customRoles.find((cr) => cr.name === def.name);
          return found ? { ...def, description: found.description } : def;
        });
        customRoles.forEach((cr) => {
          if (!merged.find((r) => r.name === cr.name)) merged.push(cr);
        });
        setRoles(merged);
      } catch (err) {
        message.error("Cannot load roles from Firestore");
      }
      setFetchingRoles(false);
    };
    if (modalOpen) fetchRoles();
    // eslint-disable-next-line
  }, [modalOpen]);

  const handleSuspend = async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "product_members", memberId), {
        status: "Inactive",
      });
      if (onAction) onAction("suspend");
      message.success("User suspended");
    } catch (err) {
      message.error(err.message || "Missing or insufficient permissions.");
    }
    setLoading(false);
  };

  const handleRestore = async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "product_members", memberId), {
        status: "Active",
      });
      if (onAction) onAction("restore");
      message.success("User restored");
    } catch (err) {
      message.error(err.message || "Missing or insufficient permissions.");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "product_members", memberId));
      if (onAction) onAction("delete");
      message.success("User deleted");
    } catch (err) {
      message.error(err.message || "Missing or insufficient permissions.");
    }
    setLoading(false);
  };

  const handleChangeRole = async (newRole) => {
    if (!memberId) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "product_members", memberId), {
        role_in_product: newRole,
      });
      setModalOpen(false);
      if (onAction) onAction("changeRole");
      message.success("Role updated");
    } catch (err) {
      message.error(err.message || "Missing or insufficient permissions.");
    }
    setLoading(false);
  };

  const handleAddRole = async () => {
    if (!newRole.name || !newRole.description) {
      message.warning("Please enter the role name and description.");
      return;
    }
    setAddingRole(true);
    try {
      await addDoc(collection(db, "role_product_by_user"), {
        ...newRole,
        product_id: productId,
      });
      setRoles((prev) => [...prev, { ...newRole }]);
      setNewRole({ name: "", description: "" });
      setAddRoleMode(false);
      message.success("New role added!");
    } catch (err) {
      message.error("Cannot add new role: " + (err.message || ""));
    }
    setAddingRole(false);
  };

  const isAdmin = role && role.includes("Admin");

  return (
    <div className={cx("container")}>
      <div
        className={cx("action-item")}
        onClick={() => onAction && onAction("showDetails")}
      >
        Show details
      </div>
      {!isAdmin && (
        <>
          <div className={cx("action-item")} onClick={() => setModalOpen(true)}>
            Change Role
          </div>
          {status === "Active" && (
            <Popconfirm
              title="Are you sure to suspend this user?"
              onConfirm={handleSuspend}
              okText="Yes"
              cancelText="No"
            >
              <div className={cx("action-item")} style={{ color: "#faad14" }}>
                Suspend access
              </div>
            </Popconfirm>
          )}
          {status === "Inactive" && (
            <Popconfirm
              title="Are you sure to restore this user?"
              onConfirm={handleRestore}
              okText="Yes"
              cancelText="No"
            >
              <div className={cx("action-item")} style={{ color: "#52c41a" }}>
                Restore access
              </div>
            </Popconfirm>
          )}
          <Popconfirm
            title="Are you sure to delete this user?"
            onConfirm={handleDelete}
            okText="Yes"
            cancelText="No"
          >
            <div className={cx("action-item")} style={{ color: "#f5222d" }}>
              Delete user
            </div>
          </Popconfirm>
        </>
      )}
      <Modal
        open={modalOpen}
        title="Change Role"
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        {fetchingRoles ? (
          <Spin />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {roles.map((r) => (
              <Tooltip key={r.name} title={r.description} placement="right">
                <button
                  style={{
                    padding: 8,
                    marginBottom: 4,
                    background:
                      role && role.includes(r.name) ? "#e3f2fd" : "#fff",
                    border: "1px solid #1976d2",
                    color: "#1976d2",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                  disabled={loading}
                  onClick={() => handleChangeRole(r.name)}
                >
                  {r.name}
                </button>
              </Tooltip>
            ))}
            {addRoleMode ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  marginTop: 8,
                }}
              >
                <Input
                  placeholder="New role name"
                  value={newRole.name}
                  onChange={(e) =>
                    setNewRole({ ...newRole, name: e.target.value })
                  }
                  style={{ marginBottom: 4 }}
                />
                <Input.TextArea
                  placeholder="Role description"
                  value={newRole.description}
                  onChange={(e) =>
                    setNewRole({ ...newRole, description: e.target.value })
                  }
                  rows={2}
                  style={{ marginBottom: 4 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    type="primary"
                    loading={addingRole}
                    onClick={handleAddRole}
                  >
                    Add
                  </Button>
                  <Button
                    onClick={() => setAddRoleMode(false)}
                    disabled={addingRole}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="dashed"
                style={{ marginTop: 8 }}
                onClick={() => setAddRoleMode(true)}
              >
                + Add new role
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ActionUser;
