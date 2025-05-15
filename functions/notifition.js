/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
admin.initializeApp();
// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

/**
 * Sends a notification for a new issue (task, bug, or test case).
 * @param {Object} event - The Firestore event object containing the document snapshot.
 * @param {string} type - The type of issue (Task, Bug, or Test Case).
 * @return {Promise<null>} - Returns null when complete.
 */
async function sendNotificationForIssue(event, type) {
  try {
    const issue = event.data.data(); // Lấy dữ liệu từ Firestore document
    const issueId = event.params.issueId; // Lấy issueId từ wildcard
    const projectId = issue.project_id;
    console.log("issue", issue);
    console.log("projectId", projectId);
    // Lấy danh sách userId từ Firestore
    const projectDoc = await admin.firestore().collection("project").doc(projectId).get();
    if (!projectDoc.exists) {
      logger.info("Project not found in Firestore");
      return null;
    }
    const userIds = projectDoc.data().users || [];
    console.log("userIds", userIds);    
    // Lấy FCM token của từng user từ Realtime Database
    const tokens = [];
    for (const userId of userIds) {
      const tokenSnap = await admin.database().ref(`/users/${userId}/fcmToken`).once("value");
      if (tokenSnap.val()) tokens.push(tokenSnap.val());
    }
    console.log("tokens", tokens);
    // Gửi thông báo nếu có token
    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: `Có ${type} mới!`,
          body: `${issue.summary || issue.test_case_name || "Issue"} vừa được thêm vào project.`,
        },
        data: {
          url: `/project/${projectId}/${type.toLowerCase()}s/${issueId}`,
        },
      });
      logger.info("Notifications sent to tokens:", tokens);
    } else {
      logger.info("No tokens found to send notifications");
    }

    return null;
  } catch (error) {
    logger.error(`Error sending notification for ${type}:`, error);
    return null;
  }
}

// Trigger cho tasks
exports.notifyNewTask = onDocumentCreated(
    {
      document: "tasks/{issueId}",
      region: "us-central1", // Thay đổi region nếu cần
    },
    (event) => sendNotificationForIssue(event, "Task"),
);

// Trigger cho bugs
exports.notifyNewBug = onDocumentCreated(
    {
      document: "bugs/{issueId}",
      region: "us-central1",
    },
    (event) => sendNotificationForIssue(event, "Bug"),
);

// Trigger cho test_cases
exports.notifyNewTestCase = onDocumentCreated(
    {
      document: "test_cases/{issueId}",
      region: "us-central1",
    },
    (event) => sendNotificationForIssue(event, "Test Case"),
);
