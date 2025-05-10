import React from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
} from 'antd';

const { Option } = Select;
const { TextArea } = Input;

function EditSprintModal({ visible, sprintName, onClose, onUpdate }) {
  const [form] = Form.useForm();

  // Initialize form fields when the modal becomes visible or sprintName changes
  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        sprintName: sprintName || '',
        duration: 'custom', // Default duration
        // startDate: null, // Set initial dates if available
        // endDate: null,
        // sprintGoal: '',
      });
    }
  }, [visible, sprintName, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        // Process and pass values to onUpdate
        const updateData = {
          ...values,
          startDate: values.startDate ? values.startDate.valueOf() : null,
          endDate: values.endDate ? values.endDate.valueOf() : null,
        };
        onUpdate(updateData); 
        onClose(); // Close modal on successful update
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <Modal
      title={`Edit sprint: ${sprintName || 'New Sprint'}`}
      visible={visible}
      onOk={handleOk}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="back" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          Update
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" name="edit_sprint_form">
        <p>Required fields are marked with an asterisk *</p>
        <Form.Item
          name="sprintName"
          label="Sprint name"
          rules={[{ required: true, message: 'Please input the sprint name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="duration" label="Duration">
          <Select defaultValue="custom">
            <Option value="custom">Custom</Option>
            <Option value="1week">1 week</Option>
            <Option value="2weeks">2 weeks</Option>
            <Option value="3weeks">3 weeks</Option>
            <Option value="4weeks">4 weeks</Option>
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="startDate" label="Start date">
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: '100%' }}
                placeholder="e.g. 12/31/2018"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
             {/* This is just a visual placeholder based on the image */}
            <Form.Item label="&nbsp;"> 
                <Input placeholder="e.g. 1:00 PM" style={{marginTop: '0px'}} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="endDate" label="End date">
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: '100%' }}
                placeholder="e.g. 01/14/2019"
              />
            </Form.Item>
          </Col>
           <Col span={12}>
             {/* This is just a visual placeholder based on the image */}
            <Form.Item label="&nbsp;">
                <Input placeholder="e.g. 1:00 PM" style={{marginTop: '0px'}} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="sprintGoal" label="Sprint goal">
          <TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default EditSprintModal; 