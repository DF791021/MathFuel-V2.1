/**
 * Analytics Export Utilities
 * Provides functions to export analytics data to CSV and PDF formats
 */

interface StudentPerformance {
  playerName: string;
  totalGamesPlayed: number;
  averageScore: number;
  accuracyRate: number;
  totalCorrectAnswers: number;
  totalAnswers: number;
}

interface QuestionAnalytics {
  title: string;
  difficulty: string;
  totalAttempts: number;
  correctAnswers: number;
  accuracyRate: number;
  averageTimeSpent: number;
}

interface ClassPerformance {
  className: string;
  totalStudents: number;
  totalGamesPlayed: number;
  averageScore: number;
  classAccuracyRate: number;
}

/**
 * Export student performance data to CSV
 */
export function exportStudentPerformanceCSV(students: StudentPerformance[]): string {
  const headers = [
    "Student Name",
    "Games Played",
    "Average Score",
    "Accuracy Rate (%)",
    "Correct Answers",
    "Total Answers",
  ];

  const rows = students.map((student) => [
    student.playerName,
    student.totalGamesPlayed,
    Math.round(student.averageScore),
    student.accuracyRate,
    student.totalCorrectAnswers,
    student.totalAnswers,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Export question performance data to CSV
 */
export function exportQuestionPerformanceCSV(questions: QuestionAnalytics[]): string {
  const headers = [
    "Question Title",
    "Difficulty",
    "Total Attempts",
    "Correct Answers",
    "Accuracy Rate (%)",
    "Average Time (seconds)",
  ];

  const rows = questions.map((question) => [
    `"${question.title}"`, // Quote to handle commas in titles
    question.difficulty,
    question.totalAttempts,
    question.correctAnswers,
    question.accuracyRate,
    Math.round(question.averageTimeSpent),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Export class performance data to CSV
 */
export function exportClassPerformanceCSV(classes: ClassPerformance[]): string {
  const headers = [
    "Class Name",
    "Total Students",
    "Games Played",
    "Average Score",
    "Class Accuracy Rate (%)",
  ];

  const rows = classes.map((cls) => [
    cls.className,
    cls.totalStudents,
    cls.totalGamesPlayed,
    Math.round(cls.averageScore),
    cls.classAccuracyRate,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/csv;charset=utf-8," + encodeURIComponent(content)
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Generate comprehensive analytics report
 */
export function generateAnalyticsReport(
  students: StudentPerformance[],
  questions: QuestionAnalytics[],
  classes: ClassPerformance[],
  summary: {
    totalGamesPlayed: number;
    totalStudents: number;
    averageAccuracy: number;
    averageScore: number;
  }
): string {
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();

  let report = `GAME ANALYTICS REPORT\n`;
  report += `Generated: ${date} at ${time}\n`;
  report += `\n${"=".repeat(80)}\n\n`;

  // Summary Section
  report += `SUMMARY\n`;
  report += `${"-".repeat(80)}\n`;
  report += `Total Games Played: ${summary.totalGamesPlayed}\n`;
  report += `Total Students: ${summary.totalStudents}\n`;
  report += `Average Accuracy: ${summary.averageAccuracy}%\n`;
  report += `Average Score: ${Math.round(summary.averageScore)}\n`;
  report += `\n`;

  // Class Performance Section
  if (classes.length > 0) {
    report += `CLASS PERFORMANCE\n`;
    report += `${"-".repeat(80)}\n`;
    classes.forEach((cls) => {
      report += `\nClass: ${cls.className}\n`;
      report += `  Students: ${cls.totalStudents}\n`;
      report += `  Games Played: ${cls.totalGamesPlayed}\n`;
      report += `  Average Score: ${Math.round(cls.averageScore)}\n`;
      report += `  Accuracy Rate: ${cls.classAccuracyRate}%\n`;
    });
    report += `\n`;
  }

  // Top Students Section
  if (students.length > 0) {
    report += `TOP STUDENT PERFORMERS\n`;
    report += `${"-".repeat(80)}\n`;
    const topStudents = students.slice(0, 10);
    topStudents.forEach((student, index) => {
      report += `${index + 1}. ${student.playerName}\n`;
      report += `   Accuracy: ${student.accuracyRate}% | Score: ${Math.round(
        student.averageScore
      )} | Games: ${student.totalGamesPlayed}\n`;
    });
    report += `\n`;
  }

  // Question Analysis Section
  if (questions.length > 0) {
    report += `QUESTION PERFORMANCE ANALYSIS\n`;
    report += `${"-".repeat(80)}\n`;
    const topQuestions = questions.slice(0, 10);
    topQuestions.forEach((question) => {
      report += `\nQ: ${question.title}\n`;
      report += `   Difficulty: ${question.difficulty}\n`;
      report += `   Attempts: ${question.totalAttempts}\n`;
      report += `   Accuracy: ${question.accuracyRate}%\n`;
      report += `   Avg Time: ${Math.round(question.averageTimeSpent)}s\n`;
    });
  }

  return report;
}

/**
 * Download text report file
 */
export function downloadReport(content: string, filename: string): void {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(content)
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Format date for display
 */
export function formatDateRange(startDate?: Date, endDate?: Date): string {
  if (!startDate || !endDate) {
    return "All Time";
  }
  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
}

/**
 * Get date range for analytics query
 */
export function getDateRange(days: number): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return { startDate, endDate };
}
