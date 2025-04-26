import { Tabs } from "antd";
import classNames from "classnames/bind";
import styles from "./NavbarProject.module.scss";
const cx = classNames.bind(styles);
function NavbarProject() {
  const onChange = (key) => {
    console.log(key);
  };
  const items = [
    {
      key: "1",
      label: "Summary",
      children: "Content of Tab Summary",
    },
    {
      key: "2",
      label: "Board",
      children: "Content of Tab Board",
    },
    {
      key: "3",
      label: "List",
      children: "Content of Tab List",
    },
    {
      key: "4",
      label: "Calendar",
      children: "Content of Tab Calendar",
    },
    {
      key: "5",
      label: "Timeline",
      children: "Content of Tab Timeline",
    },
    {
      key: "6",
      label: "Report",
      children: "Content of Tab Report",
    },
  ];
  return (
    <div className={cx("container-fluid")}>
      <Tabs defaultActiveKey="2" items={items} onChange={onChange} />
    </div>
  );
}

export default NavbarProject;
