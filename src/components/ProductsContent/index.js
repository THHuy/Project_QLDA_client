import { useState, useEffect, useCallback, useRef } from "react";
import {
  Layout,
  Typography,
  Button,
  Input,
  Select,
  Table,
  Space,
  Breadcrumb,
  Dropdown,
  Menu,
  Badge,
  message,
  Modal,
  Form,
} from "antd";
import {
  SearchOutlined,
  MoreOutlined,
  ReloadOutlined,
  PlusOutlined,
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import classNames from "classnames/bind";
import styles from "./ProductsContent.module.scss";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "~/components/services/firebase";
import CreateProduct from "../Layout/HeaderNavbar/DrawerProduct/CreateProduct";

const cx = classNames.bind(styles);

const { Header, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const ProductManagement = () => {
  const { currentUser } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("Products");
  const [pageSize, setPageSize] = useState(20);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const formRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    if (!currentUser) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      // 1. Lấy tất cả product mà user là owner
      const ownerQ = query(
        collection(db, "products"),
        where("owner_id", "==", currentUser.uid)
      );
      const ownerSnapshot = await getDocs(ownerQ);
      const ownerProducts = await Promise.all(
        ownerSnapshot.docs.map(async (doc) => {
          // Lấy số lượng users từ product_members
          const membersQ = query(
            collection(db, "product_members"),
            where("product_id", "==", doc.id),
            where("status", "==", "Active")
          );
          let usersCount = 0;
          try {
            const membersSnapshot = await getDocs(membersQ);
            usersCount = membersSnapshot.size;
          } catch (error) {
            console.error("Error fetching members count:", error);
            // Nếu không có quyền đọc, mặc định là 1 (chỉ owner)
            usersCount = 1;
          }

          return {
            key: doc.id,
            id: doc.id,
            name: doc.data().product_name,
            link: `/your-work/${doc.id}`,
            plan: "Owner",
            users: usersCount,
            ...doc.data(),
          };
        })
      );

      // 2. Lấy tất cả product_id mà user là thành viên (status Active)
      const memberQ = query(
        collection(db, "product_members"),
        where("user_id", "==", currentUser.uid),
        where("status", "==", "Active")
      );
      let memberProductIds = [];
      try {
        const memberSnapshot = await getDocs(memberQ);
        memberProductIds = memberSnapshot.docs.map(
          (doc) => doc.data().product_id
        );
      } catch (error) {
        console.error("Error fetching member products:", error);
        // Nếu không có quyền đọc, bỏ qua các sản phẩm member
        memberProductIds = [];
      }

      // 3. Lấy thông tin product tương ứng (trừ product đã là owner)
      const memberProducts = await Promise.all(
        memberProductIds
          .filter((pid) => !ownerProducts.find((p) => p.id === pid))
          .map(async (pid) => {
            try {
              const prodDoc = await getDoc(doc(db, "products", pid));
              if (prodDoc.exists()) {
                // Lấy số lượng users từ product_members
                const membersQ = query(
                  collection(db, "product_members"),
                  where("product_id", "==", pid),
                  where("status", "==", "Active")
                );
                let usersCount = 0;
                try {
                  const membersSnapshot = await getDocs(membersQ);
                  usersCount = membersSnapshot.size;
                } catch (error) {
                  console.error("Error fetching members count:", error);
                  // Nếu không có quyền đọc, mặc định là 1 (chỉ member hiện tại)
                  usersCount = 1;
                }

                return {
                  key: prodDoc.id,
                  id: prodDoc.id,
                  name: prodDoc.data().product_name,
                  link: `/your-work/${prodDoc.id}`,
                  plan: "Member",
                  users: usersCount,
                  ...prodDoc.data(),
                };
              }
            } catch (error) {
              console.error("Error fetching product:", error);
            }
            return null;
          })
      );

      setProducts([...ownerProducts, ...memberProducts.filter(Boolean)]);
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditProduct = (record) => {
    setEditingProduct(record);
    form.setFieldsValue({
      product_name: record.name,
      description: record.description,
      // Add other fields as needed
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (record) => {
    try {
      // 1. Lấy tất cả product_members của sản phẩm này
      const membersQuery = query(
        collection(db, "product_members"),
        where("product_id", "==", record.id)
      );
      const membersSnapshot = await getDocs(membersQuery);

      // 2. Xóa tất cả product_members
      const deletePromises = membersSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // 3. Xóa sản phẩm
      await deleteDoc(doc(db, "products", record.id));

      message.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      message.error("Failed to delete product");
    }
  };

  const handleModalOk = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      // Chuyển đổi release_date từ Moment object sang timestamp
      const formattedValues = {
        ...values,
        release_date: values.release_date ? values.release_date.toDate() : null,
      };

      if (editingProduct) {
        // Update existing product
        await updateDoc(doc(db, "products", editingProduct.id), {
          ...formattedValues,
          updated_at: new Date().toISOString(),
        });
        message.success("Product updated successfully");
      } else {
        // Create new product
        const productData = {
          ...formattedValues,
          created_at: new Date().toISOString(),
          owner_id: currentUser.uid,
        };
        // Tạo sản phẩm mới và lấy reference
        const productRef = await addDoc(
          collection(db, "products"),
          productData
        );

        // Thêm owner vào product_members với vai trò Admin
        await addDoc(collection(db, "product_members"), {
          product_id: productRef.id,
          user_id: currentUser.uid,
          role_in_product: "Admin",
          joined_at: new Date().toISOString(),
          status: "Active",
        });

        message.success("Product created successfully");
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      message.error("Failed to save product");
    }
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="product-cell">
          <div className="product-info">
            <div className="product-name">{text}</div>
            <div className="product-link">{record.link}</div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      width: 200,
    },
    {
      title: "Users",
      dataIndex: "users",
      key: "users",
      width: 200,
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <div className="action-cell">
          <Button
            type="link"
            href={record.link}
            icon={<EyeOutlined />}
            onClick={() => {
              localStorage.setItem(
                `selectedProduct-${currentUser.uid}`,
                record.id
              );
            }}
          >
            View Detail
          </Button>
          {record.plan === "Owner" && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "edit",
                    label: "Edit",
                    icon: <EditOutlined />,
                    onClick: () => handleEditProduct(record),
                  },
                  {
                    key: "delete",
                    label: "Delete",
                    icon: <DeleteOutlined />,
                    onClick: () => {
                      Modal.confirm({
                        title: "Are you sure you want to delete this product?",
                        content: "This action cannot be undone.",
                        okText: "Yes",
                        okType: "danger",
                        cancelText: "No",
                        onOk: () => handleDeleteProduct(record),
                      });
                    },
                  },
                ],
              }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Button
                type="text"
                icon={<EllipsisOutlined />}
                className="more-actions-btn"
              />
            </Dropdown>
          )}
        </div>
      ),
    },
  ];

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Layout className={cx("product-management-layout")}>
      <Header className={cx("app-header")}>
        <div className={cx("breadcrumb-container")}>
          <Breadcrumb>
            <Breadcrumb.Item>Admin</Breadcrumb.Item>
            <Breadcrumb.Item>Products</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <div className={cx("header-right")}>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={fetchProducts}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </Header>

      <Content className={cx("app-content")}>
        <div className={cx("page-header")}>
          <Title level={2}>Products</Title>
          <div className={cx("header-actions")}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddProduct}
            >
              Add product
            </Button>
          </div>
        </div>

        <div className={cx("page-description")}>
          Manage access, changes, and more for all the products in your
          organization.
        </div>

        <div className={cx("table-toolbar")}>
          <div className={cx("search-filter")}>
            <Input
              placeholder="Find by name"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={cx("search-input")}
            />
            <Select
              defaultValue="Products"
              onChange={(value) => setFilterType(value)}
              className={cx("filter-select")}
            >
              <Option value="Products">Products</Option>
              <Option value="Plans">Plans</Option>
            </Select>
          </div>
        </div>

        <div className={cx("results-summary")}>
          Showing {filteredProducts.length} results out of {products.length}{" "}
          products{" "}
          <ReloadOutlined
            className={cx("refresh-icon")}
            onClick={fetchProducts}
            style={{ cursor: "pointer" }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredProducts}
          pagination={false}
          className={cx("products-table")}
          rowKey="key"
          loading={loading}
        />

        <div className={cx("table-footer")}>
          <div className={cx("pagination-info")}>
            <Button type="text" disabled>
              Previous
            </Button>
            <Button type="text">Next</Button>
            <span className={cx("results-count")}>
              1-{filteredProducts.length} of {filteredProducts.length} results
            </span>
          </div>
          <div className={cx("page-size-selector")}>
            <span>Results per page:</span>
            <Select
              defaultValue="20"
              onChange={(value) => setPageSize(value)}
              dropdownMatchSelectWidth={false}
            >
              <Option value="10">10</Option>
              <Option value="20">20</Option>
              <Option value="50">50</Option>
            </Select>
          </div>
        </div>
      </Content>

      <Modal
        title={editingProduct ? "Edit Product" : "Add Product"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        okText={editingProduct ? "Update" : "Create"}
      >
        <CreateProduct onSubmit={handleFormSubmit} formRef={formRef} />
      </Modal>
    </Layout>
  );
};

export default ProductManagement;
