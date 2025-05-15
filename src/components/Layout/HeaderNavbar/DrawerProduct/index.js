import { Input, Button, Modal, message, Empty, Avatar, Menu } from "antd";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import CreateProduct from "./CreateProduct";
import classNames from "classnames/bind";
import styles from "./DrawerProduct.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faHouse } from "@fortawesome/free-solid-svg-icons";
import {
  collection,
  addDoc,
  where,
  query,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import { db } from "~/components/services/firebase";

const cx = classNames.bind(styles);

export function DrawerProduct() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const formRef = useRef(null);
  const navigate = useNavigate();

  const items = products.map((product, index) => ({
    key: `sub${index + 1}`,
    icon: <Avatar shape="square">{product.product_name[0]}</Avatar>,
    label: product.product_name,
    children: [
      {
        key: `sub1`,
        label: "Your Product",
        type: "group",
        children: [
          {
            key: `${index + 1}-1-1`,
            icon: <FontAwesomeIcon icon={faHouse} />,
            label: "Home",
            _productid: product.id,
          },
          ...(product.owner_id === currentUser.uid ? [
            {
              key: `${index + 1}-1-2`,
              icon: <FontAwesomeIcon icon={faGear} />,
              label: "Administration",
            }
          ] : [])
        ],
      },
    ],
  }));

  const onClick = (e) => {
    // Extract the product index from the key (e.g., "1-1-1" -> index 0)
    const keyParts = e.key.split("-");
    const productIndex = parseInt(keyParts[0]) - 1; // e.g., "1-1-1" -> 0
    const product = products[productIndex];

    // Check if the clicked item is "Home" and has a valid product
    if (
      product &&
      items[productIndex]?.children[0]?.children[0]?.label === "Home"
    ) {
      localStorage.setItem(`selectedProduct-${currentUser.uid}`, product.id);
      navigate(`/your-work/${product.id}`);
    }
    if (
      product &&
      items[productIndex]?.children[0]?.children[1]?.label === "Administration"
    ) {
      localStorage.setItem(`selectedProduct-${currentUser.uid}`, product.id);
      navigate(`/o/${product.id}/products`);
    }
  };

  useEffect(() => {
    if (!isModalOpen) {
      setLoading(false);
    }
  }, [isModalOpen]);

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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      setIsModalOpen(false);
    } else {
      message.info("Please wait while we finish creating your product");
    }
  };

  const handleFormSubmit = async (values) => {
    setLoading(true);
    try {
      if (!currentUser) {
        message.error("You must be logged in to create a product.");
        return;
      }

      const productData = {
        ...values,
        release_date: values.release_date
          ? values.release_date.toDate().toISOString()
          : null,
        created_at: new Date().toISOString(),
        owner_id: currentUser.uid,
      };
      // 1. Tạo product mới và lấy reference
      const productRef = await addDoc(collection(db, "products"), productData);
      // 2. Thêm người dùng hiện tại vào product_members với vai trò admin
      await setDoc(doc(collection(db, "product_members")), {
        product_id: productRef.id,
        user_id: currentUser.uid,
        role_in_product: "Admin",
        joined_at: new Date().toISOString(),
        status: "Active",
      });

      message.success("Product created successfully!");
      await fetchProducts();
      setIsModalOpen(false);
    } catch (error) {
      setLoading(false);
      console.error("Error adding product to Firestore:", error);
      message.error("Failed to create product. Please try again.");
    }
  };

  return (
    <div className={cx("drawer")}>
      <div className={cx("header-drawer")}>
        <Input
          className={cx("input-search")}
          placeholder="Search Product"
          prefix={<SearchOutlined />}
        />
        <Button type="primary" onClick={showModal} icon={<PlusOutlined />}>
          Create Product
        </Button>
      </div>
      <Modal
        title="Create Product"
        open={isModalOpen}
        onOk={handleOk}
        okText="Create"
        onCancel={handleCancel}
        confirmLoading={loading}
      >
        <CreateProduct onSubmit={handleFormSubmit} formRef={formRef} />
      </Modal>
      <div className={cx("drawer-content")}>
        {products.length > 0 ? (
          <Menu
            onClick={onClick}
            style={{ width: 580 }}
            mode="vertical"
            items={items}
          />
        ) : (
          <Empty />
        )}
      </div>
    </div>
  );
}

export default DrawerProduct;
