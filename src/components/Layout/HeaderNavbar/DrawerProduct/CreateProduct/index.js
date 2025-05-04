import { DatePicker, Input, Form, message } from "antd";
import classNames from "classnames/bind";
import styles from "./CreateProduct.module.scss";
import { useEffect } from "react"; // Add this import

const cx = classNames.bind(styles);
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 },
  },
};

function CreateProduct({ onSubmit, formRef }) {
  const [form] = Form.useForm();
  const variant = Form.useWatch("variant", form);
  const productName = Form.useWatch("product_name", form);
  // Assign the form instance to the ref passed from parent
  useEffect(() => {
    if (formRef) {
      formRef.current = form;
    }
  }, [formRef, form]);

  // Generate product_id from product_name
  const generateProductId = (name) => {
    if (!name) return "";
    var from =
        "àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ",
      to =
        "aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy";
    for (var i = 0, l = from.length; i < l; i++) {
      name = name.replace(RegExp(from[i], "gi"), to[i]);
    }
    // Split the name into words, take the first letter of each word, join, and convert to uppercase
    return name
      .split(/\s+/)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  // Update product_id whenever product_name changes
  useEffect(() => {
    if (productName) {
      form.setFieldsValue({
        product_id: generateProductId(productName),
      });
    }
  }, [productName, form]);

  const handleFinish = (values) => {
    // Call the onSubmit callback with form values
    onSubmit(values);
  };

  return (
    <div className={cx("form-create")}>
      <Form
        {...formItemLayout}
        form={form}
        variant={variant || "filled"}
        style={{ maxWidth: 600 }}
        initialValues={{ variant: "filled" }}
        onFinish={handleFinish}
      >
        <Form.Item
          label="Name Product"
          name="product_name"
          rules={[{ required: true, message: "Please input!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Key"
          name="product_id"
          rules={[{ required: true, message: "Please input!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: false, message: "Please input!" }]}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          label="Version"
          name="version"
          rules={[{ required: true, message: "Please input!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Release"
          name="release_date"
          rules={[{ required: true, message: "Please input!" }]}
        >
          <DatePicker />
        </Form.Item>
      </Form>
    </div>
  );
}

export default CreateProduct;
