# Jira MCP

## Overview
Jira MCP (Model Context Protocol) is a tool designed to streamline and automate interactions with Jira, making it easier to manage tasks, tickets, and workflows directly from your Cursor.

## Features
- Create new Jira issues
- Fetch details of issues and subtasks for a Jira project
- Update fields of existing Jira issues (summary, description, assignee, status, priority)
- Delete Jira issues
- Add comments to Jira issues [Under development]

## Supported Commands
- **create_issue**: Create a new Jira issue (requires project key, summary, issue type, and assignee)
- **get_jira_issue_details**: Retrieve all issues and subtasks for a Jira project (with optional JQL)
- **udpate_jira_issue**: Update fields of an existing Jira issue
- **delete_jira_issue**: Delete a Jira issue by key
- **add_comment**: Add a comment to a Jira issue

## Available Tools
- Issue fetcher and updater
- Workflow automation scripts
- Integration utilities for CI/CD

## Setup Instructions
1. **Clone the repository:**
   ```sh
   git clone https://github.com/goSprinto/jira-mcp.git
   cd jira-mcp
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Create the environment file:**
   Create a new `.env` file in the root directory.

## Environment Variables
Add the following values to your `.env` file:

```
JIRA_BASE_URL=your-jira-instance-url
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
```

- `JIRA_BASE_URL`: The base URL of your Jira instance (e.g., `https://yourcompany.atlassian.net`).
- `JIRA_EMAIL`: The email address associated with your Jira account.
- `JIRA_API_TOKEN`: Your Jira API token (see below for how to fetch).

## How to Fetch Jira Token
1. Log in to your Jira account in your browser.
2. Go to [Atlassian API tokens page](https://id.atlassian.com/manage-profile/security/api-tokens).
3. Click **Create API token**.
4. Give your token a label and click **Create**.
5. Copy the generated token and add it to your `.env` file as `JIRA_API_TOKEN`.

## Connecting with Cursor

1. Open `Cursor Settings`
2. Click on `MCP` -> `Add new global MCP Server`
3. Paste this below code
```
    "jira": {
      "command": "node",
      "args": [
        "<full-path-to-folder>/jira-mcp/src/index.js"
      ],
      "cwd": "<full-path-to-folder>/jira-mcp",
      "env": {
        "JIRA_HOST": "example.atlassian.net",
        "JIRA_EMAIL": "rajat@example.com",
        "JIRA_API_TOKEN": "<API_TOKEN>"
      }
    },
```
4. You can also refine your LLM interactions by adding Rules like this:

```
Keep these details in mind when thinking of Jira tasks:
- Assume the primary Jira project key is 'SS1T'.
- Assume 'my assigned tasks' or tasks assigned to 'me' refer to the Jira user with the email 'rajat@example.com' 
You can then use these in your JQL queries,for example: project = SS1T AND assignee = 'rajat@example.com'.
```
 