import WebSocket from "ws";
import { MCPMessage } from "../../types/types";
import { logEvent } from "../../utils/utils";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const AGENT_ID = "google-calendar";
const HUB = "ws://localhost:8080";
const ws = new WebSocket(HUB);

// Load secrets from JSON file
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

const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

ws.on("open", () => {
  logEvent("INFO", `[${AGENT_ID}] Connected to hub`);
  ws.send(JSON.stringify({ from: AGENT_ID, to: "hub", type: "register", payload: {} }));
});

ws.on("message", async (data) => {
  const msg: MCPMessage = JSON.parse(data.toString());
  if (msg.to !== AGENT_ID) return;

  // Expecting payload: { summary, description, start, end, attendees }
  if (
    msg.type === "question" &&
    msg.payload &&
    msg.payload.summary &&
    msg.payload.start &&
    msg.payload.end
  ) {
    const { summary, description, start, end, attendees } = msg.payload;

    try {
      const event = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary,
          description,
          start: { dateTime: start, timeZone: "Europe/Bucharest" },
          end: { dateTime: end, timeZone: "Europe/Bucharest" },
          attendees: attendees ? attendees.map((email: string) => ({ email })) : undefined
        }
      });
      ws.send(JSON.stringify({
        from: AGENT_ID,
        to: msg.context?.originalSender || msg.from,
        type: "answer",
        payload: { answer: `Event created: ${event.data.htmlLink}` }
      }));
    } catch (err: any) {
      ws.send(JSON.stringify({
        from: AGENT_ID,
        to: msg.context?.originalSender || msg.from,
        type: "error",
        payload: { error: `Failed to create event: ${err.message}` }
      }));
    }
  } else {
    ws.send(JSON.stringify({
      from: AGENT_ID,
      to: msg.from,
      type: "error",
      payload: { error: "Missing required fields: summary, start, end." }
    }));
  }
});

ws.onerror = (err) => {
  logEvent("ERROR", "WebSocket error: " + err);
};