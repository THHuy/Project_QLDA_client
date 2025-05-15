import { Tabs } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./NavbarProject.module.scss";
import Backlog from "~/pages/Project/Backlog";
import CalendarPage from "~/pages/Project/Calendar";
import SummaryPage from "~/pages/Project/Summary";
import AllWork from "~/pages/Project/AllWork";
import Timeline from "~/pages/Project/Timeline";
import Report from "~/pages/Project/Report";
const cx = classNames.bind(styles);
function NavbarProject() {
  const navigate = useNavigate();
  const params = useParams();
  const { projectId } = params;

  const onChange = (key) => {
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
      children: <SummaryPage projectId={projectId} />,
    },
    {
      key: "2",
      label: "Timeline",
      children: <Timeline />,
    },
    {
      key: "3",
      label: "Backlog",
      children: <Backlog />,
    },
    {
      key: "4",
      label: "Calendar",
      children: <CalendarPage />,
    },
    {
      key: "5",
      label: "Report",
      children: <Report />,
    },
    {
      key: "6",
      label: "All Work",
      children: <AllWork />,
    },
  ];
  return (
    <div className={cx("container-fluid")}>
      <Tabs defaultActiveKey="3" items={items} onChange={onChange} />
    </div>
  );
}

export default NavbarProject;
