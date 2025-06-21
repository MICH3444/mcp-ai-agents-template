import WebSocket from "ws";
import OpenAI from "openai";
import dotenv from "dotenv";
import { extractJsonFromMarkdown, logEvent } from "../utils/utils";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import { MCPMessage } from "../types/types";

dotenv.config();

const AGENT_ID = "openai";
const HUB = "ws://localhost:8080";
const ws = new WebSocket(HUB);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

ws.on("open", () => {
  logEvent("INFO", `[${AGENT_ID}] Connected to hub`);
  ws.send(JSON.stringify({ from: AGENT_ID, to: "hub", type: "register", payload: {} }));
});

ws.on("message", async (data) => {
  const msg: MCPMessage = JSON.parse(data.toString());
  if (msg.to !== AGENT_ID) return;

  // Step 1: Receive question and send to OpenAI
  if (msg.type === "question" && msg.payload.question) {
    try {
      const messages: ChatCompletionMessageParam[] = [];

      if (msg.payload.context) {
        messages.push({
          role: "system",
          content: `You are an expert assistant. Use the following company knowledge base to answer questions:\n${msg.payload.context}`
        });
      }

      messages.push({
        role: "user",
        content: msg.payload.question
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages
      });

      const answer = response.choices[0].message?.content || "No answer.";
      console.log("[AI RESPONSE] ", answer);
      ws.send(JSON.stringify({
        from: AGENT_ID,
        to: msg.from,
        type: "answer",
        payload: { answer },
        context: msg.context
      }));
    } catch (error: any) {
      ws.send(JSON.stringify({
        from: AGENT_ID,
        to: msg.from,
        type: "error",
        payload: { error: error.message ?? String(error) },
        context: msg.context 
      }));
    }
  }

  // Step 2: Receive OpenAI's tool call or direct answer
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
  logEvent("ERROR", "WebSocket error:" + err);
};