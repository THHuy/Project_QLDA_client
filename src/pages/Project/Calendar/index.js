import { Button, Input, Select } from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  FilterOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useState, useEffect, createRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "~/components/services/firebase";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import classNames from "classnames/bind";
import styles from "./Calendar.module.scss";

// --- FullCalendar Imports ---
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";

const cx = classNames.bind(styles);

function CalendarPage() {
  const { currentUser } = useAuth();
  const { projectId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledItems, setScheduledItems] = useState([]);
  const [unscheduledDraggableItems, setUnscheduledDraggableItems] = useState(
    []
  );
  const calendarRef = createRef(); // Ref for FullCalendar
  const unscheduledContainerRef = createRef(); // Ref for the unscheduled items container

  // Add filter states
  const [filters, setFilters] = useState({
    assignee: "all",
    type: "all",
    status: "all",
    searchText: "",
  });

  // Add filter handlers
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      searchText: e.target.value,
    }));
  };

  // Filter function for calendar items
  const filterCalendarItems = (items) => {
    return items.filter((item) => {
      const matchesAssignee =
        filters.assignee === "all" ||
        (filters.assignee === "me" &&
          item.extendedProps.assignee_id === currentUser?.uid) ||
        (filters.assignee === "others" &&
          item.extendedProps.assignee_id !== currentUser?.uid) ||
        (filters.assignee === "unassigned" && !item.extendedProps.assignee_id);

      const matchesType =
        filters.type === "all" || item.extendedProps.work_type === filters.type;

      const matchesStatus =
        filters.status === "all" ||
        item.extendedProps.status === filters.status.toUpperCase();

      const matchesSearch =
        !filters.searchText ||
        item.title.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        (item.extendedProps.key &&
          item.extendedProps.key
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()));

      return matchesAssignee && matchesType && matchesStatus && matchesSearch;
    });
  };

  // --- Helper function to update item in Firebase ---
  const updateWorkItemInFirebase = async (itemId, itemType, newDates) => {
    if (!currentUser) {
      console.error("User not authenticated for update.");
      return false;
    }
    if (!itemType) {
      console.error("Item type is missing, cannot determine collection.");
      return false;
    }

    // Determine the correct Firestore collection based on itemType
    const collectionName = itemType + "s"; // e.g., 'tasks', 'bugs', 'test_cases'

    try {
      const itemRef = doc(db, collectionName, itemId);
      await updateDoc(itemRef, {
        ...newDates, // Should contain start_date and due_date
        updated_at: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error(`Error updating ${itemType} ${itemId} in Firebase:`, error);
      return false;
    }
  };

  // Fetch data from Firebase with useCallback to ensure stable reference
  const fetchData = useCallback(async () => {
    if (!projectId || !currentUser) return;
    setIsLoading(true);
    try {
      const collectionsToFetch = ["tasks", "bugs", "test_cases"];
      let allItems = [];

      for (const collName of collectionsToFetch) {
        const q = query(
          collection(db, collName),
          where("project_id", "==", projectId)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          allItems.push({
            id: doc.id,
            ...doc.data(),
            work_type: collName.slice(0, -1), // Convert plural to singular (e.g., 'tasks' -> 'task')
          });
        });
      }

      const scheduled = [];
      const unscheduled = [];

      allItems.forEach((item) => {
        // Handle different date formats (Firestore Timestamp or string)
        const dueDate = item.due_date
          ? item.due_date.toDate
            ? item.due_date.toDate()
            : new Date(item.due_date)
          : null;

        // Only consider items that are not marked as DONE
        if (item.status !== "DONE") {
          if (dueDate) {
            // If it has a due date, add it to scheduled items
            const startDate = item.start_date
              ? item.start_date.toDate
                ? item.start_date.toDate()
                : new Date(item.start_date)
              : new Date(); // Default to current date if no start date

            scheduled.push({
              id: item.id,
              title:
                item.summary ||
                item.test_case_name ||
                item.name ||
                "Untitled Event",
              start: startDate,
              end: dueDate,
              allDay: false,
              extendedProps: { ...item, work_type: item.work_type },
              backgroundColor: getItemColor(item.work_type, "background"),
              borderColor: getItemColor(item.work_type, "border"),
            });
          } else {
            // If it does not have a due date, add it to unscheduled items
            unscheduled.push(item);
          }
        }
      });

      // Apply filters to scheduled items
      const filteredScheduled = filterCalendarItems(scheduled);
      setScheduledItems(filteredScheduled);
      setUnscheduledDraggableItems(unscheduled);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setIsLoading(false);
  }, [projectId, currentUser, filters]);

  // Helper function to get color based on work type
  const getItemColor = (workType, colorType) => {
    const colors = {
      bug: { background: "#ffcdd2", border: "#e57373" },
      task: { background: "#bbdefb", border: "#64b5f6" },
      test_case: { background: "#c8e6c9", border: "#81c784" },
    };

    return colors[workType] ? colors[workType][colorType] : "#e0e0e0";
  };

  // Handle event received from external drop
  const handleCalendarEventReceived = async (dropInfo) => {
    const { event } = dropInfo;
    const { extendedProps } = event;

    if (!extendedProps || !extendedProps.id || !extendedProps.work_type) {
      console.error("Dropped item is missing required data", extendedProps);
      if (event.remove) event.remove();
      return;
    }

    const newStartDate = event.start;
    let newEndDate = event.end;

    // Ensure we have a reasonable end date
    if (!newEndDate || newEndDate <= newStartDate) {
      newEndDate = new Date(newStartDate);
      if (event.allDay) {
        newEndDate.setHours(23, 59, 59, 999);
      } else {
        // Default to 1 hour duration
        newEndDate.setHours(newStartDate.getHours() + 1);
      }
    }

    const success = await updateWorkItemInFirebase(
      extendedProps.id,
      extendedProps.work_type,
      {
        start_date: newStartDate,
        due_date: newEndDate,
      }
    );

    if (success) {
      // Refresh data to ensure UI consistency
      await fetchData();
    } else {
      console.error(
        "Failed to update item in Firebase. Reverting calendar event."
      );
      if (event.remove) event.remove();
    }
  };

  // Handle event drop for already scheduled items
  const handleEventDrop = async (dropInfo) => {
    const { event, oldEvent } = dropInfo;
    const { extendedProps } = event;

    if (!extendedProps || !extendedProps.id || !extendedProps.work_type) {
      console.error("Dropped event is missing required data", extendedProps);
      dropInfo.revert();
      return;
    }

    const newStartDate = event.start;
    let newEndDate = event.end;

    // Ensure we have a reasonable end date
    if (!newEndDate || newEndDate <= newStartDate) {
      newEndDate = new Date(newStartDate);
      if (event.allDay) {
        newEndDate.setHours(23, 59, 59, 999);
      } else {
        // Maintain the same duration as before
        const oldDuration = oldEvent.end - oldEvent.start;
        newEndDate = new Date(newStartDate.getTime() + oldDuration);
      }
    }

    const success = await updateWorkItemInFirebase(
      extendedProps.id,
      extendedProps.work_type,
      {
        start_date: newStartDate,
        due_date: newEndDate,
      }
    );

    if (!success) {
      console.error("Failed to update item in Firebase after drop. Reverting.");
      dropInfo.revert();
    }
  };

  // Setup draggable and load data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup draggable for unscheduled items
  useEffect(() => {
    if (
      unscheduledContainerRef.current &&
      unscheduledDraggableItems.length > 0
    ) {
      const draggable = new Draggable(unscheduledContainerRef.current, {
        itemSelector: `.${cx("work-item")}`,
        eventData: function (eventEl) {
          const itemId = eventEl.getAttribute("data-id");
          const itemName = eventEl.getAttribute("data-name");
          const workType = eventEl.getAttribute("data-type");

          const fullItem = unscheduledDraggableItems.find(
            (i) => i.id === itemId
          );

          if (fullItem) {
            return {
              title: itemName || "Untitled Event",
              create: true,
              duration: "02:00",
              id: itemId, // Use the actual item ID
              backgroundColor: getItemColor(workType, "background"),
              borderColor: getItemColor(workType, "border"),
              extendedProps: {
                ...fullItem,
                id: itemId, // Ensure ID is in extendedProps too
                work_type: workType,
              },
            };
          }
          return {};
        },
      });

      // Cleanup function
      return () => {
        draggable.destroy();
      };
    }
  }, [unscheduledDraggableItems, cx]);

  return (
    <div className={cx("calendar-page-container")}>
      <div className={cx("calendar-header")}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search Calendar"
          className={cx("search-input")}
          value={filters.searchText}
          onChange={handleSearchChange}
        />
        <Select
          defaultValue="all"
          className={cx("filter-select")}
          value={filters.assignee}
          onChange={(value) => handleFilterChange("assignee", value)}
        >
          <Select.Option value="all">All Assignees</Select.Option>
          <Select.Option value="me">Assigned to Me</Select.Option>
          <Select.Option value="others">Assigned to Others</Select.Option>
          <Select.Option value="unassigned">Unassigned</Select.Option>
        </Select>
        <Select
          defaultValue="all"
          className={cx("filter-select")}
          value={filters.type}
          onChange={(value) => handleFilterChange("type", value)}
        >
          <Select.Option value="all">All Types</Select.Option>
          <Select.Option value="bug">Bugs</Select.Option>
          <Select.Option value="task">Tasks</Select.Option>
          <Select.Option value="test_case">Test Cases</Select.Option>
        </Select>
        <Select
          defaultValue="all"
          className={cx("filter-select")}
          value={filters.status}
          onChange={(value) => handleFilterChange("status", value)}
        >
          <Select.Option value="all">All Status</Select.Option>
          <Select.Option value="todo">To Do</Select.Option>
          <Select.Option value="in_progress">In Progress</Select.Option>
          <Select.Option value="review">In Review</Select.Option>
          <Select.Option value="done">Done</Select.Option>
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
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            events={scheduledItems}
            editable={true}
            droppable={true}
            eventReceive={handleCalendarEventReceived}
            eventDrop={handleEventDrop}
            weekends={true}
            height="auto"
          />
        </div>
        <div
          className={cx("unscheduled-work-sidebar")}
          ref={unscheduledContainerRef}
        >
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
              {/* Add other options */}
            </Select>
            <Button icon={<FilterOutlined />} type="text">
              Other Filter
            </Button>
          </div>
          <div className={cx("work-items-list")}>
            {isLoading ? (
              <p>Loading work items...</p>
            ) : unscheduledDraggableItems.length > 0 ? (
              unscheduledDraggableItems.map((item) => (
                <div
                  key={item.id}
                  className={cx("work-item")}
                  data-id={item.id}
                  data-type={item.work_type}
                  data-name={
                    item.summary ||
                    item.test_case_name ||
                    item.name ||
                    "Untitled"
                  }
                  style={{
                    borderLeft: `4px solid ${getItemColor(
                      item.work_type,
                      "border"
                    )}`,
                    backgroundColor: getItemColor(item.work_type, "background"),
                  }}
                >
                  <div>{item.summary || item.test_case_name || item.name}</div>
                  <div className={cx("task-info")}>
                    <span>
                      {item.key || item.work_type?.toUpperCase() || "N/A"}
                    </span>
                    <span className={cx("status-tag")}>{item.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <p>No unscheduled work items.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
