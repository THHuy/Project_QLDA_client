import { Modal, Input, message, Spin, Select, Tag } from "antd";
import { useState, useEffect, useCallback } from "react";
import classNames from "classnames/bind";
import styles from "./ButtonTeams.module.scss";
import { CloseCircleOutlined } from "@ant-design/icons";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import { db, functions } from "~/components/services/firebase";
const cx = classNames.bind(styles);
const { Option } = Select;

function ButtonTeams() {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  // Fetch products of current user
  const fetchProducts = useCallback(async () => {
    if (!currentUser) {
      console.log("No user logged in, skipping fetch products.");
      setProducts([]);
      setIsProductsLoading(false);
      return;
    }

    setIsProductsLoading(true);
    try {
      // Query only products where owner_id matches currentUser.uid
      const productsRef = collection(db, "products");
      const q = query(productsRef, where("owner_id", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);

      const productsList = [];
      querySnapshot.forEach((doc) => {
        const productData = doc.data();
        productsList.push({
          id: doc.id,
          name: productData.product_name || "Unnamed Product",
          description: productData.description || "",
          owner_id: productData.owner_id, // Store owner_id for debugging if needed
        });
      });

      setProducts(productsList);
      if (productsList.length > 0) {
        setSelectedProduct(productsList[0].id);
      } else {
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Failed to load products");
    } finally {
      setIsProductsLoading(false);
    }
  }, [currentUser]);

  // Load products when modal opens
  useEffect(() => {
    if (isModalOpen) {
      fetchProducts();
    }
  }, [isModalOpen, fetchProducts]);

  const showModal = () => {
    setIsModalOpen(true);
    setInvitedEmails([]);
  };

  // Add email to invited list
  const addEmail = () => {
    const email = emailInput.trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      message.error("Please enter a valid email address");
      return;
    }

    // Check if email is already in the list
    if (invitedEmails.includes(email)) {
      message.warning("This email is already in the invitation list");
      return;
    }

    setInvitedEmails([...invitedEmails, email]);
    setEmailInput("");
  };

  // Handle Enter key press in email input
  const handleEmailKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  // Remove email from invited list
  const removeEmail = (email) => {
    setInvitedEmails(invitedEmails.filter((e) => e !== email));
  };

  const handleOk = async () => {
    if (invitedEmails.length === 0) {
      message.warning("Vui lòng thêm ít nhất một địa chỉ email");
      return;
    }

    if (!selectedProduct) {
      message.warning("Vui lòng chọn một sản phẩm");
      return;
    }

    if (!currentUser) {
      message.error("Vui lòng đăng nhập để gửi lời mời");
      return;
    }
    if (typeof currentUser.getIdToken !== "function") {
      console.error("currentUser lacks getIdToken method:", currentUser);
      message.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
      return;
    }

    setIsLoading(true);
    try {
      // Làm mới token xác thực
      const token = await currentUser.getIdToken(true);
      console.log("ID Token:", token);

      // Get product details
      const productRef = doc(db, "products", selectedProduct);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        throw new Error("Không tìm thấy sản phẩm đã chọn");
      }

      const productData = productSnap.data();

      // Create invitations
      const invitationPromises = invitedEmails.map(async (email) => {
        const invitationRef = await addDoc(collection(db, "team_invitations"), {
          product_id: selectedProduct,
          user_id: null,
          user_email: email,
          role_in_product: "member",
          invited_at: Timestamp.now(),
          invited_by: currentUser.uid,
          status: "pending",
        });

        return {
          invitationId: invitationRef.id,
          email: email,
          productId: selectedProduct,
          productName: productData.product_name || "Unnamed Product",
        };
      });

      const invitations = await Promise.all(invitationPromises);

      // Gọi Cloud Function
      const sendInvitations = httpsCallable(functions, "sendTeamInvitations");
      console.log("Calling sendTeamInvitations with:", invitations);
      const result = await sendInvitations({ invitations });
      console.log("Cloud Function result:", result);

      message.success(
        `Đã gửi lời mời đến ${invitedEmails.length} ${
          invitedEmails.length > 1 ? "người" : "người"
        }`
      );
      setIsModalOpen(false);
      setInvitedEmails([]);
      setEmailInput("");
    } catch (error) {
      console.error("Lỗi khi gửi lời mời:", error);
      message.error("Không thể gửi lời mời: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setInvitedEmails([]);
    setEmailInput("");
  };

  return (
    <div className={cx("container-fluid")}>
      <div className={cx("btn-users")}>
        <button className={cx("btn-w")}>Manage users</button>
        <button className={cx("btn-w")}>Create team</button>
        <button className={cx("btn-add")} onClick={showModal}>
          Add people
        </button>
        <Modal
          title="Add people"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          confirmLoading={isLoading}
          okText={`Add ${invitedEmails.length} ${
            invitedEmails.length === 1 ? "person" : "people"
          }`}
          className={cx("invite-modal")}
        >
          <div className={cx("invite-section")}>
            <label className={cx("label")}>Names or emails*</label>
            <div className={cx("email-input-container")}>
              {invitedEmails.map((email) => (
                <Tag
                  key={email}
                  closable
                  onClose={() => removeEmail(email)}
                  className={cx("email-tag")}
                  closeIcon={<CloseCircleOutlined />}
                >
                  <span className={cx("email-icon")}>✉</span> {email}
                </Tag>
              ))}
              <Input
                placeholder="e.g., name@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onPressEnter={handleEmailKeyPress}
                onBlur={addEmail}
                className={cx("email-input")}
              />
            </div>
          </div>

          {isProductsLoading ? (
            <div className={cx("loading-container")}>
              <Spin size="small" />
              <span>Loading products...</span>
            </div>
          ) : (
            <div className={cx("product-section")}>
              <label className={cx("label")}>Add to product*</label>
              <Select
                value={selectedProduct}
                onChange={(value) => setSelectedProduct(value)}
                className={cx("product-select")}
                placeholder="Select a product"
                disabled={products.length === 0}
                suffixIcon={<span>▼</span>}
              >
                {products.map((product) => (
                  <Option key={product.id} value={product.id}>
                    {product.name}
                  </Option>
                ))}
              </Select>

              {products.length === 0 && (
                <div className={cx("no-products")}>
                  No products available. Create a product first.
                </div>
              )}
            </div>
          )}

          <div className={cx("terms-section")}>
            <p className={cx("terms-text")}>
              This site is protected by reCAPTCHA and the Google{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>{" "}
              apply.
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default ButtonTeams;
