import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { convertToADF, validateJiraParams } from "../utils.js";
import _ from "lodash";

const validateUpdateIssueArgs = (args) => {
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

export const handleUpdateJiraIssue = async (jira, params, JIRA_HOST) => {
  validateJiraParams(params, McpError, ErrorCode);
  validateUpdateIssueArgs(params.arguments);
  const args = params.arguments;
  const updateFields = {};
  if (args.summary) {
    updateFields.summary = args.summary;
  }
  if (args.description) {
    updateFields.description = convertToADF(args.description);
  }
  if (args.assignee) {
    const users = await jira.searchUsers({
      query: args.assignee,
      includeActive: true,
      maxResults: 1,
    });
    if (users && users.length > 0) {
      updateFields.assignee = { accountId: users[0].accountId };
    }
  }
  if (args.status) {
    const transitions = await jira.listTransitions(args.issueKey);
    const transition = _.find(transitions.transitions, (t) => t.name.toLowerCase() === args.status?.toLowerCase());
    if (transition) {
      await jira.transitionIssue(args.issueKey, {
        transition: { id: transition.id },
      });
    }
  }
  if (args.priority) {
    updateFields.priority = { name: args.priority };
  }
  if (!_.isEmpty(updateFields)) {
    await jira.updateIssue(args.issueKey, {
      fields: updateFields,
    });
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            message: "Issue updated successfully",
            issue: {
              key: args.issueKey,
              url: `https://${JIRA_HOST}/browse/${args.issueKey}`,
            },
          },
          null,
          2
        ),
      },
    ],
  };
}; 