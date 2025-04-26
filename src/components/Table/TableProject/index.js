import { Table, Popover } from "antd";
import classNames from "classnames/bind";
import styles from "./TableProject.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

const cx = classNames.bind(styles);

function TableProject() {
  const [openPopoverKey, setOpenPopoverKey] = useState(null);

  const handleOpenChange = (newOpen, recordKey) => {
    setOpenPopoverKey(newOpen ? recordKey : null);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      sorter: {
        compare: (a, b) => a.name.length - b.name.length,
        multiple: 3,
      },
    },
    {
      title: "Key",
      dataIndex: "keyName",
      sorter: {
        compare: (a, b) => a.keyName.length - b.keyName.length,
        multiple: 3,
      },
    },
    {
      title: "Lead",
      dataIndex: "lead",
      sorter: {
        compare: (a, b) => a.lead.length - b.lead.length,
        multiple: 2,
      },
    },
    {
      title: "More Actions",
      dataIndex: "",
      key: "x",
      render: (_, record) => (
        <Popover
          trigger="click"
          open={openPopoverKey === record.key}
          onOpenChange={(newOpen) => handleOpenChange(newOpen, record.key)}
          content={
            <div className={cx("actions")}>
              <a href="/project-setting">Project Setting</a>
              <a href="/move-trash">Move to trash</a>
            </div>
          }
        >
          <div className={cx("popup-dot")}>
            <FontAwesomeIcon icon={faEllipsis} />
          </div>
        </Popover>
      ),
    },
  ];

  const data = [
    {
      key: "1",
      name: "Phân tích thiết kế",
      keyName: "Pttk",
      lead: "Huy Truong",
    },
    {
      key: "2",
      name: "Thiết kế giao diện",
      keyName: "Tkgd",
      lead: "Huy Truong",
    },
    {
      key: "3",
      name: "Lập trình phần mềm",
      keyName: "Ltpm",
      lead: "Huy Truong",
    },
    {
      key: "4",
      name: "Kiểm thử",
      keyName: "Kt",
      lead: "Huy Truong",
    },
  ];

  const onChange = (pagination, filters, sorter, extra) => {
    console.log("params", pagination, filters, sorter, extra);
  };

  return (
    <div className={cx("container")}>
      <Table columns={columns} dataSource={data} onChange={onChange} />
    </div>
  );
}

export default TableProject;
