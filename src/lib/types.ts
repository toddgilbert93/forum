export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  agentName?: string;
  agentEmoji?: string;
  content: string;
  timestamp: number;
}

export interface AgentConfig {
  name: string;
  emoji: string;
  color: string;
  accentBg: string;
  accentBorder: string;
  description: string;
  systemPrompt: string;
}

export type SSEEvent =
  | { type: "turn_start"; agentOrder: string[] }
  | { type: "agent_start"; agent: string; emoji: string }
  | { type: "agent_chunk"; content: string }
  | { type: "agent_done"; agent: string; emoji: string; fullContent: string }
  | { type: "agent_skip"; agent: string }
  | { type: "turn_done" }
  | { type: "error"; message: string };

export interface ChatRequest {
  messages: ChatMessage[];
  userMessage: string;
}
