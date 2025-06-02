import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import _ from "lodash";
import { validateJiraParams } from "../utils.js";

const validateDeleteIssueArgs = (args) => {
  if (!_.isObject(args) || _.isNull(args)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Arguments must be an object"
    );
  }
  const { issueKey } = args;
  if (!_.isString(issueKey) || _.isEmpty(issueKey)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Issue key is required and must be a string"
    );
  }
  return true;
};

const deleteJiraIssue = async (jira, args, JIRA_HOST) => {
  validateDeleteIssueArgs(args);
  const { issueKey } = args;
  await jira.deleteIssue(issueKey);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            message: "Issue deleted successfully",
            issueKey,
          },
          null,
          2
        ),
      },
    ],
  };
};

export const handleDeleteJiraIssue = async (jira, params, JIRA_HOST) => {
  validateJiraParams(params, McpError, ErrorCode);
  return await deleteJiraIssue(jira, params.arguments, JIRA_HOST);
};
