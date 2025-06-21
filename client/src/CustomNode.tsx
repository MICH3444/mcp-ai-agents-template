import React from "react";
import { Handle, Position } from "@xyflow/react";

const NODE_STYLES: Record<string, React.CSSProperties> = {
  client: {
    background: "#1976d2",
    color: "#fff",
    border: "2px solid #1976d2",
    boxShadow: "0 0 8px #1976d2aa",
  },
  routing: {
    background: "#d32f2f",
    color: "#fff",
    border: "2px solid #d32f2f",
    boxShadow: "0 0 8px #d32f2faa",
  },
  agent: {
    background: "#388e3c",
    color: "#fff",
    border: "2px solid #388e3c",
    boxShadow: "0 0 8px #388e3caa",
  },
  tool: {
    background: "rgb(151, 118, 21)",
    color: "#eee",
    border: "2px solid rgb(194, 154, 33)",
    boxShadow: "0 0 8px #388e3caa",
  },
};

const NODE_SUBTITLES: Record<string, string> = {
  client: "Client",
  routing: "Routing",
  agent: "Agent",
  tool: "Tool",
};

export default function CustomNode({ data }: any) {
  const type = data.type || "tool";
  const style: React.CSSProperties = {
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    fontWeight: 600,
    opacity: data.live ? 1 : 0.4,
    filter: data.live ? "none" : "grayscale(1)",
    transition: "all 0.2s",
    ...NODE_STYLES[type],
  };

  return (
    <div style={style}>
      <div>{data.label}</div>
      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
        {NODE_SUBTITLES[type]}
      </div>
      <Handle type="source" position={Position.Right} id="a" />
      <Handle type="target" position={Position.Left} id="a" />
    </div>
  );
}