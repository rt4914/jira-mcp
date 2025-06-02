import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { convertToADF, validateJiraParams } from "../utils.js";
import _ from "lodash";

const validateCreateIssueArgs = (args) => {
  if (!_.isObject(args) || _.isNull(args)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Arguments must be an object"
    );
  }
  const { projectKey, summary, issueType } = args;
  if (!_.isString(projectKey) || _.isEmpty(projectKey)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Project key is required and must be a string"
    );
  }
  if (!_.isString(summary) || _.isEmpty(summary)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Summary is required and must be a string"
    );
  }
  if (!_.isString(issueType) || _.isEmpty(issueType)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Issue type is required and must be a string"
    );
  }
  return true;
};

export const handleCreateJiraIssue = async (jira, params, JIRA_HOST) => {
  validateJiraParams(params, McpError, ErrorCode);
  validateCreateIssueArgs(params.arguments);
  const args = params.arguments;
  if (!args.projectKey) {
    throw new McpError(ErrorCode.InvalidParams, "Project key is required");
  }
  if (!args.assignee) {
    throw new McpError(ErrorCode.InvalidParams, "Assignee is required");
  }
  const response = await jira.addNewIssue({
    fields: {
      project: { key: args.projectKey },
      summary: args.summary,
      issuetype: { name: args.issueType },
      description: args.description
        ? convertToADF(args.description)
        : undefined,
      assignee: { accountId: args.assignee },
      labels: args.labels,
      components: _.map(args.components, (name) => ({ name })),
      priority: args.priority ? { name: args.priority } : undefined,
      parent: args.parent ? { key: args.parent } : undefined,
    },
  });
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            message: "Issue created successfully",
            issue: {
              id: response.id,
              key: response.key,
              url: `https://${JIRA_HOST}/browse/${response.key}`,
            },
          },
          null,
          2
        ),
      },
    ],
  };
}; 