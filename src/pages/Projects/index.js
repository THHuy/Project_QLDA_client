import classNames from "classnames/bind";
import styles from "./Projects.module.scss";
import LoginInput from "~/components/InputLogin";
import { SearchOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import TableProject from "~/components/Table/TableProject";
import CreateProject from "~/components/CreateProject";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import { db } from "~/components/services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const cx = classNames.bind(styles);

function Projects() {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [userRoleInProduct, setUserRoleInProduct] = useState(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) {
        setUserRoleInProduct(null);
        setIsLoadingRole(false);
        return;
      }
      setIsLoadingRole(true);
      const selectedProductId = localStorage.getItem(
        `selectedProduct-${currentUser.uid}`
      );

      if (!selectedProductId) {
        setUserRoleInProduct(null);
        setIsLoadingRole(false);
        return;
      }

      try {
        const q = query(
          collection(db, "product_members"),
          where("user_id", "==", currentUser.uid),
          where("product_id", "==", selectedProductId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const memberDoc = querySnapshot.docs[0].data();
          setUserRoleInProduct(memberDoc.role_in_product);
        } else {
          setUserRoleInProduct(null);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRoleInProduct(null);
      }
      setIsLoadingRole(false);
    };

    fetchUserRole();
  }, [currentUser]);

  const canCreateProject =
    !isLoadingRole &&
    (userRoleInProduct === "Admin" || userRoleInProduct === "Project Manager");
  const showModal = () => {
    if (canCreateProject) {
      setIsModalOpen(true);
    } else {
      console.log("User does not have permission to create projects.");
    }
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
  };

  const handleProjectCreated = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <div className={cx("container-fluid")}>
      <div className={cx("header-content")}>
        <div className={cx("title")}>
          <h1>Projects</h1>
          <div className={cx("btn-title")}>
            <button
              className={cx("btn-create")}
              onClick={showModal}
              disabled={!canCreateProject || isLoadingRole}
            >
              Create project
            </button>
          </div>
        </div>
        <div className={cx("search")}>
          <LoginInput
            type="text"
            icon={<SearchOutlined />}
            placeholder="Search Projects"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className={cx("content-project")}>
        <TableProject refreshTrigger={refreshKey} />
      </div>
      <CreateProject
        open={isModalOpen}
        onCancel={handleCancelModal}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}

export default Projects;
