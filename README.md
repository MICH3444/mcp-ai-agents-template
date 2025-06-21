# Multi-Agent AI Playground

**MCP (Model Context Protocol) · Multi-Agent Orchestration · AI Automation Platform**

Welcome to the Multi-Agent AI Playground, a modern platform for **multi-agent orchestration**, **AI workflow automation**, and **context-aware LLM integration**. Built on the Model Context Protocol (MCP), this project enables seamless communication between AI agents, tools, and orchestrators, making it easy to automate complex tasks and connect multiple AI models and APIs in a single, extensible system.  
With a modular architecture and a real-time React UI, MCP is ideal for experimenting with agent-based AI, building custom automations, and visualizing agent-tool interactions.

---

## 🧭 Flow Overview

1. **Hub**: Central WebSocket server. All agents, tools, and clients connect here. It routes messages between components.
2. **Routing Agent**: Receives user questions, decides which agent/tool should handle them, and forwards requests.
3. **Agents**: AI models (e.g., OpenAI, Gemini) that answer questions or decide which tool to use.
4. **Tools**: External integrations (e.g., Gmail, Google Calendar, Knowledge Base) that perform actions or provide data.
5. **Client**: React UI for users to interact, visualize, and chat with the system.

---

## 🚀 Quick Start

### 1. **Clone and Install**

```bash
git clone https://github.com/your-username/multi-agent-ai-playground.git
cd multi-agent-ai-playground
npm install
```

### 2. **Set Up Environment Variables**

Create a `.env` file in the root with your OpenAI key:

```
OPENAI_API_KEY=sk-...
```

### 3. **Google Tools Setup (Optional but Recommended)**

- Ensure you have a Google Cloud project with Gmail and Calendar APIs enabled.
  - You can manage your Google Cloud APIs here: [Google Cloud Platform Console](https://console.cloud.google.com/apis/dashboard)
- Add your email as a test user in the OAuth consent screen.
- Run the following to authenticate:

  ```bash
  npm run google-auth
  ```

  - Open the provided URL, log in to your Google account, and paste the code back into the terminal.
  - Copy the resulting JSON and save it as `/secrets/google-secret.json`.

### 4. **Start the System**

**In separate terminals, run:**

```bash
npm run start-hub         # Start the central hub (must be first)
npm run start-routing     # Start the routing agent (must be second)
npm run start-agent-openai  # Start at least one agent (OpenAI recommended)
# Optionally, start more agents/tools:
npm run start-agent-gemini
npm run start-tool-gmail
npm run start-tool-gcalendar
npm run start-tool-knowledge-base
```

### 5. **Start the Client**

You can run the client from the root:

```bash
npm run client
```

Or from the client folder:

```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗂️ Folder Structure

```
/client/                  # React UI app (Vite + React + TypeScript)
/secrets/google-secret.json # Google OAuth tokens (after auth step)
/src/
  /agents/
    agent-openai.ts       # OpenAI LLM agent
    agent-gemini.ts       # Gemini LLM agent
    routing/
      tool-routing-agent.ts # Routing/orchestrator agent
    tools/
      google-calendar.ts  # Google Calendar tool
      google-email-template.ts # Gmail tool
      knowledge-base.ts   # Knowledge base/FAQ tool
  /hub/
    hub.ts                # Central WebSocket hub
  /types/
    types.ts              # Shared message types
  /utils/
    utils.ts              # Utility functions
.env                      # API keys
package.json              # Scripts and dependencies
```

---

## 🧩 System Components

- **Hub**: WebSocket server at `ws://localhost:8080`. All communication goes through here.
- **Routing Agent**: Decides which agent/tool should handle a user request.
- **Agents**: LLMs (OpenAI, Gemini, etc.) that answer questions or orchestrate tool usage.
- **Tools**: Integrations for external APIs (Gmail, Calendar, Knowledge Base, etc.).
- **Client**: React UI for chat and visualization.

---

## 💡 How It Works

- When you start the system, each node (agent/tool/routing) connects to the hub and appears as a colored node in the UI.
- The client lets you send questions or commands. The routing agent decides if the request should go to an LLM or a tool.
- If a tool is needed (e.g., "create a meeting for tomorrow"), the orchestrator routes the request to the correct tool agent.
- Google tools require authentication and a valid `/secrets/google-secret.json` file.

---

## 🛠️ Customization

- Add more agents by copying and modifying an agent file.
- Add new tools by creating a new tool file in `/src/agents/tools/`.
- Extend the routing/orchestration logic in `tool-routing-agent.ts`.
- The message protocol is easily extensible for new features.

---

## 🕸️ Orchestrator & Future Vision

The **routing agent** acts as an orchestrator, enabling you to connect multiple tools and automate complex workflows from a single command.  
The vision is to allow users to chain tools, agents, and actions—so you can, for example, "Summarize my last 10 emails and schedule a meeting with the most important contact," all from one prompt.

---

## 🖥️ Example Output

```
[user1 -> rule]: The current time is 21:43:09
[user1 -> openai]: Once upon a time, on the moon...
[user1 -> gemini]: Argentina won the last football World Cup...
```

---

## 📝 Notes

- All agents and the client connect to the hub at `ws://localhost:8080`.
- You can run each agent and the client in a new terminal or use a process manager.
- The UI will show colored nodes for each live agent/tool/routing node.
- You can interact with the system using the chat input in the client UI.

---

Enjoy experimenting and building your own AI-powered automations!