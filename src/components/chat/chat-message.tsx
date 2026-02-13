/* eslint-disable @typescript-eslint/no-unused-vars */

import { memo, useState } from "react";
import { Message } from "@/hooks/useChat";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy, CheckCheck } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";

interface ChatMessageProps {
  message: Message;
  isLastMessage?: boolean;
  onRetry?: () => void;
  retryCount?: number;
  onPaginate?: (page: number, pageSize: number) => void;
}

// Helper function to detect and parse Markdown table data
const detectAndParseMarkdownTable = (content: string) => {
  try {
    const lines = content.split("\n");
    let tableStartIndex = -1;
    let separatorIndex = -1;
    let tableEndIndex = -1;

    // Skip detection if content looks like a weather report or structured document
    if (
      content.includes("### Weather Summary") ||
      content.includes("#### Temperature:") ||
      content.includes("#### Precipitation:") ||
      content.includes("#### Monitoring Sites:")
    ) {
      return null;
    }

    // Find table start and separator
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i].trim();
      const nextLine = lines[i + 1].trim();

      // Check if current line looks like a table header and next line is separator
      if (
        currentLine.includes("|") &&
        nextLine.includes("|") &&
        nextLine.includes("-") &&
        currentLine.split("|").length >= 3 &&
        nextLine.split("|").length >= 3 &&
        // Additional check: ensure it's not just a list with pipes
        nextLine.match(/\|[\s-]+\|/g)
      ) {
        tableStartIndex = i;
        separatorIndex = i + 1;
        break;
      }
    }

    if (tableStartIndex === -1 || separatorIndex === -1) return null;

    // Extract and clean headers
    const headerLine = lines[tableStartIndex].trim();
    const rawHeaders = headerLine.split("|").map((cell) => cell.trim());

    // Remove empty cells from start and end (common in markdown tables)
    let startIndex = 0;
    let endIndex = rawHeaders.length - 1;

    while (startIndex < rawHeaders.length && rawHeaders[startIndex] === "") {
      startIndex++;
    }
    while (endIndex >= 0 && rawHeaders[endIndex] === "") {
      endIndex--;
    }

    const headers = rawHeaders.slice(startIndex, endIndex + 1);

    if (headers.length === 0) return null;

    // Extract data rows
    const dataRows = [];
    tableEndIndex = separatorIndex + 1;

    for (let i = separatorIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Stop if line doesn't contain pipes or is empty
      if (!line.includes("|") || line === "") {
        tableEndIndex = i;
        break;
      }

      const rawCells = line.split("|").map((cell) => cell.trim());

      // Apply same start/end index logic as headers
      const cells = rawCells.slice(startIndex, endIndex + 1);

      // Only add row if it has the same number of cells as headers
      if (cells.length === headers.length) {
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header] = cells[index] || "";
        });
        dataRows.push(rowData);
        tableEndIndex = i + 1;
      } else {
        // If cell count doesn't match, this might be end of table
        tableEndIndex = i;
        break;
      }
    }

    // Only return table data if we have valid headers and at least one data row
    if (headers.length > 0 && dataRows.length > 0) {
      return {
        headers,
        data: dataRows,
        tableStartIndex,
        tableEndIndex,
      };
    }

    return null;
  } catch (error) {
    console.error("Error parsing markdown table:", error);
    return null;
  }
};

// Helper function to remove table content from text
const removeTableFromContent = (content: string, tableData: any) => {
  if (!tableData) return content;

  const lines = content.split("\n");
  const beforeTable = lines
    .slice(0, tableData.tableStartIndex)
    .join("\n")
    .trim();
  const afterTable = lines.slice(tableData.tableEndIndex).join("\n").trim();

  // Combine before and after, removing empty lines
  const cleanContent = [beforeTable, afterTable]
    .filter((part) => part.length > 0)
    .join("\n\n");

  return cleanContent;
};

