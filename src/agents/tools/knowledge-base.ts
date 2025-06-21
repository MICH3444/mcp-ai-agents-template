import WebSocket from "ws";
import { MCPMessage } from "../../types/types";
import { logEvent } from "../../utils/utils";

const AGENT_ID = "knowledge-base";
const HUB = "ws://localhost:8080";
const ws = new WebSocket(HUB);

// Example company data (tooling, not MCP logic)
const COMPANY_DATA = `
ACME Corp is a leading provider of innovative widgets and solutions.
- Founded: 1999
- Employees: 2,500
- Headquarters: Metropolis City
- Products: WidgetPro, WidgetLite, WidgetCloud
- Support: support@acmecorp.com
- Vacation Policy: 25 days/year, flexible remote work
- Mission: "Empowering the world with better widgets."
- CEO: Jane Doe
- Office Hours: 9am-5pm, Mon-Fri
- Values: Innovation, Customer Focus, Integrity, Teamwork
- FAQ:
  - Q: How do I contact support? A: Email support@acmecorp.com or call 1-800-ACME.
  - Q: What is WidgetCloud? A: WidgetCloud is our SaaS platform for widget management.
  - Q: Where are you located? A: 123 Main St, Metropolis City.
`;

ws.on("open", () => {
    logEvent("INFO", `[${AGENT_ID}] Connected to hub`);
    ws.send(JSON.stringify({ from: AGENT_ID, to: "hub", type: "register", payload: {} }));
});

ws.on("message", async (data) => {
    const msg: MCPMessage = JSON.parse(data.toString());
    if (msg.to !== AGENT_ID) return;

    if (msg.type === "question" && msg.payload.question) {
        // Forward to OpenAI agent with context
        ws.send(JSON.stringify({
            from: AGENT_ID,
            to: "openai", // or your OpenAI agent's ID
            type: "question",
            payload: {
                question: msg.payload.question,
                context: COMPANY_DATA
            },
            context: {
                originalSender: msg.context?.originalSender || msg.from
            }
        }));
    }

    // Handle answer from OpenAI and forward to original sender
    if (msg.type === "answer" && msg.payload.answer && msg.from === "openai") {
        ws.send(JSON.stringify({
            from: AGENT_ID,
            to: msg.context?.originalSender || msg.from,
            type: "answer",
            payload: { answer: msg.payload.answer }
        }));
    }
});

ws.onerror = (err) => {
    logEvent("ERROR", "WebSocket error: " + err);
};