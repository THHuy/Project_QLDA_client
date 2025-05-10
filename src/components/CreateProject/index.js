import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./CreateProject.module.scss";
import { Modal, Form, Input, Select, DatePicker, Button, message } from "antd";
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

function CreateProject({ open, onCancel, onProjectCreated }) {
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [duration, setDuration] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusMap = {
    ACTIVE: 1,
    INACTIVE: 0,
  };

  const getEndDate = () => {
    if (startDate && duration !== "custom") {
      return dayjs(startDate).add(duration, "week");
    }
    return null;
  };

  const onFinish = async (values) => {
    if (!currentUser) {
      message.error("You must be logged in to create a project.");
      return;
    }
    setIsSubmitting(true);
    try {
      const product_id = await getUserProduct(currentUser.uid);
      if (!product_id) {
        message.error("No active product selected. Cannot create project.");
        setIsSubmitting(false);
        return;
      }
      const manager_id = currentUser.uid;

      await addDoc(collection(db, "project"), {
        project_name: values.name,
        product_id,
        manager_id,
        start_date: values.startDate.format("YYYY-MM-DD HH:mm:ss"),
        end_date:
          duration !== "custom"
            ? getEndDate().format("YYYY-MM-DD HH:mm:ss")
            : values.endDate.format("YYYY-MM-DD HH:mm:ss"),
        status_id: statusMap[values.status],
        created_at: serverTimestamp(),
      });
      message.success("Project created successfully!");
      if (onProjectCreated) {
        onProjectCreated();
      }
      onCancel();
      form.resetFields();
      setStartDate(null);
      setDuration(1);
    } catch (error) {
      console.error("Error adding project: ", error);
      message.error("Failed to create project: " + (error.message || ""));
    }
    setIsSubmitting(false);
  };
  return (
    <Modal title="Create Project" open={open} onCancel={onCancel} footer={null}>
      <div className={cx("container-fluid")}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Project Name"
            name="name"
            rules={[
              { required: true, message: "Please input the project name!" },
            ]}
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
            rules={[
              { required: true, message: "Please select the start date!" },
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: "100%" }}
              onChange={(date) => setStartDate(date)}
            />
          </Form.Item>
          <Form.Item
            label="End Date"
            name="endDate"
            rules={[
              {
                required: duration === "custom",
                message: "Please select the end date for custom duration!",
              },
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: "100%" }}
              disabled={duration !== "custom"}
              value={
                duration !== "custom" && getEndDate()
                  ? getEndDate()
                  : form.getFieldValue("endDate")
              }
              onChange={(date) => {
                if (duration === "custom") {
                  form.setFieldsValue({ endDate: date });
                }
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}

export default CreateProject;
