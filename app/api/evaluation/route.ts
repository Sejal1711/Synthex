import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    candidateName: "Aryan",
    email: "aryan@theagi.company",
    repositoryUrl: "https://github.com/aryan/hintro",
    deployedUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://hintro.vercel.app",
    externalIntegration: "Resend (Email)",
    features: [
      "Authentication (JWT)",
      "Meeting Management with Pagination",
      "AI Meeting Analysis with Citations (Vercel AI SDK Tools + Claude Sonnet)",
      "Action Item Management",
      "Overdue Detection",
      "Scheduled Reminder Job (Vercel Cron)",
      "Email Reminders via Resend",
      "Unified API Response Format",
      "Request Trace IDs",
      "Structured Logging",
      "Input Validation (Zod)",
      "Global Error Handling",
      "OpenAPI / Swagger Documentation",
    ],
  });
}
