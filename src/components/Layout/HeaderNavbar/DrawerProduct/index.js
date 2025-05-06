import { Input, Button, Modal, message, Empty, Avatar, Menu } from "antd";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import CreateProduct from "./CreateProduct";
import classNames from "classnames/bind";
import styles from "./DrawerProduct.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faHouse } from "@fortawesome/free-solid-svg-icons";
import { collection, addDoc, where, query, getDocs } from "firebase/firestore";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import { db } from "~/components/services/firebase";
const cx = classNames.bind(styles);

export function DrawerProduct() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const formRef = useRef(null);
  const navigate = useNavigate(); // Khởi tạo useNavigate
  const items = products.map((product, index) => ({
    key: `sub${index + 1}`, // Tạo key dạng sub1, sub2, ...
    icon: <Avatar shape="square">{product.product_name[0]}</Avatar>,
    label: product.product_name, // Sử dụng product_name làm label
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
            productId: product.product_id,
          },
          {
            key: `${index + 1}-1-2`,
            icon: <FontAwesomeIcon icon={faGear} />,
            label: "Administration",
          },
        ],
      },
    ],
  }));

  const onClick = (e) => {
    // Kiểm tra nếu mục được nhấn là "Home"
    const clickedItem = items
      .flatMap((item) => item.children?.[0]?.children || [])
      .find((child) => child.key === e.key);
    if (clickedItem?.label === "Home" && clickedItem?.productId) {
      // Điều hướng đến trang với productId
      setIsModalOpen(false);
      navigate(`/your-work/${clickedItem.productId}`);
    }
  };
  // Reset loading state when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setLoading(false);
    }
  }, [isModalOpen]);
  // Truy vấn products của currentUser
  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentUser) {
        setProducts([]); // Nếu không có user, đặt danh sách rỗng
        return;
      }

      try {
        // Truy vấn Firestore: lấy các product có owner_id là currentUser.uid
        const q = query(
          collection(db, "products"),
          where("owner_id", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        // Lưu danh sách products vào state
        const productList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products:", error);
        message.error("Failed to fetch products.");
      }
    };
    fetchProducts();
  }, [currentUser]); // Gọi lại khi currentUser thay đổi
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    // Trigger form submission programmatically
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

      // Convert release_date (Moment.js object) to Firestore Timestamp
      const productData = {
        ...values,
        release_date: values.release_date
          ? values.release_date.toDate().toISOString()
          : null,
        created_at: new Date().toISOString(),
        owner_id: currentUser.uid, // Change from owner_id to createdBy
      };

      // Save to Firestore 'products' collection
      await addDoc(collection(db, "products"), productData);

      message.success("Product created successfully!");
      setTimeout(() => {
        setIsModalOpen(false);
        setLoading(false);
      }, 1500);
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
