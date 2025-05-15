import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Empty, Avatar, message, Tabs } from "antd";
import classNames from "classnames/bind";
import styles from "./ForYou.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup, faBookmark } from "@fortawesome/free-solid-svg-icons";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import { db } from "~/components/services/firebase";
import moment from "moment";

const cx = classNames.bind(styles);

function ForYou() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [assignedItems, setAssignedItems] = useState([]);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    if (!currentUser) {
      setProducts([]);
      return;
    }

    try {
      // 1. Lấy tất cả product mà user là owner
      const ownerQ = query(
        collection(db, "products"),
        where("owner_id", "==", currentUser.uid)
      );
      const ownerSnapshot = await getDocs(ownerQ);
      const ownerProducts = ownerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 2. Lấy tất cả product_id mà user là thành viên (status Active)
      const memberQ = query(
        collection(db, "product_members"),
        where("user_id", "==", currentUser.uid),
        where("status", "==", "Active")
      );
      const memberSnapshot = await getDocs(memberQ);
      const memberProductIds = memberSnapshot.docs.map(
        (doc) => doc.data().product_id
      );

      // 3. Lấy thông tin product tương ứng (trừ product đã là owner)
      const memberProducts = [];
      for (const pid of memberProductIds) {
        if (!ownerProducts.find((p) => p.id === pid)) {
          const prodDoc = await getDoc(doc(db, "products", pid));
          if (prodDoc.exists()) {
            memberProducts.push({ id: prodDoc.id, ...prodDoc.data() });
          }
        }
      }

      setProducts([...ownerProducts, ...memberProducts]);
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Failed to fetch products.");
    }
  }, [currentUser]);

  const fetchWorkItems = useCallback(async () => {
    if (!currentUser) {
      setWorkItems([]);
      setAssignedItems([]);
      return;
    }

    try {
      // Fetch items worked on (updated by user)
      const workedOnQuery = query(
        collection(db, "item_activities"),
        where("user_id", "==", currentUser.uid),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      const workedOnSnapshot = await getDocs(workedOnQuery);
      const workedOnItems = await Promise.all(
        workedOnSnapshot.docs.map(async (doc) => {
          const data = { id: doc.id, ...doc.data() };
          // Fetch product info
          const productDoc = await getDoc(doc(db, "products", data.product_id));
          return {
            ...data,
            product: productDoc.exists() ? productDoc.data() : null,
          };
        })
      );
      setWorkItems(workedOnItems);

      // Fetch items assigned to user
      const assignedQuery = query(
        collection(db, "work_items"),
        where("assignee", "==", currentUser.uid),
        where("status", "!=", "Done"),
        orderBy("created_at", "desc")
      );
      const assignedSnapshot = await getDocs(assignedQuery);
      const assignedItems = await Promise.all(
        assignedSnapshot.docs.map(async (doc) => {
          const data = { id: doc.id, ...doc.data() };
          // Fetch product info
          const productDoc = await getDoc(doc(db, "products", data.product_id));
          return {
            ...data,
            product: productDoc.exists() ? productDoc.data() : null,
          };
        })
      );
      setAssignedItems(assignedItems);
    } catch (error) {
      console.error("Error fetching work items:", error);
      message.error("Failed to fetch work items.");
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProducts();
    fetchWorkItems();
  }, [fetchProducts, fetchWorkItems]);

  const handleProductClick = (productId) => {
    localStorage.setItem(`selectedProduct-${currentUser.uid}`, productId);
    navigate(`/your-work/${productId}`);
  };

  const handleWorkItemClick = (productId, itemId) => {
    localStorage.setItem(`selectedProduct-${currentUser.uid}`, productId);
    navigate(`/your-work/${productId}/item/${itemId}`);
  };

  const renderTimeGroup = (items, groupTitle) => {
    if (!items || items.length === 0) return null;

    const today = moment().startOf("day");
    const yesterday = moment().subtract(1, "day").startOf("day");
    const lastWeek = moment().subtract(1, "week").startOf("day");
    const lastMonth = moment().subtract(1, "month").startOf("day");

    const groupedItems = {
      TODAY: [],
      YESTERDAY: [],
      IN_THE_LAST_WEEK: [],
      IN_THE_LAST_MONTH: [],
      OLDER: [],
    };

    items.forEach((item) => {
      const itemDate = moment(item.timestamp || item.userId);
      if (itemDate.isSameOrAfter(today)) {
        groupedItems.TODAY.push(item);
      } else if (itemDate.isSameOrAfter(yesterday)) {
        groupedItems.YESTERDAY.push(item);
      } else if (itemDate.isSameOrAfter(lastWeek)) {
        groupedItems.IN_THE_LAST_WEEK.push(item);
      } else if (itemDate.isSameOrAfter(lastMonth)) {
        groupedItems.IN_THE_LAST_MONTH.push(item);
      } else {
        groupedItems.OLDER.push(item);
      }
    });

    return (
      <div className={cx("work-items-section")}>
        <div className={cx("section-header")}>
          <h3>{groupTitle}</h3>
        </div>
        <div className={cx("work-items-list")}>
          {Object.entries(groupedItems).map(([group, groupItems]) => {
            if (groupItems.length === 0) return null;
            return (
              <div key={group} className={cx("time-group")}>
                <div className={cx("time-label")}>
                  {group.replace(/_/g, " ")}
                </div>
                {groupItems.map((item) => (
                  <div
                    key={item.id}
                    className={cx("work-item")}
                    onClick={() =>
                      handleWorkItemClick(item.product_id, item.id)
                    }
                  >
                    <div className={cx("work-item-header")}>
                      <FontAwesomeIcon
                        icon={faBookmark}
                        className={cx("item-icon")}
                      />
                      <div className={cx("item-info")}>
                        <div className={cx("item-title")}>{item.title}</div>
                        <div className={cx("item-subtitle")}>
                          {item.item_type} · {item.product?.product_name}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cx("container-fluid")}>
      <h2>For You</h2>

      <div className={cx("projects-section")}>
        <div className={cx("section-header")}>
          <h3>Recent projects</h3>
          <Link to="/projects" className={cx("view-all")}>
            View all projects
          </Link>
        </div>

        <div className={cx("projects-grid")}>
          {products.length > 0 ? (
            products.map((product) => (
              <div
                key={product.id}
                className={cx("project-card")}
                onClick={() => handleProductClick(product.id)}
              >
                <div className={cx("project-header")}>
                  <Avatar shape="square" className={cx("project-icon")}>
                    {product.product_name?.[0]}
                  </Avatar>
                  <div className={cx("project-info")}>
                    <h3>{product.product_name}</h3>
                    <div className={cx("project-type")}>
                      {product.owner_id === currentUser.uid
                        ? "Owner"
                        : "Member"}
                    </div>
                  </div>
                </div>

                <div className={cx("quick-links")}>
                  <h4>Quick links</h4>
                  <ul className={cx("links-list")}>
                    <li>
                      <span>Your Work</span>
                    </li>
                    {product.owner_id === currentUser.uid && (
                      <li>
                        <span>Administration</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className={cx("project-footer")}>
                  <FontAwesomeIcon
                    icon={faLayerGroup}
                    className={cx("footer-icon")}
                  />
                  <span>1 board</span>
                </div>
              </div>
            ))
          ) : (
            <Empty description="No projects found" />
          )}
        </div>
      </div>

      {renderTimeGroup(workItems, "Worked on")}
      {renderTimeGroup(assignedItems, "Assigned to me")}
    </div>
  );
}

export default ForYou;
