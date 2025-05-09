import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./CreateProject.module.scss";
import { Modal, Form, Input, Select, DatePicker, Button } from "antd";
import { db } from "~/components/services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import { getUserProduct } from "~/utils/productStorage";

import dayjs from "dayjs";
const cx = classNames.bind(styles);

const durationOptions = [
  { label: "1 week", value: 1 },
  { label: "2 weeks", value: 2 },
  { label: "3 weeks", value: 3 },
  { label: "4 weeks", value: 4 },
  { label: "Custom", value: "custom" },
];

const statusOptions = [
  { label: "ACTIVE", value: "ACTIVE" },
  { label: "INACTIVE", value: "INACTIVE" },
];

function CreateProject({ open, onCancel }) {
  const { currentUser } = useAuth(); // Lấy user hiện tại
  const [form] = Form.useForm();
  const [duration, setDuration] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const statusMap = {
    ACTIVE: 1,
    INACTIVE: 0,
  };
  // Tính end date nếu không phải custom
  const getEndDate = () => {
    if (startDate && duration !== "custom") {
      return dayjs(startDate).add(duration, "week");
    }
    return null;
  };

  const onFinish = async (values) => {
    try {
      const product_id = await getUserProduct(currentUser.uid);
      const manager_id = currentUser.uid;
      await addDoc(collection(db, "project"), {
        project_name: values.name,
        product_id,
        manager_id,
        start_date: values.startDate.format("YYYY-MM-DD"),
        end_date:
          duration !== "custom"
            ? getEndDate().format("YYYY-MM-DD")
            : values.endDate.format("YYYY-MM-DD"),
        status_id: statusMap[values.status],
        created_at: serverTimestamp(),
      });
      onCancel(); // Đóng modal
      form.resetFields();
    } catch (error) {
      console.error("Error adding project: ", error);
    }
  };
  return (
    <Modal title="Create Project" open={open} onCancel={onCancel} footer={null}>
      <div className={cx("container-fluid")}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Project Name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Project Status" name="status" initialValue="ACTIVE">
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item label="Duration" name="duration" initialValue={1}>
            <Select
              options={durationOptions}
              onChange={(value) => setDuration(value)}
            />
          </Form.Item>
          <Form.Item
            label="Start Date"
            name="startDate"
            rules={[{ required: true }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              onChange={(date) => setStartDate(date)}
            />
          </Form.Item>
          <Form.Item label="End Date" name="endDate">
            <DatePicker
              style={{ width: "100%" }}
              disabled={duration !== "custom"}
              value={
                duration !== "custom" && getEndDate() ? getEndDate() : undefined
              }
              onChange={(date) => {
                if (duration === "custom") {
                  form.setFieldsValue({ endDate: date });
                }
              }}
            />
          </Form.Item>
          {/* Các trường khác nếu cần */}
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}

export default CreateProject;
