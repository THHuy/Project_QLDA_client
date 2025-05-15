// Helper Functions
export const convertDraftToText = (rawContentState) => {
  if (
    !rawContentState ||
    !rawContentState.blocks ||
    rawContentState.blocks.length === 0
  ) {
    return "N/A";
  }
  return rawContentState.blocks.map((block) => block.text).join("\n");
};

// Helper function to get collection name based on work type
export const getCollectionName = (workType) => {
  switch (workType) {
    case "Bug":
      return "bugs";
    case "Test Case":
      return "test_cases";
    default:
      return "tasks";
  }
};

// Helper function to get change description
export const getChangeDescription = (fieldChanged, userName) => {
  const user = userName || "User";
  switch (fieldChanged) {
    case "status":
      return `${user} updated the Status`;
    case "priority":
      return `${user} updated the Priority`;
    case "assignee_id":
      return `${user} changed the Assignee`;
    case "due_date":
      return `${user} updated the Due date`;
    case "summary":
      return `${user} updated the Summary`;
    case "test_case_name":
      return `${user} updated the Test Case Name`;
    default:
      return `${user} updated ${fieldChanged}`;
  }
}; 