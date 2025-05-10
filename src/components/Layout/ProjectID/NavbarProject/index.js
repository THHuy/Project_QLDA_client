import { Tabs } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./NavbarProject.module.scss";
import Backlog from "~/pages/Project/Backlog";
import CalendarPage from "~/pages/Project/Calendar";
const cx = classNames.bind(styles);
function NavbarProject() {
  const navigate = useNavigate();
  const params = useParams();

  const onChange = (key) => {
    const { projectId } = params;
    const selectedItem = items.find((item) => item.key === key);
    if (selectedItem && projectId) {
      const slug = selectedItem.label.toLowerCase().replace(/\s+/g, "-");
      navigate(`/projects/id/${projectId}/${slug}`);
    } else {
      console.warn(
        "Navigation failed: Tab or route parameter (projectId) missing.",
        { key, selectedItem, projectId }
      );
    }
  };
  const items = [
    {
      key: "1",
      label: "Summary",
      children: "Content of Tab Summary",
    },
    {
      key: "2",
      label: "Timeline",
      children: "Content of Tab Timeline",
    },
    {
      key: "3",
      label: "Backlog",
      children: <Backlog />,
    },
    {
      key: "4",
      label: "Active Sprint",
      children: "Content of Tab Active Sprint",
    },
    {
      key: "5",
      label: "Calendar",
      children: <CalendarPage />,
    },
    {
      key: "6",
      label: "Report",
      children: "Content of Tab Report",
    },
    {
      key: "7",
      label: "List",
      children: "Content of Tab List",
    },
    {
      key: "8",
      label: "All Work",
      children: "Content of Tab All Work",
    },
    {
      key: "9",
      label: "Test Case",
      children: "Content of Tab Test Case",
    },
  ];
  return (
    <div className={cx("container-fluid")}>
      <Tabs defaultActiveKey="3" items={items} onChange={onChange} />
    </div>
  );
}

export default NavbarProject;
