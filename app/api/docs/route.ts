import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "Synthex Meeting Intelligence API",
    version: "1.0.0",
    description:
      "AI-powered meeting intelligence service with transcript grounding, action item tracking, and email reminders.",
  },
  servers: [
    { url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "token" },
      bearerAuth: { type: "http", scheme: "bearer" },
    },
    schemas: {
      Success: {
        type: "object",
        properties: {
          traceId: { type: "string" },
          success: { type: "boolean", example: true },
          data: { type: "object" },
        },
      },
      Error: {
        type: "object",
        properties: {
          traceId: { type: "string" },
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
      TranscriptEntry: {
        type: "object",
        required: ["timestamp", "speaker", "text"],
        properties: {
          timestamp: { type: "string", example: "00:10" },
          speaker: { type: "string", example: "Alice" },
          text: { type: "string", example: "We should launch next Friday." },
        },
      },
      Citation: {
        type: "object",
        properties: { timestamp: { type: "string", example: "00:10" } },
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        security: [],
        responses: { "200": { description: "Service is UP" } },
      },
    },
    "/api/evaluation": {
      get: {
        tags: ["System"],
        summary: "Evaluation metadata",
        security: [],
        responses: { "200": { description: "Candidate and feature info" } },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User registered, JWT set in cookie" },
          "400": { description: "Validation error" },
          "409": { description: "Email already exists" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful, JWT set in cookie" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        responses: { "200": { description: "Cookie cleared" } },
      },
    },
    "/api/meetings": {
      get: {
        tags: ["Meetings"],
        summary: "List meetings (paginated)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Paginated meetings list" } },
      },
      post: {
        tags: ["Meetings"],
        summary: "Create a meeting",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "participants", "meetingDate", "transcript"],
                properties: {
                  title: { type: "string", example: "Sprint Planning" },
                  participants: {
                    type: "array",
                    items: { type: "string", format: "email" },
                  },
                  meetingDate: {
                    type: "string",
                    format: "date-time",
                    example: "2026-05-20T10:00:00Z",
                  },
                  transcript: {
                    type: "array",
                    items: { $ref: "#/components/schemas/TranscriptEntry" },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Meeting created" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/meetings/{id}": {
      get: {
        tags: ["Meetings"],
        summary: "Get a meeting with analysis",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Meeting + analysis" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/meetings/{id}/analyze": {
      post: {
        tags: ["Meetings"],
        summary: "Analyze a meeting with AI (tool-calling, grounded citations)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description:
              "AI analysis: summary, action items, decisions, follow-ups — all with transcript citations",
          },
          "404": { description: "Meeting not found" },
        },
      },
    },
    "/api/action-items": {
      get: {
        tags: ["Action Items"],
        summary: "List action items",
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED"] } },
          { name: "assignee", in: "query", schema: { type: "string" } },
          { name: "meetingId", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Action items list" } },
      },
      post: {
        tags: ["Action Items"],
        summary: "Create an action item",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["task", "assignee"],
                properties: {
                  task: { type: "string" },
                  assignee: { type: "string" },
                  meetingId: { type: "string" },
                  dueDate: { type: "string", format: "date-time" },
                  citations: { type: "array", items: { $ref: "#/components/schemas/Citation" } },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Action item created" } },
      },
    },
    "/api/action-items/overdue": {
      get: {
        tags: ["Action Items"],
        summary: "Get overdue action items (status != COMPLETED, dueDate < now)",
        responses: { "200": { description: "Overdue items with count" } },
      },
    },
    "/api/action-items/{id}/status": {
      patch: {
        tags: ["Action Items"],
        summary: "Update action item status",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Status updated" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/cron/reminders": {
      get: {
        tags: ["Cron"],
        summary: "Send email reminders for overdue action items (requires CRON_SECRET)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Reminder job results" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}