// Helper function to detect if content is table data (legacy format)
const detectTableData = (content: string) => {
  try {
    if (content.includes("**") && content.includes(":")) {
      const lines = content.split("\n\n");
      if (lines.length > 0) {
        const parsedData: Record<string, any> = {};

        lines.forEach((line) => {
          const match = line.match(/\*\*(.*?)\*\*: (.*)/);
          if (match && match.length === 3) {
            parsedData[match[1]] = match[2];
          }
        });

        if (Object.keys(parsedData).length > 0) {
          return [parsedData];
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error parsing table data:", error);
    return null;
  }
};

// Memoized component for rendering markdown table data
const MarkdownTableView = memo(
  ({
    tableData,
  }: {
    tableData: { headers: string[]; data: Record<string, string>[] };
  }) => (
    <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm my-3">
      <Table className="w-full">
        <TableHeader className="bg-gray-50">
          <TableRow>
            {tableData.headers.map((header, index) => (
              <TableHead
                key={index}
                className="font-semibold text-blue1 px-4 py-3"
              >
                {header || `Column ${index + 1}`}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.data.map((row, rowIndex) => (
            <TableRow key={rowIndex} className="hover:bg-gray-50">
              {tableData.headers.map((header, cellIndex) => (
                <TableCell key={cellIndex} className="px-4 py-3">
                  {row[header] || "-"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
);
MarkdownTableView.displayName = "MarkdownTableView";

// Memoized component for rendering table data (legacy format)
const TableView = memo(({ data }: { data: any[] }) => (
  <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm">
    <Table className="mt-2">
      <TableHeader className="bg-gray-50">
        <TableRow>
          {Object.keys(data[0]).map((header, index) => (
            <TableHead key={index} className="font-semibold text-blue1">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow key={rowIndex} className="hover:bg-gray-50">
            {Object.values(row).map((cell, cellIndex) => (
              <TableCell key={cellIndex}>{String(cell)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
));
TableView.displayName = "TableView";

// Add this helper function after the existing helper functions
const detectWeatherDataStructure = (content: string) => {
  try {
    // Look for structured weather data patterns
    const weatherPatterns = [
      /#### Temperature:/,
      /#### Precipitation:/,
      /#### Humidity:/,
      /#### Wind:/,
      /#### Other Weather Phenomena:/,
      /#### Monitoring Sites:/,
    ];

    const hasWeatherStructure = weatherPatterns.some((pattern) =>
      pattern.test(content)
    );

    if (hasWeatherStructure) {
      // Extract monitoring sites and create a table
      const sitesMatch = content.match(
        /#### Monitoring Sites:\s*\n((?:- \*\*(.*?)\*\*\s*\n)*)/
      );
      if (sitesMatch) {
        const sitesText = sitesMatch[1];
        const sites = sitesText.match(/- \*\*(.*?)\*\*/g);

        if (sites && sites.length > 0) {
          const siteNames = sites.map((site) =>
            site.replace(/- \*\*(.*?)\*\*/, "$1")
          );

          // Create table data for monitoring sites
          const tableData = {
            headers: ["Monitoring Site", "Location Type", "Status"],
            data: siteNames.map((site, index) => ({
              "Monitoring Site": site,
              "Location Type": site.includes("Mountain")
                ? "Mountain"
                : site.includes("Site")
                ? "Monitoring Station"
                : "General Area",
              Status: "Active",
            })),
          };

          return {
            hasTable: true,
            tableData,
            cleanContent: content
              .replace(/#### Monitoring Sites:[\s\S]*$/, "")
              .trim(),
          };
        }
      }

      // If no monitoring sites table, check for other structured data
      const sections = content.split(/####\s+/);
      if (sections.length > 2) {
        // Create a summary table from the weather data
        const weatherData: {
          Parameter: string;
          Value: string;
          Category: string;
        }[] = [];

        sections.forEach((section) => {
          if (section.includes("Temperature:")) {
            const highTemp = section.match(
              /Average High Temperature.*?(\d+°C to \d+°C)/
            );
            const lowTemp = section.match(
              /Average Low Temperature.*?(\d+°C to \d+°C)/
            );
            if (highTemp)
              weatherData.push({
                Parameter: "High Temperature",
                Value: highTemp[1],
                Category: "Temperature",
              });
            if (lowTemp)
              weatherData.push({
                Parameter: "Low Temperature",
                Value: lowTemp[1],
                Category: "Temperature",
              });
          }

          if (section.includes("Humidity:")) {
            const humidity = section.match(/Average Humidity.*?(\d+% to \d+%)/);
            if (humidity)
              weatherData.push({
                Parameter: "Humidity",
                Value: humidity[1],
                Category: "Humidity",
              });
          }

          if (section.includes("Precipitation:")) {
            weatherData.push({
              Parameter: "Rainfall",
              Value: "Minimal",
              Category: "Precipitation",
            });
          }

          if (section.includes("Wind:")) {
            weatherData.push({
              Parameter: "Wind Speed",
              Value: "Light to Moderate",
              Category: "Wind",
            });
          }
        });

        if (weatherData.length > 0) {
          return {
            hasTable: true,
            tableData: {
              headers: ["Parameter", "Value", "Category"],
              data: weatherData,
            },
            cleanContent: content.split("#### Monitoring Sites:")[0].trim(),
          };
        }
      }
    }

    return { hasTable: false, cleanContent: content };
  } catch (error) {
    console.error("Error parsing weather data structure:", error);
    return { hasTable: false, cleanContent: content };
  }
};

// Memoized component for rendering text content
const TextContent = memo(
  ({ content, tableData = null }: { content: string; tableData?: any }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    // Remove markdown table from content for text display
    const cleanContent = tableData
      ? removeTableFromContent(content, tableData)
      : content;

    // Don't render if there's no clean content after removing table
    if (!cleanContent.trim()) {
      return null;
    }

    // Function to render structured content
    const renderStructuredContent = (text: string) => {
      const sections = text.split(/(?=###\s)/); // Split on ### headers

      return sections.map((section, sectionIdx) => {
        if (!section.trim()) return null;

        // Handle main headers (###)
        if (section.startsWith("###")) {
          const lines = section.split("\n");
          const title = lines[0].replace(/###\s*/, "");
          const content = lines.slice(1).join("\n");

          return (
            <div key={sectionIdx} className="mb-6">
              <h3 className="text-xl font-bold text-blue1 mb-4 border-b-2 border-blue1 pb-2">
                {title}
              </h3>
              {renderSubSections(content)}
            </div>
          );
        }

        return (
          <div key={sectionIdx} className="mb-4">
            {renderSubSections(section)}
          </div>
        );
      });
    };

    // Function to render subsections
    const renderSubSections = (text: string) => {
      const subSections = text.split(/(?=####\s)/); // Split on #### headers

      return subSections.map((subSection, subIdx) => {
        if (!subSection.trim()) return null;

        // Handle sub headers (####)
        if (subSection.startsWith("####")) {
          const lines = subSection.split("\n");
          const title = lines[0].replace(/####\s*/, "");
          const content = lines.slice(1).join("\n");

          return (
            <div key={subIdx} className="mb-4">
              <h4 className="text-lg font-semibold text-blue1 mb-3 flex items-center">
                <span className="w-2 h-2 bg-blue1 rounded-full mr-2"></span>
                {title}
              </h4>
              <div className="ml-4 space-y-2">{renderContent(content)}</div>
            </div>
          );
        }

        return <div key={subIdx}>{renderContent(subSection)}</div>;
      });
    };

    // Function to render regular content
    const renderContent = (text: string) => {
      return text
        .split("\n")
        .map((line, lineIdx) => {
          if (!line.trim()) return null;

          // Handle bullet points with bold labels
          if (line.match(/^-\s*\*\*(.*?)\*\*:\s*(.*)/)) {
            const match = line.match(/^-\s*\*\*(.*?)\*\*:\s*(.*)/);
            if (match) {
              return (
                <div key={lineIdx} className="flex items-start mb-2">
                  <span className="w-1.5 h-1.5 bg-blue1 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <span className="font-semibold text-gray-800">
                      {match[1]}:
                    </span>
                    <span className="ml-2 text-gray-700">{match[2]}</span>
                  </div>
                </div>
              );
            }
          }

          // Handle simple bullet points
          if (line.match(/^-\s*\*\*(.*?)\*\*$/)) {
            const match = line.match(/^-\s*\*\*(.*?)\*\*$/);
            if (match) {
              return (
                <div key={lineIdx} className="flex items-center mb-1">
                  <span className="w-1.5 h-1.5 bg-blue1 rounded-full mr-3"></span>
                  <span className="font-medium text-gray-800">{match[1]}</span>
                </div>
              );
            }
          }

          // Handle regular bullet points
          if (line.startsWith("- ")) {
            return (
              <div key={lineIdx} className="flex items-start mb-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span className="text-gray-700">{line.substring(2)}</span>
              </div>
            );
          }

          // Handle bold text patterns
          if (line.match(/\*\*(.*?)\*\*:\s*(.*)/)) {
            const match = line.match(/\*\*(.*?)\*\*:\s*(.*)/);
            if (match) {
              return (
                <p key={lineIdx} className="mb-2">
                  <span className="font-semibold text-blue1">{match[1]}:</span>
                  <span className="ml-2 text-gray-700">{match[2]}</span>
                </p>
              );
            }
          }

          // Handle regular paragraphs
          if (line.trim()) {
            return (
              <p key={lineIdx} className="mb-2 text-gray-700 leading-relaxed">
                {line
                  .replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong class="font-semibold text-gray-800">$1</strong>'
                  )
                  .split("<strong")
                  .map((part, i) => {
                    if (i === 0) return part;
                    const [strongPart, ...rest] = part.split("</strong>");
                    return (
                      <span key={i}>
                        <strong className="font-semibold text-gray-800">
                          {strongPart.replace(
                            ' class="font-semibold text-gray-800">',
                            ""
                          )}
                        </strong>
                        {rest.join("</strong>")}
                      </span>
                    );
                  })}
              </p>
            );
          }

          return null;
        })
        .filter(Boolean);
    };

    return (
      <div className="relative">
        <div className="prose prose-blue max-w-none">
          {cleanContent.includes("###") || cleanContent.includes("####")
            ? renderStructuredContent(cleanContent)
            : renderContent(cleanContent)}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="text-gray-400 hover:text-blue1 p-1 h-auto bg-white/80 rounded-full shadow"
          aria-label="Copy answer"
        >
          {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
        </Button>
      </div>
    );
  }
);
TextContent.displayName = "TextContent";

export const ChatMessage = memo(
  ({
    message,
    isLastMessage = false,
    onRetry,
    retryCount = 0,
    onPaginate,
  }: ChatMessageProps) => {
    const isUser = message.role === "user";

    // Pagination state (only for AI messages)
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);

    // Check for different content types
    const markdownTableData = isUser
      ? null
      : detectAndParseMarkdownTable(message.content);
    const legacyTableData = isUser ? null : detectTableData(message.content);
    const weatherData = isUser
      ? null
      : detectWeatherDataStructure(message.content);

    const isError =
      !isUser && message.content.includes("Sorry, I encountered an error");
    const canRetry = isError && isLastMessage && retryCount < 3 && onRetry;

    const { userInfo } = useUserStore();
    const profileImage = userInfo?.profile_picture
      ? userInfo.profile_picture.startsWith("data:image/")
        ? userInfo.profile_picture
        : `data:image/jpeg;base64,${userInfo.profile_picture}`
      : "/assets/header/profile.svg";

    // Handler for page size change
    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSize = parseInt(e.target.value, 10);
      setPageSize(newSize);
      setPage(1);
      if (onPaginate) onPaginate(1, newSize);
    };

    // Handler for next page
    const handleNextPage = () => {
      const nextPage = page + 1;
      setPage(nextPage);
      if (onPaginate) onPaginate(nextPage, pageSize);
    };

    // Handler for previous page
    const handlePreviousPage = () => {
      const prevPage = Math.max(page - 1, 1);
      setPage(prevPage);
      if (onPaginate) onPaginate(prevPage, pageSize);
    };

    return (
      <div
        className={cn(
          "flex w-full mb-5",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "flex items-start gap-3",
            isUser ? "flex-row-reverse" : "flex-row",
            isUser ? "max-w-[80%]" : "max-w-[85%]"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full shrink-0 overflow-hidden shadow-sm",
              isUser
                ? "bg-blue1 ring-2 ring-blue-100"
                : isError
                ? "bg-transparent"
                : "bg-white ring-2 ring-gray-100"
            )}
          >
            {isUser ? (
              <Image
                src={profileImage}
                alt="User"
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <Image
                src="/assets/chat/AI.svg"
                alt="AI"
                width={24}
                height={24}
                className="object-contain"
              />
            )}
          </div>

          <div className="flex flex-col w-full">
            <div
              className={cn(
                "px-5 py-4 rounded-lg shadow-sm",
                isUser
                  ? "bg-gradient-to-r from-blue1 to-blue-600 text-white rounded-tr-none"
                  : isError
                  ? "bg-red-50 text-red-800 border border-red-200 rounded-tl-none"
                  : "bg-white text-[#1a1a1a] border-[#e8ecef] rounded-tl-none"
              )}
            >
              {isUser ? (
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              ) : (
                <div className="max-w-full">
                  {/* ...existing code for rendering AI answer... */}
                  {markdownTableData ? (
                    <>
                      <TextContent
                        content={message.content}
                        tableData={
                          markdownTableData || { headers: [], data: [] }
                        }
                      />
                      <MarkdownTableView
                        tableData={
                          markdownTableData || { headers: [], data: [] }
                        }
                      />
                    </>
                  ) : weatherData?.hasTable ? (
                    <>
                      <TextContent
                        content={weatherData.cleanContent}
                        tableData={null}
                      />
                      <MarkdownTableView
                        tableData={
                          weatherData.tableData || { headers: [], data: [] }
                        }
                      />
                    </>
                  ) : legacyTableData ? (
                    <TableView data={legacyTableData} />
                  ) : (
                    <TextContent content={message.content} tableData={null} />
                  )}

                  {/* Pagination controls: only show for AI messages after answer and if 100 records (id: 1 to id: 100) are present in the plain text */}
                  {!isUser && message.content.length >= 800 && (() => {
                    // Detect at least 100 records in the plain text format (id: 1 to id: 100)
                    const recordLines = message.content.match(/\n\d+\. id: \d+ \|/g);
                    // Show pagination if at least 100 records and id: 100 is present
                    if (recordLines && recordLines.length >= 100 && message.content.includes('id: 100')) {
                      return (
                        <div className="mt-4 flex items-center gap-4">
                          <label htmlFor="pageSize" className="text-sm text-gray-700">
                            Records per page:
                          </label>
                          <select
                            id="pageSize"
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                          </select>
                          {/* Show Previous button only after Next is clicked (page > 1) */}
                          {page > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePreviousPage}
                              className="ml-2"
                            >
                              Previous
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            className="ml-2"
                          >
                            Next
                          </Button>
                          <span className="text-xs text-gray-500 ml-2">Page {page}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {canRetry && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="text-red-600 border-red-300 hover:bg-red-50 rounded-full"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry Query
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <span
              className={cn(
                "text-xs mt-1 px-2",
                isUser ? "text-right text-gray-500" : "text-gray-500"
              )}
            >
              {message.timestamp}
            </span>
          </div>
        </div>
      </div>
    );
  }
);
ChatMessage.displayName = "ChatMessage";

