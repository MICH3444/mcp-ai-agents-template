import WebSocket from "ws";
import { MCPMessage } from "../../types/types";
import { extractJsonFromMarkdown, logEvent } from "../../utils/utils";

// Define available tools
const tools = [
    {
        id: "gmail-template",
        description: "Creates a Gmail draft email. Needs: to, subject, body.",
        properties: {
            to: "string",
            subject: "string",
            body: "string"
        }
    },
    {
        id: "api-caller",
        description: "Calls an external API. Needs: url, method, payload.",
        properties: {
            url: "string",
            method: "string",
            payload: "object"
        }
    },
    {
        id: "google-calendar",
        description: "Creates a Google Calendar event. Needs: summary, start, end, (optional: description, attendees).",
        properties: {
            summary: "string",
            description: "string",
            start: "string (ISO 8601)",
            end: "string (ISO 8601)",
            attendees: "string[]"
        }
    },
    {
        id: "knowledge-base",
        description: "Answers questions about ACME Company policies, products, and company information. Needs: question.",
        properties: {
            question: "string"
        }
    },

    //TODO: add more tools: 
    //TODO: Tool with FileRead externally
    //TODO: Document Generator Tool pdfkit (for programmatic PDFs) ; docx (for Word documents) ; handlebars (for templating text before generating PDF/DOCX)
    //TODO: Slack / Teams messaging
    //TODO: Api Caller
    //TODO: DB Query Tool
];

const AGENT_ID = "tool-routing";
const HUB = "ws://localhost:8080";
const ws = new WebSocket(HUB);

ws.on("open", () => {
    logEvent("INFO", `[${AGENT_ID}] Connected to hub`);
    ws.send(JSON.stringify({ from: AGENT_ID, to: "hub", type: "register", payload: {} }));
});

ws.on("message", async (data) => {
    const msg: MCPMessage = JSON.parse(data.toString());
    if (msg.to !== AGENT_ID) return;

    // Step 1: Receive user request and send to OpenAI
    if (msg.type === "question" && msg.payload.question) {
        const toolDescriptions = tools.map(
            t => `${t.id}: ${t.description} Properties: ${JSON.stringify(t.properties)}`
        ).join("\n");

        const today = new Date().toISOString().split('T')[0]; // e.g. "2025-06-19"

        const prompt = `
        Today is ${today}.
        You are a tool routing agent. Here are the available tools:
        ${toolDescriptions}

        Given the user request: "${msg.payload.question}", respond with:
        - A JSON object with the tool to use and its parameters, e.g. { "tool": "gmail-template", "parameters": { "to": "someone@gmail.com", "subject": "Job Interview", "body": "Dear HR, ..." } }
        - OR, if no tool is needed, a JSON object with an "answer" field, e.g. { "answer": "42" }

        Do NOT include any explanation, markdown, or text outside the JSON.
        If you don't have enough information to fill all parameters, make reasonable assumptions.
        `;

        ws.send(JSON.stringify({
            from: AGENT_ID,
            to: "openai",
            type: "question",
            payload: { question: prompt },
            context: { originalSender: msg.from }
        }));
        return;
    }

    // Step 2: Receive OpenAI's tool call and route to the correct tool agent
    if (msg.type === "answer" && msg.payload.answer && msg.context?.originalSender) {
        try {
            const jsonString = extractJsonFromMarkdown(msg.payload.answer);
            const toolCall = JSON.parse(jsonString);

            if (toolCall.tool && toolCall.parameters) {
                // Route to tool agent
                ws.send(JSON.stringify({
                    from: AGENT_ID,
                    to: toolCall.tool,
                    type: "question",
                    payload: toolCall.parameters,
                    context: { originalSender: msg.context.originalSender }
                }));
            } else if (toolCall.answer) {
                // Direct answer, send back to original sender
                ws.send(JSON.stringify({
                    from: AGENT_ID,
                    to: msg.context.originalSender,
                    type: "answer",
                    payload: { answer: toolCall.answer }
                }));
            } else {
                throw new Error("Invalid response format from OpenAI.");
            }
        } catch (err) {
            logEvent("ERROR", "Tool-Routing error: " + err);
            ws.send(JSON.stringify({
                from: AGENT_ID,
                to: msg.context.originalSender,
                type: "error",
                payload: { error: "Failed to parse tool call or answer from OpenAI." }
            }));
        }
    }
});

ws.onerror = (err) => {
    logEvent("ERROR", "WebSocket error: " + err);
};