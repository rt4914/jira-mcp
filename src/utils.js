import _ from "lodash";

// Converts plain text (with optional Markdown-like lists and headings) into Atlassian Document Format (ADF) JSON structure for Jira API compatibility.
// Supports paragraphs, bullet lists (lines starting with '- '), ordered lists (lines starting with '1. ', '2. ', etc.), and headings (lines ending with ':' followed by a blank line).
const convertToADF = (text) => {
  const lines = _.split(text, "\n");
  const content = [];
  let currentList = null;
  let currentListType = null;

  _.forEach(lines, (line, i) => {
    const nextLine = lines[i + 1] || "";

    if (_.trim(line) === "") {
      currentList = null;
      currentListType = null;
      return;
    }

    if (_.startsWith(_.trim(line), "- ")) {
      const listItem = _.trim(line).substring(2);
      if (currentListType !== "bullet") {
        currentList = {
          type: "bulletList",
          content: [],
        };
        content.push(currentList);
        currentListType = "bullet";
      }
      currentList.content.push({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: listItem,
              },
            ],
          },
        ],
      });
      return;
    }

    if (/^\d+\.\s/.test(_.trim(line))) {
      const listItem = _.trim(line).replace(/^\d+\.\s/, "");
      if (currentListType !== "ordered") {
        currentList = {
          type: "orderedList",
          content: [],
        };
        content.push(currentList);
        currentListType = "ordered";
      }
      currentList.content.push({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: listItem,
              },
            ],
          },
        ],
      });
      return;
    }

    if (_.endsWith(_.trim(line), ":") && _.trim(nextLine) === "") {
      content.push({
        type: "heading",
        attrs: { level: 3 },
        content: [
          {
            type: "text",
            text: _.trim(line),
          },
        ],
      });
      return;
    }

    currentList = null;
    currentListType = null;
    content.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: line,
        },
      ],
    });
  });

  return {
    version: 1,
    type: "doc",
    content,
  };
};

const validateJiraParams = (params, McpError, ErrorCode) => {
  if (!params.arguments || typeof params.arguments !== "object") {
    throw new McpError(ErrorCode.InvalidParams, "Arguments are required");
  }
};

export { convertToADF, validateJiraParams }; 
