#!/usr/bin/env node

import _ from "lodash";
import JiraClient from "jira-client";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { convertToADF } from "./utils.js";
import { handleAddComment } from "./tools/addComment.js";
import { handleCreateJiraIssue } from "./tools/createJiraIssue.js";
import { handleDeleteJiraIssue } from "./tools/deleteJiraIssue.js";
import { handleGetJiraIssues } from "./tools/getJiraIssue.js";
import { handleUpdateJiraIssue } from "./tools/updateJiraIssue.js";

// Environment variables required for Jira API authentication
const JIRA_HOST = process.env.JIRA_HOST;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

if (!JIRA_HOST || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  throw new Error(
    "Missing required environment variables: JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN are required"
  );
}

const jira = new JiraClient({
  protocol: "https",
  host: JIRA_HOST,
  username: JIRA_EMAIL,
  password: JIRA_API_TOKEN,
  apiVersion: "3",
  strictSSL: true,
});

const toolDefinitions = {
  "delete_jira_issue": {
    "description": "Delete a Jira issue by key.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "issueKey": {
          "type": "string",
          "description": "The key of the Jira issue to delete."
        }
      },
      "required": ["issueKey"]
    }
  },
  "get_jira_issue_details": {
    "description": "Retrieve all issues and subtasks for a Jira project.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectKey": {
          "type": "string",
          "description": "The key of the Jira project."
        },
        "jql": {
          "type": "string",
          "description": "Optional JQL filter for issues."
        }
      },
      "required": ["projectKey"]
    }
  },
  "udpate_jira_issue": {
    "description": "Update fields of an existing Jira issue.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "issueKey": {
          "type": "string",
          "description": "The key of the Jira issue to update."
        },
        "summary": {
          "type": "string",
          "description": "The new summary for the issue."
        },
        "description": {
          "type": "string",
          "description": "The new description for the issue."
        },
        "assignee": {
          "type": "string",
          "description": "The email address of the new assignee."
        },
        "status": {
          "type": "string",
          "description": "The new status for the issue."
        },
        "priority": {
          "type": "string",
          "description": "The new priority for the issue."
        }
      },
      "required": ["issueKey"]
    }
  },
  "create_issue": {
    "description": "Create a new Jira issue.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectKey": {
          "type": "string",
          "description": "The key of the Jira project."
        },
        "summary": {
          "type": "string",
          "description": "The summary/title of the new issue."
        },
        "issueType": {
          "type": "string",
          "description": "The type of the new issue (e.g., Task, Bug, Story)."
        },
        "description": {
          "type": "string",
          "description": "The detailed description of the new issue."
        },
        "assignee": {
          "type": "string",
          "description": "The email address of the assignee."
        },
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Labels to apply to the new issue."
        },
        "components": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Component names to associate with the new issue."
        },
        "priority": {
          "type": "string",
          "description": "The priority of the new issue."
        }
      },
      "required": ["projectKey", "summary", "issueType"]
    }
  },
  "add_comment": {
    "description": "Add a comment to a Jira issue.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "issueKey": {
          "type": "string",
          "description": "The key of the issue to comment on."
        },
        "comment": {
          "type": "string",
          "description": "The comment text to add to the issue."
        }
      },
      "required": ["issueKey", "comment"]
    }
  }
};

function setupToolHandlers(server) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.entries(toolDefinitions).map(([name, def]) => ({
      name,
      ...def,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      if (!_.isObject(request.params)) {
        throw new McpError(ErrorCode.InvalidParams, "Request params must be an object");
      }
      switch (request.params.name) {
        case "get_jira_issue_details": {
          return await handleGetJiraIssues(jira, request.params);
        }
        case "udpate_jira_issue": {
          return await handleUpdateJiraIssue(jira, request.params, JIRA_HOST);
        }
        case "create_issue": {
          return await handleCreateJiraIssue(jira, request.params, JIRA_HOST);
        }
        case "delete_jira_issue": {
          return await handleDeleteJiraIssue(jira, request.params, JIRA_HOST);
        }
        case "add_comment": {
          return await handleAddComment(jira, request.params, convertToADF);
        }
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          { type: "text", text: `Operation failed: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  });
}

async function setupServer() {
  const server = new Server(
    {
      name: "jira-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: toolDefinitions,
      },
    }
  );

  setupToolHandlers(server);

  server.onerror = (error) => console.error("[MCP Error]", error);
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Jira MCP server running on stdio");
}

setupServer().catch((error) => console.error(error));
