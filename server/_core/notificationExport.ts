import { parse } from "json2csv";

export interface NotificationRecord {
  id: number;
  createdAt: Date;
  type: string;
  subType?: string;
  title: string;
  message: string;
  isRead: boolean;
  emailSent: boolean;
  inAppShown: boolean;
}

/**
 * Convert notifications to CSV format
 */
export function notificationsToCSV(notifications: NotificationRecord[]): string {
  const fields = [
    "id",
    "createdAt",
    "type",
    "subType",
    "title",
    "message",
    "isRead",
    "emailSent",
    "inAppShown",
  ];

  const data = notifications.map((n) => ({
    id: n.id,
    createdAt: new Date(n.createdAt).toISOString(),
    type: n.type,
    subType: n.subType || "",
    title: n.title,
    message: n.message,
    isRead: n.isRead ? "Yes" : "No",
    emailSent: n.emailSent ? "Yes" : "No",
    inAppShown: n.inAppShown ? "Yes" : "No",
  }));

  try {
    return parse(data, { fields });
  } catch (error) {
    // Fallback to manual CSV generation if json2csv fails
    return generateCSVManually(data, fields);
  }
}

/**
 * Manual CSV generation fallback
 */
function generateCSVManually(
  data: Record<string, any>[],
  fields: string[]
): string {
  const header = fields.map((f) => `"${f}"`).join(",");
  const rows = data.map((row) =>
    fields
      .map((field) => {
        const value = row[field] || "";
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

/**
 * Convert notifications to JSON format
 */
export function notificationsToJSON(
  notifications: NotificationRecord[]
): string {
  const data = notifications.map((n) => ({
    id: n.id,
    createdAt: new Date(n.createdAt).toISOString(),
    type: n.type,
    subType: n.subType || null,
    title: n.title,
    message: n.message,
    status: {
      read: n.isRead,
      emailSent: n.emailSent,
      inAppShown: n.inAppShown,
    },
  }));

  return JSON.stringify(data, null, 2);
}

/**
 * Generate compliance report summary
 */
export function generateComplianceReport(
  notifications: NotificationRecord[],
  stats: any,
  dateRange: { start: Date; end: Date }
): string {
  const startDate = new Date(dateRange.start).toLocaleDateString();
  const endDate = new Date(dateRange.end).toLocaleDateString();

  let report = `NOTIFICATION COMPLIANCE REPORT\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Period: ${startDate} to ${endDate}\n`;
  report += `\n`;

  report += `SUMMARY STATISTICS\n`;
  report += `==================\n`;
  report += `Total Notifications: ${stats.total}\n`;
  report += `Read: ${stats.read} (${((stats.read / stats.total) * 100).toFixed(1)}%)\n`;
  report += `Unread: ${stats.unread} (${((stats.unread / stats.total) * 100).toFixed(1)}%)\n`;
  report += `Email Sent: ${stats.emailSent}\n`;
  report += `In-App Shown: ${stats.inAppShown}\n`;
  report += `\n`;

  report += `NOTIFICATIONS BY TYPE\n`;
  report += `====================\n`;
  Object.entries(stats.byType).forEach(([type, count]: [string, any]) => {
    report += `${type}: ${count}\n`;
  });
  report += `\n`;

  report += `NOTIFICATIONS BY SUBTYPE\n`;
  report += `========================\n`;
  Object.entries(stats.bySubType).forEach(([subType, count]: [string, any]) => {
    report += `${subType}: ${count}\n`;
  });
  report += `\n`;

  report += `HIGH PRIORITY ITEMS\n`;
  report += `===================\n`;
  const highPriority = notifications.filter(
    (n) =>
      n.type === "feedback" ||
      n.subType === "low_rating" ||
      n.subType === "bug_report"
  );
  report += `Total: ${highPriority.length}\n`;
  highPriority.slice(0, 10).forEach((n) => {
    report += `- [${new Date(n.createdAt).toLocaleDateString()}] ${n.title}: ${n.message.substring(0, 50)}...\n`;
  });
  if (highPriority.length > 10) {
    report += `... and ${highPriority.length - 10} more\n`;
  }

  return report;
}

/**
 * Generate audit trail
 */
export function generateAuditTrail(
  notifications: NotificationRecord[]
): string {
  let trail = `NOTIFICATION AUDIT TRAIL\n`;
  trail += `Generated: ${new Date().toISOString()}\n`;
  trail += `Total Records: ${notifications.length}\n`;
  trail += `\n`;

  trail += `DETAILED LOG\n`;
  trail += `============\n`;

  notifications.forEach((n, index) => {
    trail += `\n[${index + 1}] ${new Date(n.createdAt).toISOString()}\n`;
    trail += `Type: ${n.type}${n.subType ? ` (${n.subType})` : ""}\n`;
    trail += `Title: ${n.title}\n`;
    trail += `Message: ${n.message}\n`;
    trail += `Status: ${n.isRead ? "Read" : "Unread"}\n`;
    trail += `Delivery: Email=${n.emailSent ? "✓" : "✗"}, InApp=${n.inAppShown ? "✓" : "✗"}\n`;
  });

  return trail;
}

/**
 * Generate filename with timestamp
 */
export function generateExportFilename(
  format: "csv" | "json" | "txt",
  reportType: "archive" | "compliance" | "audit"
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
  return `notifications-${reportType}-${timestamp}.${format}`;
}
