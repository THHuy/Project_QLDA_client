import { Button, Input, Select } from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  FilterOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import classNames from "classnames/bind";
import styles from "./Calendar.module.scss";

const cx = classNames.bind(styles);

function CalendarPage() {
  // Dữ liệu mẫu cho công việc chưa được lên lịch
  const unscheduledWorkItems = [
    { id: "1", name: "fasdfdsa", task: "TES-4", status: "TO DO" },
    // Thêm các công việc khác ở đây
  ];

  return (
    <div className={cx("calendar-page-container")}>
      <div className={cx("calendar-header")}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search Calendar"
          className={cx("search-input")}
        />
        <Select defaultValue="assignee" className={cx("filter-select")}>
          <Select.Option value="assignee">Assignee</Select.Option>
          {/* Thêm các tùy chọn khác */}
        </Select>
        <Select defaultValue="type" className={cx("filter-select")}>
          <Select.Option value="type">Type</Select.Option>
          {/* Thêm các tùy chọn khác */}
        </Select>
        <Select defaultValue="status" className={cx("filter-select")}>
          <Select.Option value="status">Status</Select.Option>
          {/* Thêm các tùy chọn khác */}
        </Select>
        <Button type="text">Other Filter</Button>
        <div className={cx("calendar-controls")}>
          <Button>Today</Button>
          <Button type="text">{"<"}</Button>
          <span>May 2025</span>
          <Button type="text">{">"}</Button>
          <Button icon={<CalendarOutlined />} />
          <Button icon={<FilterOutlined />} />
        </div>
      </div>
      <div className={cx("calendar-main-content")}>
        <div className={cx("calendar-grid")}>
          {/* Phần lưới lịch sẽ được triển khai ở đây */}
          <p>Calendar Grid (Need to implement)</p>
        </div>
        <div className={cx("unscheduled-work-sidebar")}>
          <div className={cx("sidebar-header")}>
            <h3>Unscheduled Work</h3>
            <Button icon={<CloseOutlined />} type="text" />
          </div>
          <p>
            Drag and drop each work item to the calendar to set the completion
            date for the work.
          </p>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search Unscheduled Work"
            className={cx("search-input")}
          />
          <div className={cx("sidebar-controls")}>
            <Select
              defaultValue="most-recent"
              className={cx("filter-select-sidebar")}
            >
              <Select.Option value="most-recent">Most Recent</Select.Option>
              {/* Thêm các tùy chọn khác */}
            </Select>
            <Button icon={<FilterOutlined />} type="text">
              Other Filter
            </Button>
          </div>
          <div className={cx("work-items-list")}>
            {unscheduledWorkItems.map((item) => (
              <div key={item.id} className={cx("work-item")}>
                <div>{item.name}</div>
                <div className={cx("task-info")}>
                  <span>{item.task}</span>
                  <span className={cx("status-tag")}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
