import WebSocket from "ws";
import { MCPMessage } from "../../types/types";
import { logEvent } from "../../utils/utils";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const AGENT_ID = "gmail-template";
const HUB = "ws://localhost:8080";
const ws = new WebSocket(HUB);

const secretsPath = path.resolve(__dirname, "../../../secrets/google-secret.json");
const secrets = JSON.parse(fs.readFileSync(secretsPath, "utf-8"));

//TODO: add your secrets from Google Cloud here
const credentials = {
  client_id: process.env.CLIENT_ID, 
  client_secret:  process.env.CLIENT_SECRET, 
  redirect_uri: "http://localhost:8080",
};

const tokens = {
  access_token: secrets.access_token,
  refresh_token: secrets.refresh_token,
  scope: secrets.scope,
  token_type: secrets.token_type,
  expiry_date: secrets.expiry_date
};
const oAuth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uri
);
oAuth2Client.setCredentials(tokens);

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

ws.on("open", () => {
  logEvent("INFO", `[${AGENT_ID}] Connected to hub`);
  ws.send(JSON.stringify({ from: AGENT_ID, to: "hub", type: "register", payload: {} }));
});

ws.on("message", async (data) => {
  const msg: MCPMessage = JSON.parse(data.toString());
  if (msg.to !== AGENT_ID) return;

  // Expecting payload: { to: string, subject: string, body: string }
  if (msg.type === "question" && msg.payload && msg.payload.to && msg.payload.subject && msg.payload.body) {
    const { to, subject, body } = msg.payload;

    const raw = Buffer.from(
      `To: ${to}\r\n` +
      `Subject: ${subject}\r\n` +
      `Content-Type: text/plain; charset="UTF-8"\r\n\r\n` +
      body
    ).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    try {
      const draft = await gmail.users.drafts.create({
        userId: "me",
        requestBody: { message: { raw } }
      });
      ws.send(JSON.stringify({
        from: AGENT_ID,
        to: msg.context?.originalSender || msg.from,
        type: "answer",
        payload: { answer: `Draft created with ID: ${draft.data.id}` },
      }));
    } catch (err: any) {
      ws.send(JSON.stringify({
        from: AGENT_ID,
        to: msg.context?.originalSender || msg.from,
        type: "error",
        payload: { error: `Failed to create draft: ${err.message}` },
      }));
    }
  } else {
    ws.send(JSON.stringify({
      from: AGENT_ID,
      to: msg.from,
      type: "error",
      payload: { error: "Missing required fields: to, subject, body." }
    }));
  }
});

ws.onerror = (err) => {
  logEvent("ERROR", "WebSocket error: " + err);
};