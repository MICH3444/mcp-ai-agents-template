export interface MCPMessage<T = any> {
  from: string;
  to: string;
  type: "question" | "answer" | "error" | "register" | "event";
  payload: T;
  context?: Record<string, any>;
  timestamp?: string;
  protocolVersion?: string;
}