import { PDFDocument, PDFPage, rgb, degrees } from "pdf-lib";
import { readFileSync } from "fs";
import { join } from "path";

export interface SuccessStoryData {
  id: number;
  studentName: string;
  goalName: string;
  goalType: string;
  title: string;
  description: string;
  testimonial?: string | null;
  tips?: string | null;
  impactScore: number | null;
  createdAt: Date;
  reactionCount?: number;
  commentCount?: number;
}

export interface ReportOptions {
  className: string;
  schoolName?: string;
  schoolLogo?: string;
  teacherName: string;
  reportDate: Date;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  includeMetrics?: boolean;
  includeTestimonials?: boolean;
  includeTips?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  teacherNotes?: string;
  isMultiClass?: boolean;
  classCount?: number;
}

/**
 * Generate a professional PDF report of success stories
 */
export async function generateSuccessStoriesPDF(
  stories: SuccessStoryData[],
  options: ReportOptions
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const pageWidth = 612; // 8.5 inches
  const pageHeight = 792; // 11 inches
  const margin = 40;
  const contentWidth = pageWidth - 2 * margin;

  // Add cover page
  await addCoverPage(pdfDoc, options);

  // Add table of contents
  await addTableOfContents(pdfDoc, stories, options);

  // Add executive summary
  await addExecutiveSummary(pdfDoc, stories, options);

  // Add individual story pages
  for (const story of stories) {
    await addStoryPage(pdfDoc, story, options);
  }

  // Add metrics summary
  if (options.includeMetrics) {
    await addMetricsSummary(pdfDoc, stories, options);
  }

  // Add teacher notes page
  if (options.teacherNotes) {
    await addTeacherNotesPage(pdfDoc, options);
  }

  // Serialize PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function addCoverPage(
  pdfDoc: PDFDocument,
  options: ReportOptions
): Promise<void> {
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const centerX = width / 2;

  // Add school logo if provided
  if (options.schoolLogo) {
    try {
      const logoBytes = readFileSync(options.schoolLogo);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      page.drawImage(logoImage, {
        x: centerX - 50,
        y: height - 150,
        width: 100,
        height: 100,
      });
    } catch (error) {
      console.error("Failed to embed logo:", error);
    }
  }

  // Title
  page.drawText("Success Stories Report", {
    x: 40,
    y: height - 250,
    size: 36,
    font: await pdfDoc.embedFont("Helvetica-Bold"),
    color: rgb(0.2, 0.4, 0.2),
    maxWidth: width - 80,
  });

  // School and class info
  page.drawText(`${options.schoolName || "School"} - ${options.className}`, {
    x: 40,
    y: height - 310,
    size: 18,
    font: await pdfDoc.embedFont("Helvetica"),
    color: rgb(0.4, 0.4, 0.4),
  });

  // Report date
  page.drawText(
    `Report Generated: ${options.reportDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    {
      x: 40,
      y: height - 350,
      size: 12,
      font: await pdfDoc.embedFont("Helvetica"),
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  // Date range if provided
  if (options.dateRange) {
    const rangeText = `Stories from ${options.dateRange.startDate.toLocaleDateString()} to ${options.dateRange.endDate.toLocaleDateString()}`;
    page.drawText(rangeText, {
      x: 40,
      y: height - 375,
      size: 11,
      font: await pdfDoc.embedFont("Helvetica"),
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // Teacher name
  page.drawText(`Prepared by: ${options.teacherName}`, {
    x: 40,
    y: height - 410,
    size: 12,
    font: await pdfDoc.embedFont("Helvetica"),
    color: rgb(0.4, 0.4, 0.4),
  });

  // Story count
  page.drawText(`Total Success Stories: ${0}`, {
    x: 40,
    y: height - 450,
    size: 14,
    font: await pdfDoc.embedFont("Helvetica-Bold"),
    color: rgb(0.2, 0.4, 0.2),
  });

  // Decorative line
  page.drawLine({
    start: { x: 40, y: height - 480 },
    end: { x: width - 40, y: height - 480 },
    thickness: 2,
    color: rgb(0.2, 0.4, 0.2),
  });
}

async function addTableOfContents(
  pdfDoc: PDFDocument,
  stories: SuccessStoryData[],
  options: ReportOptions
): Promise<void> {
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let yPosition = height - 60;

  // Title
  page.drawText("Table of Contents", {
    x: 40,
    y: yPosition,
    size: 24,
    font: await pdfDoc.embedFont("Helvetica-Bold"),
    color: rgb(0.2, 0.4, 0.2),
  });

  yPosition -= 40;

  // Contents list
  const contents = [
    "Executive Summary",
    ...stories.map((_, i) => `Success Story ${i + 1}: ${stories[i].studentName}`),
  ];

  if (options.includeMetrics) {
    contents.push("Engagement Metrics Summary");
  }

  if (options.teacherNotes) {
    contents.push("Teacher Notes");
  }

  for (const item of contents) {
    page.drawText(item, {
      x: 60,
      y: yPosition,
      size: 11,
      font: await pdfDoc.embedFont("Helvetica"),
      color: rgb(0.3, 0.3, 0.3),
    });
    yPosition -= 20;
  }
}

async function addExecutiveSummary(
  pdfDoc: PDFDocument,
  stories: SuccessStoryData[],
  options: ReportOptions
): Promise<void> {
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let yPosition = height - 60;

  // Title
  page.drawText("Executive Summary", {
    x: 40,
    y: yPosition,
    size: 24,
    font: await pdfDoc.embedFont("Helvetica-Bold"),
    color: rgb(0.2, 0.4, 0.2),
  });

  yPosition -= 40;

  // Summary text
  const totalStories = stories.length;
  const avgImpactScore =
    stories.reduce((sum, s) => sum + (s.impactScore || 0), 0) / totalStories;
  const totalEngagement = stories.reduce(
    (sum, s) => sum + (s.reactionCount || 0) + (s.commentCount || 0),
    0
  );

  const classInfo = options.isMultiClass ? `${options.classCount} classes` : options.className;
  const summaryText = `This report showcases ${totalStories} inspiring success stories from ${classInfo}. Our students have demonstrated remarkable growth and achievement. The average impact score across all stories is ${avgImpactScore.toFixed(1)}/100, with a combined engagement of ${totalEngagement} reactions and comments from the school community.`;

  const lines = wrapText(summaryText, 70);
  for (const line of lines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 11,
      font: await pdfDoc.embedFont("Helvetica"),
      color: rgb(0.3, 0.3, 0.3),
      maxWidth: width - 80,
    });
    yPosition -= 18;
  }

  yPosition -= 20;

  // Key metrics boxes
  const metrics = [
    { label: "Total Stories", value: totalStories.toString() },
    { label: "Avg Impact", value: avgImpactScore.toFixed(1) },
    { label: "Total Engagement", value: totalEngagement.toString() },
  ];

  let boxX = 40;
  for (const metric of metrics) {
    // Draw box
    page.drawRectangle({
      x: boxX,
      y: yPosition - 60,
      width: 140,
      height: 60,
      borderColor: rgb(0.2, 0.4, 0.2),
      borderWidth: 2,
    });

    // Label
    page.drawText(metric.label, {
      x: boxX + 10,
      y: yPosition - 25,
      size: 10,
      font: await pdfDoc.embedFont("Helvetica"),
      color: rgb(0.5, 0.5, 0.5),
    });

    // Value
    page.drawText(metric.value, {
      x: boxX + 10,
      y: yPosition - 45,
      size: 18,
      font: await pdfDoc.embedFont("Helvetica-Bold"),
      color: rgb(0.2, 0.4, 0.2),
    });

    boxX += 160;
  }
}

async function addStoryPage(
  pdfDoc: PDFDocument,
  story: SuccessStoryData,
  options: ReportOptions
): Promise<void> {
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let yPosition = height - 60;

  // Student name and goal
  page.drawText(story.studentName, {
    x: 40,
    y: yPosition,
    size: 20,
    font: await pdfDoc.embedFont("Helvetica-Bold"),
    color: rgb(0.2, 0.4, 0.2),
  });

  yPosition -= 30;

  page.drawText(`Goal: ${story.goalName}`, {
    x: 40,
    y: yPosition,
    size: 12,
    font: await pdfDoc.embedFont("Helvetica"),
    color: rgb(0.4, 0.4, 0.4),
  });

  yPosition -= 25;

  // Story title
  page.drawText(story.title, {
    x: 40,
    y: yPosition,
    size: 16,
    font: await pdfDoc.embedFont("Helvetica-Bold"),
    color: rgb(0.3, 0.3, 0.3),
  });

  yPosition -= 25;

  // Description
  const descLines = wrapText(story.description, 80);
  for (const line of descLines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 10,
      font: await pdfDoc.embedFont("Helvetica"),
      color: rgb(0.3, 0.3, 0.3),
      maxWidth: width - 80,
    });
    yPosition -= 15;
  }

  yPosition -= 10;

  // Testimonial
  if (options.includeTestimonials && story.testimonial) {
    page.drawText("Student Testimonial:", {
      x: 40,
      y: yPosition,
      size: 11,
      font: await pdfDoc.embedFont("Helvetica-Bold"),
      color: rgb(0.2, 0.4, 0.2),
    });

    yPosition -= 18;

    // Draw testimonial box
    page.drawRectangle({
      x: 40,
      y: yPosition - 50,
      width: width - 80,
      height: 50,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      color: rgb(0.95, 0.95, 0.95),
    });

    const testimonialLines = wrapText(`"${story.testimonial}"`, 70);
    let testimonialY = yPosition - 15;
    for (const line of testimonialLines) {
      page.drawText(line, {
        x: 50,
        y: testimonialY,
        size: 9,
        font: await pdfDoc.embedFont("Helvetica-Oblique"),
        color: rgb(0.4, 0.4, 0.4),
        maxWidth: width - 100,
      });
      testimonialY -= 12;
    }

    yPosition -= 60;
  }

  yPosition -= 10;

  // Tips
  if (options.includeTips && story.tips) {
    page.drawText("Tips for Success:", {
      x: 40,
      y: yPosition,
      size: 11,
      font: await pdfDoc.embedFont("Helvetica-Bold"),
      color: rgb(0.2, 0.4, 0.2),
    });

    yPosition -= 18;

    const tipsLines = wrapText(story.tips, 80);
    for (const line of tipsLines) {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 9,
        font: await pdfDoc.embedFont("Helvetica"),
        color: rgb(0.3, 0.3, 0.3),
        maxWidth: width - 100,
      });
      yPosition -= 12;
    }

    yPosition -= 5;
  }

  // Impact score and engagement
  if (options.includeMetrics) {
    yPosition -= 15;

    page.drawText("Impact & Engagement:", {
      x: 40,
      y: yPosition,
      size: 10,
      font: await pdfDoc.embedFont("Helvetica-Bold"),
      color: rgb(0.3, 0.3, 0.3),
    });

    yPosition -= 18;

    const metricsText = `Impact Score: ${story.impactScore || 0}/100 | Reactions: ${story.reactionCount || 0} | Comments: ${story.commentCount || 0}`;
    page.drawText(metricsText, {
      x: 40,
      y: yPosition,
      size: 9,
      font: await pdfDoc.embedFont("Helvetica"),
      color: rgb(0.5, 0.5, 0.5),
    });
  }
}

async function addMetricsSummary(
  pdfDoc: PDFDocument,
  stories: SuccessStoryData[],
  options: ReportOptions
): Promise<void> {
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let yPosition = height - 60;

  // Title
  page.drawText("Engagement Metrics Summary", {
    x: 40,
    y: yPosition,
    size: 24,
    font: await pdfDoc.embedFont("Helvetica-Bold"),
    color: rgb(0.2, 0.4, 0.2),
  });

  yPosition -= 40;

  // Create metrics table
  const tableData = stories.map((s) => [
    s.studentName,
    s.goalName,
    (s.impactScore || 0).toString(),
    (s.reactionCount || 0).toString(),
    (s.commentCount || 0).toString(),
  ]);

  // Draw table header
  const headers = ["Student", "Goal", "Impact", "Reactions", "Comments"];
  const colWidths = [120, 120, 80, 90, 90];
  let colX = 40;

  for (let i = 0; i < headers.length; i++) {
    page.drawRectangle({
      x: colX,
      y: yPosition - 25,
      width: colWidths[i],
      height: 25,
      color: rgb(0.2, 0.4, 0.2),
    });

    page.drawText(headers[i], {
      x: colX + 5,
      y: yPosition - 18,
      size: 10,
      font: await pdfDoc.embedFont("Helvetica-Bold"),
      color: rgb(1, 1, 1),
    });

    colX += colWidths[i];
  }

  yPosition -= 30;

  // Draw table rows
  for (const row of tableData) {
    colX = 40;
    for (let i = 0; i < row.length; i++) {
      page.drawRectangle({
        x: colX,
        y: yPosition - 20,
        width: colWidths[i],
        height: 20,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });

      page.drawText(row[i], {
        x: colX + 5,
        y: yPosition - 15,
        size: 9,
        font: await pdfDoc.embedFont("Helvetica"),
        color: rgb(0.3, 0.3, 0.3),
      });

      colX += colWidths[i];
    }
    yPosition -= 20;
  }
}

async function addTeacherNotesPage(
  pdfDoc: PDFDocument,
  options: ReportOptions
): Promise<void> {
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let yPosition = height - 60;

  // Title
  page.drawText("Teacher Notes", {
    x: 40,
    y: yPosition,
    size: 24,
    font: await pdfDoc.embedFont("Helvetica-Bold"),
    color: rgb(0.2, 0.4, 0.2),
  });

  yPosition -= 40;

  // Notes content
  if (options.teacherNotes) {
    const noteLines = wrapText(options.teacherNotes, 80);
    for (const line of noteLines) {
      page.drawText(line, {
        x: 40,
        y: yPosition,
        size: 11,
        font: await pdfDoc.embedFont("Helvetica"),
        color: rgb(0.3, 0.3, 0.3),
        maxWidth: width - 80,
      });
      yPosition -= 18;
    }
  }
}

/**
 * Wrap text to fit within a specified character width
 */
function wrapText(text: string, charWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > charWidth) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  }

  if (currentLine) lines.push(currentLine.trim());
  return lines;
}
