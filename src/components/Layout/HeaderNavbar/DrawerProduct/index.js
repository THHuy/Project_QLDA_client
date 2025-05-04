import { Input, Button, Modal, message } from "antd";
import { useState, useRef, useEffect } from "react";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import CreateProduct from "./CreateProduct";
import classNames from "classnames/bind";
import styles from "./DrawerProduct.module.scss";

import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import { db } from "~/components/services/firebase";
const cx = classNames.bind(styles);

export function DrawerProduct() {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentUser } = useAuth();
  const formRef = useRef(null);

  // Reset loading state when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setLoading(false);
    }
  }, [isModalOpen]);
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
      <div>Drawer content</div>
    </div>
  );
}

export default DrawerProduct;
