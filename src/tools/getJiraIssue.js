import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import _ from "lodash";
import { validateJiraParams } from "../utils.js";

const validateGetIssuesArgs = (args) => {
  if (!_.isObject(args) || _.isNull(args)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Arguments must be an object"
    );
  }
  const { projectKey } = args;
  if (!_.isString(projectKey) || _.isEmpty(projectKey)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Project key is required and must be a string"
    );
  }
  return true;
};

export const handleGetJiraIssues = async (jira, params) => {
  validateJiraParams(params, McpError, ErrorCode);
  validateGetIssuesArgs(params.arguments);
  const args = params.arguments;
  const jql = args.jql
    ? `project = ${args.projectKey} AND ${args.jql}`
    : `project = ${args.projectKey}`;
  const response = await jira.searchJira(jql, {
    maxResults: 100,
    fields: [
      "summary",
      "description",
      "status",
      "priority",
      "assignee",
      "issuetype",
      "parent",
      "subtasks",
    ],
  });
  // Fetch comments for each issue in parallel
  const issuesWithComments = await Promise.all(
    _.map(response.issues, async (issue) => {
      try {
        const commentsResponse = await jira.getComments(issue.key);
        return { ...issue, comments: commentsResponse.comments };
      } catch (e) {
        // If fetching comments fails, still return the issue
        return { ...issue, comments: [], commentsError: e?.message || String(e) };
      }
    })
  );
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(issuesWithComments, null, 2),
      },
    ],
  };
}; 