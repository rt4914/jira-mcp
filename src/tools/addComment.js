import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import _ from "lodash";
import { validateJiraParams } from "../utils.js";

export const handleAddComment = async (jira, params, convertToADF) => {
  validateJiraParams(params, McpError, ErrorCode);
  const args = params.arguments;
  const { issueKey, comment } = args;
  if (!_.isString(issueKey) || _.isEmpty(_.trim(issueKey)) || !_.isString(comment) || _.isEmpty(_.trim(comment))) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Both issueKey and comment are required and must be non-empty strings"
    );
  }
  const response = await jira.addComment(issueKey, {
    body: convertToADF(comment),
  });
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            message: "Comment added successfully",
            commentId: response.id,
            issueKey,
          },
          null,
          2
        ),
      },
    ],
  };
}; 