import React from "react";
import {
  Input,
  Select,
  Avatar,
  Typography,
  Tooltip,
  Tag,
  Card,
  Timeline,
  Spin,
} from "antd";
import {
  EditOutlined,
  UserOutlined,
  ClockCircleOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import moment from "moment";
import classNames from "classnames/bind";
import styles from "../ItemDetailsDrawer.module.scss";
import { convertDraftToText, PriorityIcon, StatusIcon } from "../utils";

const cx = classNames.bind(styles);
const { Option } = Select;
const { Text, Paragraph } = Typography;

const DetailsTabContent = ({
  selectedItem,
  assigneeDetails,
  // Status
  isEditingStatus,
  handleStatusClick,
  handleStatusChangeAndSave,
  setIsEditingStatus,
  // Priority
  isEditingPriority,
  handlePriorityClick,
  handlePriorityChangeAndSave,
  setIsEditingPriority,
  // Assignee
  isEditingAssignee,
  currentAssigneeId,
  handleAssigneeClick,
  handleAssigneeChangeAndSave,
  setIsEditingAssignee,
  // Description
  isEditingDescription,
  currentDescriptionValue,
  handleDescriptionClick,
  handleDescriptionChange,
  handleDescriptionSave,
  handleDescriptionKeyDown,
  // Actual Result (for Test Case)
  isEditingActualResult,
  currentActualResultValue,
  handleActualResultClick,
  handleActualResultChange,
  handleActualResultSave,
  handleActualResultKeyDown,
  // Linked Items
  internalLinkedItemDetails,
  isLoadingInternalLinkedItem,
}) => {
  if (!selectedItem) return null;

  // This function was previously renderTypeSpecificContent in ItemDetailsDrawer
  const renderTypeSpecificContent = () => {
    if (selectedItem.work_type === "Test Case") {
      return (
        <>
          <Card
            title="Test Case Information"
            className={cx("info-card")}
            size="small"
            bordered={false}
          >
            <div className={cx("field-group")}>
              <Text type="secondary" className={cx("field-label")}>
                Description:
              </Text>
              {isEditingDescription ? (
                <Input.TextArea
                  value={currentDescriptionValue}
                  onChange={handleDescriptionChange}
                  onBlur={handleDescriptionSave}
                  onKeyDown={handleDescriptionKeyDown}
                  autoFocus
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  className={cx("description-edit-area")}
                />
              ) : (
                <div
                  onClick={handleDescriptionClick}
                  className={cx("description-view", "clickable")}
                >
                  <Paragraph
                    className={cx("field-value")}
                    ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
                  >
                    {convertDraftToText(selectedItem.description)}
                  </Paragraph>
                  <EditOutlined
                    className={cx("edit-icon-small", "description-edit-icon")}
                  />
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Test Steps"
            className={cx("steps-card")}
            size="small"
            bordered={false}
          >
            {selectedItem.steps && selectedItem.steps.length > 0 ? (
              <Timeline className={cx("steps-timeline")}>
                {selectedItem.steps.map((step, index) => (
                  <Timeline.Item key={index} color="blue">
                    <Text strong>{`Step ${index + 1}`}</Text>
                    <Paragraph>{step}</Paragraph>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Text type="secondary">No steps defined.</Text>
            )}
          </Card>

          <Card
            title="Results"
            className={cx("results-card")}
            size="small"
            bordered={false}
          >
            <div className={cx("field-group")}>
              <Text type="secondary" className={cx("field-label")}>
                Expected Result:
              </Text>
              <Paragraph
                className={cx("field-value")}
                ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
              >
                {selectedItem.expected_result || "N/A"}
              </Paragraph>
            </div>
            <div className={cx("field-group")}>
              <Text type="secondary" className={cx("field-label")}>
                Actual Result:
              </Text>
              {isEditingActualResult ? (
                <Input.TextArea
                  value={currentActualResultValue}
                  onChange={handleActualResultChange}
                  onBlur={handleActualResultSave}
                  onKeyDown={handleActualResultKeyDown}
                  autoFocus
                  autoSize={{ minRows: 2, maxRows: 8 }}
                  className={cx("actual-result-edit-area")}
                />
              ) : (
                <div
                  onClick={handleActualResultClick}
                  className={cx("actual-result-view", "clickable")}
                >
                  <Paragraph
                    className={cx("field-value")}
                    ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
                  >
                    {selectedItem.actual_result || "N/A"}
                  </Paragraph>
                  <EditOutlined
                    className={cx("edit-icon-small", "actual-result-edit-icon")}
                  />
                </div>
              )}
            </div>
          </Card>

          {selectedItem.linked_task_id && (
            <Card
              title="Linked Items"
              className={cx("linked-card")}
              size="small"
              bordered={false}
            >
              <div className={cx("field-group")}>
                <Text type="secondary" className={cx("field-label")}>
                  Linked Task:
                </Text>
                <div className={cx("linked-item")}>
                  {isLoadingInternalLinkedItem ? (
                    <Spin size="small" />
                  ) : internalLinkedItemDetails &&
                    internalLinkedItemDetails.type === "Task" ? (
                    <>
                      <LinkOutlined className={cx("link-icon")} />
                      <Tag color="blue">{selectedItem.linked_task_id}</Tag>
                      <Text ellipsis>{internalLinkedItemDetails.name}</Text>
                    </>
                  ) : (
                    <>
                      <LinkOutlined className={cx("link-icon")} />
                      <Tag color="blue">{selectedItem.linked_task_id}</Tag>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )}
        </>
      );
    } else {
      // Task or Bug
      return (
        <>
          <Card
            title={
              selectedItem.work_type === "Bug"
                ? "Bug Information"
                : "Task Information"
            }
            className={cx("info-card")}
            size="small"
            bordered={false}
          >
            <div className={cx("field-group")}>
              <Text type="secondary" className={cx("field-label")}>
                Description:
              </Text>
              {isEditingDescription ? (
                <Input.TextArea
                  value={currentDescriptionValue}
                  onChange={handleDescriptionChange}
                  onBlur={handleDescriptionSave}
                  onKeyDown={handleDescriptionKeyDown}
                  autoFocus
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  className={cx("description-edit-area")}
                />
              ) : (
                <div
                  onClick={handleDescriptionClick}
                  className={cx("description-view", "clickable")}
                >
                  <Paragraph
                    className={cx("field-value")}
                    ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
                  >
                    {convertDraftToText(selectedItem.description)}
                  </Paragraph>
                  <EditOutlined
                    className={cx("edit-icon-small", "description-edit-icon")}
                  />
                </div>
              )}
            </div>
          </Card>

          {(selectedItem.work_type === "Bug" ||
            selectedItem.work_type === "Task") &&
            (selectedItem.linked_test_case_id || selectedItem.step_failed) && (
              <Card
                title="Linked Information"
                className={cx("linked-card")}
                size="small"
                bordered={false}
              >
                {selectedItem.linked_test_case_id && (
                  <div className={cx("field-group")}>
                    <Text type="secondary" className={cx("field-label")}>
                      Linked Test Case:
                    </Text>
                    <div className={cx("linked-item")}>
                      {isLoadingInternalLinkedItem ? (
                        <Spin size="small" />
                      ) : internalLinkedItemDetails &&
                        internalLinkedItemDetails.type === "Test Case" ? (
                        <>
                          <LinkOutlined className={cx("link-icon")} />
                          <Tag color="green">
                            {selectedItem.linked_test_case_id}
                          </Tag>
                          <Text ellipsis>{internalLinkedItemDetails.name}</Text>
                        </>
                      ) : (
                        <>
                          <LinkOutlined className={cx("link-icon")} />
                          <Tag color="green">
                            {selectedItem.linked_test_case_id}
                          </Tag>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {selectedItem.work_type === "Bug" &&
                  selectedItem.step_failed &&
                  internalLinkedItemDetails &&
                  internalLinkedItemDetails.type === "Test Case" &&
                  internalLinkedItemDetails.steps &&
                  internalLinkedItemDetails.steps.length >=
                    selectedItem.step_failed && (
                    <div className={cx("field-group")}>
                      <Text type="secondary" className={cx("field-label")}>
                        Failed Step:
                      </Text>
                      <Card
                        className={cx("failed-step-card")}
                        size="small"
                        bordered={true}
                        style={{
                          marginTop: 8,
                          backgroundColor: "#FFEBE6",
                          borderColor: "#FF5630",
                        }}
                      >
                        <Text
                          strong
                        >{`Step ${selectedItem.step_failed}:`}</Text>
                        <Paragraph>
                          {
                            internalLinkedItemDetails.steps[
                              selectedItem.step_failed - 1
                            ]
                          }
                        </Paragraph>
                      </Card>
                    </div>
                  )}
              </Card>
            )}
        </>
      );
    }
  };

  return (
    <div className={cx("details-content")}>
      <Card className={cx("details-card")} size="small" bordered={false}>
        <div className={cx("field-grid")}>
          {/* Status Field */}
          <div className={cx("field-item")}>
            <Text type="secondary" className={cx("field-label")}>
              Status
            </Text>
            <div
              className={cx("field-value-container", "clickable")}
              onClick={handleStatusClick}
            >
              {isEditingStatus ? (
                <Select
                  value={selectedItem.status} // Use value instead of defaultValue for controlled component
                  className={cx("edit-select")}
                  style={{ width: "100%" }}
                  onChange={handleStatusChangeAndSave}
                  onBlur={() => setIsEditingStatus(false)}
                  autoFocus
                >
                  <Option value="TO DO">TO DO</Option>
                  <Option value="IN PROGRESS">IN PROGRESS</Option>
                  <Option value="IN REVIEW">IN REVIEW</Option>
                  <Option value="DONE">DONE</Option>
                </Select>
              ) : (
                <Tag
                  color={
                    selectedItem.status === "TO DO"
                      ? "default"
                      : selectedItem.status === "IN PROGRESS"
                      ? "processing"
                      : selectedItem.status === "IN REVIEW"
                      ? "warning"
                      : selectedItem.status === "DONE"
                      ? "success"
                      : "default"
                  }
                  className={cx("status-tag")}
                >
                  <StatusIcon status={selectedItem.status} />{" "}
                  {selectedItem.status}
                </Tag>
              )}
              {!isEditingStatus && (
                <EditOutlined className={cx("edit-icon-small")} />
              )}
            </div>
          </div>

          {/* Priority Field */}
          <div className={cx("field-item")}>
            <Text type="secondary" className={cx("field-label")}>
              Priority
            </Text>
            <div
              className={cx("field-value-container", "clickable")}
              onClick={handlePriorityClick}
            >
              {isEditingPriority ? (
                <Select
                  value={selectedItem.priority} // Use value for controlled component
                  className={cx("edit-select")}
                  style={{ width: "100%" }}
                  onChange={handlePriorityChangeAndSave}
                  onBlur={() => setIsEditingPriority(false)}
                  autoFocus
                >
                  <Option value="Highest">Highest</Option>
                  <Option value="High">High</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="Low">Low</Option>
                  <Option value="Lowest">Lowest</Option>
                </Select>
              ) : (
                <>
                  <PriorityIcon priority={selectedItem.priority} />
                  <EditOutlined className={cx("edit-icon-small")} />
                </>
              )}
            </div>
          </div>

          {/* Assignee Field */}
          <div className={cx("field-item")}>
            <Text type="secondary" className={cx("field-label")}>
              Assignee
            </Text>
            <div
              className={cx("field-value-container", "clickable")}
              onClick={handleAssigneeClick}
            >
              {isEditingAssignee ? (
                <Select
                  value={currentAssigneeId} // Use value for controlled component
                  className={cx("edit-select")}
                  style={{ width: "100%" }}
                  onChange={handleAssigneeChangeAndSave}
                  onBlur={() => setIsEditingAssignee(false)}
                  autoFocus
                >
                  <Option value="">Unassigned</Option>
                  {Object.entries(assigneeDetails).map(([id, details]) => (
                    <Option key={id} value={id}>
                      <Avatar
                        src={details?.photoURL}
                        icon={!details?.photoURL && <UserOutlined />}
                        size="small"
                        style={{ marginRight: 8 }}
                      />
                      {details?.displayName || id}
                    </Option>
                  ))}
                </Select>
              ) : (
                <>
                  <div className={cx("assignee-display")}>
                    <Avatar
                      src={assigneeDetails[selectedItem.assignee_id]?.photoURL}
                      icon={
                        !assigneeDetails[selectedItem.assignee_id]
                          ?.photoURL && <UserOutlined />
                      }
                      size="small"
                    />
                    <Text>
                      {assigneeDetails[selectedItem.assignee_id]?.displayName ||
                        "Unassigned"}
                    </Text>
                  </div>
                  <EditOutlined className={cx("edit-icon-small")} />
                </>
              )}
            </div>
          </div>

          {/* Work Type Field (Display Only) */}
          <div className={cx("field-item")}>
            <Text type="secondary" className={cx("field-label")}>
              Work Type
            </Text>
            <div className={cx("field-value-container")}>
              <Tag
                color={
                  selectedItem.work_type === "Bug"
                    ? "#FF5630"
                    : selectedItem.work_type === "Test Case"
                    ? "#36B37E"
                    : "#0052CC"
                }
                className={cx("work-type-tag")}
              >
                {selectedItem.work_type}
              </Tag>
            </div>
          </div>

          {/* Due Date Field - Display Only */}
          <div className={cx("field-item")}>
            <Text type="secondary" className={cx("field-label")}>
              Due Date
            </Text>
            <div className={cx("field-value-container")}>
              <div className={cx("date-display")}>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                <Text>
                  {selectedItem.due_date
                    ? moment(selectedItem.due_date).format("DD MMM YYYY, HH:mm")
                    : "No due date"}
                </Text>
              </div>
              {/* EditIcon and DatePicker removed */}
            </div>
          </div>
        </div>
      </Card>

      {renderTypeSpecificContent()}
    </div>
  );
};

export default React.memo(DetailsTabContent);
