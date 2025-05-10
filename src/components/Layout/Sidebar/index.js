import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./Sidebar.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation } from "react-router-dom";
import { faTable } from "@fortawesome/free-solid-svg-icons";
import {
  UserOutlined,
  RocketOutlined,
  AlignLeftOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Menu, message } from "antd";
import { useNavigate } from "react-router-dom";
import { db } from "~/components/services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "~/components/hook/useAuth/useAuth";

// import Aurora from "./Aurora";
const cx = classNames.bind(styles);

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [currentRoutes, setCurrentRoutes] = useState({});
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    const fetchProjectsForSelectedProduct = async () => {
      if (!currentUser) {
        setProjects([]);
        setIsLoadingProjects(false);
        return;
      }

      setIsLoadingProjects(true);
      const selectedProductId = localStorage.getItem(
        `selectedProduct-${currentUser.uid}`
      );

      if (!selectedProductId) {
        setProjects([]);
        setIsLoadingProjects(false);
        // message.info("No product selected. Please select a product to see projects.");
        return;
      }

      try {
        const membershipQuery = query(
          collection(db, "product_members"),
          where("user_id", "==", currentUser.uid),
          where("product_id", "==", selectedProductId)
        );
        const membershipSnapshot = await getDocs(membershipQuery);

        if (membershipSnapshot.empty) {
          setProjects([]);
          setIsLoadingProjects(false);
          return;
        }

        const projectsQuery = query(
          collection(db, "project"),
          where("product_id", "==", selectedProductId)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const fetchedProjects = projectsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().project_name,
        }));
        setProjects(fetchedProjects);
      } catch (err) {
        message.error(
          "Failed to fetch projects for sidebar: " + (err.message || "")
        );
        setProjects([]);
      }
      setIsLoadingProjects(false);
    };

    fetchProjectsForSelectedProduct();
  }, [currentUser]);

  useEffect(() => {
    const dynamicProjectItems = projects.map((project) => ({
      key: `project-${project.id}`,
      label: project.name,
      icon: <AlignLeftOutlined />,
    }));

    const initialItems = [
      {
        key: "sub1",
        label: "For you",
        icon: <UserOutlined />,
      },
      {
        key: "2",
        label: "Project",
        icon: <RocketOutlined />,
        children: [
          {
            key: "g1",
            label: "Recent",
            type: "group",
            children: [
              ...dynamicProjectItems,
              {
                key: "sub2",
                label: "View all projects",
                icon: <AlignLeftOutlined />,
              },
            ],
          },
        ],
      },
      {
        key: "3",
        label: "Dashboards",
        icon: <FontAwesomeIcon icon={faTable} />,
        children: [
          {
            key: "g1_dash",
            label: "Once you visit or create dashboards, they'll show up here.",
            type: "group",
            children: [
              {
                key: "sub3",
                label: "View all dashboards",
                icon: <AlignLeftOutlined />,
              },
            ],
          },
        ],
      },
      { key: "sub4", label: "Teams", icon: <TeamOutlined /> },
    ];
    setMenuItems(initialItems);

    const newRoutes = {
      sub1: "/your-work",
      sub2: "/projects",
      sub3: "/dashboard",
      sub4: "/teams",
    };
    projects.forEach((project) => {
      // Default to "timeline" slug when navigating from sidebar
      newRoutes[`project-${project.id}`] = `/projects/id/${project.id}/backlog`;
    });
    setCurrentRoutes(newRoutes);
  }, [projects]);

  const getActiveKey = () => {
    const path = location.pathname;

    // 1. Check for specific project routes first
    for (const project of projects) {
      const projectBasePath = `/projects/id/${project.id}/`;
      if (path.startsWith(projectBasePath)) {
        return `project-${project.id}`;
      }
    }

    // 2. Check for other main routes using a base configuration
    const baseRoutes = {
      sub1: "/your-work",
      sub2: "/projects",
      sub3: "/dashboard",
      sub4: "/teams",
    };

    if (path === baseRoutes.sub1 || path.startsWith(baseRoutes.sub1 + "/")) {
      return "sub1";
    }
    if (path === baseRoutes.sub4 || path.startsWith(baseRoutes.sub4 + "/")) {
      return "sub4";
    }
    // Ensure it's not a specific project page already caught by the loop above
    if (path === baseRoutes.sub2 && !path.startsWith("/projects/id/")) {
      return "sub2";
    }
    if (path === baseRoutes.sub3 || path.startsWith(baseRoutes.sub3 + "/")) {
      return "sub3";
    }

    return "sub1"; // Default or fallback active key
  };

  const onClick = (e) => {
    if (currentRoutes[e.key]) {
      navigate(currentRoutes[e.key]);
    }
  };

  return (
    <div className={cx("Sidebar")}>
      <Menu
        onClick={onClick}
        style={{ width: 256 }}
        selectedKeys={[getActiveKey()]}
        defaultOpenKeys={[
          "3", // Always try to open the 'Project' section by default
          getActiveKey().startsWith("project-") ? "g1" : null, // If a project is active, open the 'Recent' group
        ].filter(Boolean)}
        mode="inline"
        items={menuItems}
      />
    </div>
  );
}

export default Sidebar;
