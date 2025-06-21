import WebSocket, { WebSocketServer } from "ws";
import { MCPMessage } from "../types/types";
import express from "express";
import cors from "cors"; 

const wss = new WebSocketServer({ port: 8080 });
const clients = new Map<string, WebSocket>();

console.log("Hub started on ws://localhost:8080");

wss.on("connection", (ws) => {
  let agentId: string | null = null;

  ws.on("message", (data) => {
    try {
      const msg: MCPMessage = JSON.parse(data.toString());
      // Register agent/client
      if (msg.type === "register" && msg.from) {
        agentId = msg.from;
        clients.set(agentId || "unknown", ws);
        console.log(`[HUB] Registered: ${agentId}`);
        return;
      }
      // Route message
      if (msg.to && clients.has(msg.to)) {
        clients.get(msg.to)!.send(JSON.stringify(msg));
        console.log(`[HUB] Routed message from ${msg.from} to ${msg.to}`);
      } else {
        console.log(`[HUB] No recipient found for: ${msg.to}`);
      }
    } catch (err) {
      console.error("[HUB] Error handling message:", err);
    }
  });

  ws.on("close", () => {
    if (agentId) {
      clients.delete(agentId);
      console.log(`[HUB] Disconnected: ${agentId}`);
    }
  });
});

const statusApp = express();
statusApp.use(cors()); // <-- add this line
statusApp.get("/", (req, res) => {
  res.json(Array.from(clients.keys()));
});
statusApp.listen(8081, () => console.log("Status server on http://localhost:8081/clients"));