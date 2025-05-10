import { getUserProduct } from "~/utils/productStorage";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { Breadcrumb } from "antd";
import NavbarProject from "./NavbarProject";
import classNames from "classnames/bind";
import styles from "./ProjectID.module.scss";
const cx = classNames.bind(styles);
function ProjectID() {
  const { currentUser } = useAuth();
  const [productId, setProductId] = useState(null);
  useEffect(() => {
    const fetchProductId = async () => {
      const productId = await getUserProduct(currentUser.uid);
      setProductId(productId);
    };
    fetchProductId();
  }, [currentUser]);
  return (
    <div className={cx("container-fluid")}>
      <div className={cx("header-content")}>
        <Breadcrumb
          items={[
            {
              title: <a href="/projects">Projects</a>,
            },
            {
              title: <a href={`/projects/id/${productId}`}>Project ID</a>,
            },
          ]}
        />
        <div className={cx("title-project")}>
          <input placeholder="P" />
          <FontAwesomeIcon icon={faEllipsis} />
        </div>
      </div>
      <div className={cx("body-content")}>
        <NavbarProject />
      </div>
    </div>
  );
}

export default ProjectID;
