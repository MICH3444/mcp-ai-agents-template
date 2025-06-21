import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlow,
} from '@xyflow/react';
import CustomNode from './CustomNode';
import '@xyflow/react/dist/style.css';

const CLIENT_ID = "ui-user";
const nodeTypes = { custom: CustomNode };
const initialNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 100, y: 75 },
    data: { label: 'UI Client', type: 'client' },
    style: {}
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 300, y: 100 },
    data: { label: 'Tool Routing', type: 'routing' },
    style: {}
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 700, y: 50 },
    data: { label: 'Gmail API', type: 'tool' },
    style: {}
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 700, y: 150 },
    data: { label: 'Calendar API', type: 'tool' },
    style: {}
  },
  {
    id: '5',
    type: 'custom',
    position: { x: 500, y: 50 },
    data: { label: 'OpenAI Agent', type: 'agent' },
    style: {}
  },
  // Examples. To be implemented: 
  {
    id: '6',
    type: 'custom',
    position: { x: 500, y: 150 },
    data: { label: 'Gemini Agent', type: 'agent' },
    style: {}
  },
  {
    id: '7',
    type: 'custom',
    position: { x: 500, y: 250 },
    data: { label: 'Claude Agent', type: 'agent' },
    style: {}
  },
  {
    id: '8',
    type: 'custom',
    position: { x: 500, y: 350 },
    data: { label: 'Llama Agent', type: 'agent' },
    style: {}
  },
  {
    id: '9',
    type: 'custom',
    position: { x: 700, y: 250 },
    data: { label: 'Knowledge API', type: 'tool' },
    style: {}
  },
];

// Edges for visualization only
const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', sourceHandle: 'a', targetHandle: 'a', style: { stroke: "#fff", strokeWidth: 2 } },
  { id: 'e2-5', source: '2', target: '5', sourceHandle: 'a', targetHandle: 'a', style: { stroke: "#fff", strokeWidth: 2 } },
  { id: 'e5-3', source: '5', target: '3', sourceHandle: 'a', targetHandle: 'a', style: { stroke: "#fff", strokeWidth: 2 } },
  { id: 'e5-4', source: '5', target: '4', sourceHandle: 'a', targetHandle: 'a', style: { stroke: "#fff", strokeWidth: 2 } },
  { id: 'e5-9', source: '5', target: '9', sourceHandle: 'a', targetHandle: 'a', style: { stroke: "#fff", strokeWidth: 2 } },
  { id: 'e2-6', source: '2', target: '6', sourceHandle: 'a', targetHandle: 'a', style: { stroke: "#fff", strokeWidth: 1 } },
  { id: 'e6-3', source: '2', target: '7', sourceHandle: 'a', targetHandle: 'a', style: { stroke: "#fff", strokeWidth: 1 } },
  { id: 'e6-4', source: '2', target: '8', sourceHandle: 'a', targetHandle: 'a', style: { stroke: "#fff", strokeWidth: 1 } },
];

const AGENT_MAP = {
  '1': 'ui-user',
  '2': 'tool-routing',
  '3': 'gmail-template',
  '4': 'google-calendar',
  '5': 'openai',
  '6': 'gemini',
  '9': 'knowledge-base',
};

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [logs, setLogs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const ws = useRef<WebSocket | null>(null);

  // WebSocket connection and logging
  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080");
    ws.current.onopen = () => {
      setLogs((l) => [...l, "WebSocket connected"]);
      // Register this client with the hub
      ws.current?.send(JSON.stringify({
        from: CLIENT_ID,
        to: "hub",
        type: "register",
        payload: {}
      }));
    };
    ws.current.onmessage = (event) => setLogs((l) => [...l, "RECEIVE: " + event.data]);
    ws.current.onerror = (err) => { console.log("error", err); setLogs((l) => [...l, "Error: " + err.type]) };
    ws.current.onclose = () => setLogs((l) => [...l, "WebSocket disconnected"]);
    return () => ws.current?.close();
  }, []);

  // Poll agent status every 3 seconds
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:8081/');
        const liveAgents: string[] = await res.json();
        setNodes((nds) =>
          nds.map((node) => {
            const agentId = AGENT_MAP[node.id as keyof typeof AGENT_MAP];
            const isLive = liveAgents.includes(agentId);
            return {
              ...node,
              data: { ...node.data, live: isLive },
              style: isLive
                ? { ...node.style, opacity: 1 }
                : { ...node.style, opacity: 0.4, filter: 'grayscale(1)' },
            };
          })
        );
      } catch (e) {
        // If connection refused, set all nodes disabled
        setNodes((nds) =>
          nds.map((node) => ({
            ...node,
            data: { ...node.data, live: false },
            style: { ...node.style, opacity: 0.4, filter: 'grayscale(1)' },
          }))
        );
        console.log("ERROR. Start Nodes! ", e);
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [setNodes]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleSend = () => {
    if (!ws.current || ws.current.readyState !== 1 || !input.trim()) return;
    const msg = {
      from: CLIENT_ID,
      to: "tool-routing",
      type: "question",
      payload: { question: input }
    };
    ws.current.send(JSON.stringify(msg));
    setLogs((l) => [...l, `SEND: ${JSON.stringify(msg)}`]);
    setInput("");
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <div style={{ flex: 1, height: '100vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
        >
          <Controls style={{ background: "#222", color: "#000000" }} />
          <MiniMap
            nodeColor={() => "#1976d2"}
            maskColor="rgba(34,34,34,0.8)"
            nodeStrokeColor="#fff"
            nodeBorderRadius={6}
          />
        </ReactFlow>
      </div>
      <div
        style={{
          width: 320,
          background: "#181818",
          color: "#fff",
          padding: 16,
          borderLeft: "1px solid #333",
          fontFamily: "monospace",
          fontSize: 13,
          overflowY: "auto",
          height: "100vh",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <h3 style={{ marginTop: 0 }}>WebSocket Conversation</h3>
        <p className="helper">
          Try asking to <b>create a meeting for tomorrow</b>, <b>create an email template</b>, or just write some questions.
        </p>
        <div style={{ maxHeight: "50vh", overflowY: "auto", flex: 1 }}>
          {logs.map((log, i) => {
            // Format RECEIVE with answer
            if (log.startsWith("RECEIVE: ")) {
              try {
                const obj = JSON.parse(log.slice(9));
                if (obj?.payload?.answer) {
                  return (
                    <div
                      key={i}
                      className="receive-log"
                    >
                      <span style={{ color: "#90caf9" }}>AI:</span> {obj.payload.answer}
                    </div>
                  );
                }
              } catch {
                console.log("Error parsing log")
              }
            }
            // Format SEND logs
            if (log.startsWith("SEND: ")) {
              try {
                const obj = JSON.parse(log.slice(6));
                if (obj?.payload?.question) {
                  return (
                    <div
                      key={i}
                      className="send-log">
                      <span style={{ color: "#4caf50" }}>You:</span> {obj.payload.question}
                    </div>
                  );
                }
              } catch {
                console.log("Error parsing log")
              }
            }
            return (
              <div
                key={i}
                className="default-log">
                {log}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16, display: "flex" }}>
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            placeholder="Ask something..."
          />
          <button
            className="send-button"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}