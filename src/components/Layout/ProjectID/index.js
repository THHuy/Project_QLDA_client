import { getUserProduct } from "~/utils/productStorage";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { Breadcrumb } from "antd";
import NavbarProject from "./NavbarProject";
import classNames from "classnames/bind";
import styles from "./ProjectID.module.scss";
import { db } from "~/components/services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useParams } from "react-router-dom";

const cx = classNames.bind(styles);

function ProjectID() {
  const { currentUser } = useAuth();
  const { projectId } = useParams();
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !projectId) return;

      // Fetch project name
      try {
        const projectRef = doc(db, "project", projectId);
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          setProjectName(projectData.project_name || "Project");
        }
      } catch (error) {
        console.error("Error fetching project data:", error);
      }
    };

    fetchData();
  }, [currentUser, projectId]);

  return (
    <div className={cx("container-fluid")}>
      <div className={cx("header-content")}>
        <Breadcrumb
          items={[
            {
              title: <a href="/projects">Projects</a>,
            },
            {
              title: (
                <a href={`/projects/id/${projectId}/backlog`}>{projectName}</a>
              ),
            },
          ]}
        />
        <div className={cx("title-project")}>
          <h1>Board</h1>
        </div>
      </div>
      <div className={cx("body-content")}>
        <NavbarProject />
      </div>
    </div>
  );
}

export default ProjectID;
