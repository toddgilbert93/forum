import Anthropic from "@anthropic-ai/sdk";
import { ChatMessage, AgentConfig } from "./types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

function buildAnthropicMessages(
  agent: AgentConfig,
  history: ChatMessage[],
  currentTurnResponses: { agentName: string; content: string }[]
): Anthropic.MessageParam[] {
  // Build a flat list where:
  // - Human messages → role: "user"
  // - THIS agent's own past messages → role: "assistant" (its own output)
  // - OTHER agents' messages → role: "user" with [AgentName] prefix (input to this agent)
  const raw: { role: "user" | "assistant"; content: string }[] = [];

  for (const msg of history) {
    if (msg.role === "user") {
      raw.push({ role: "user", content: msg.content });
    } else if (msg.agentName === agent.name) {
      raw.push({ role: "assistant", content: msg.content });
    } else {
      raw.push({
        role: "user",
        content: `[${msg.agentName}]: ${msg.content}`,
      });
    }
  }

  // Current turn responses from other agents are also "user" input
  for (const resp of currentTurnResponses) {
    if (resp.agentName === agent.name) {
      raw.push({ role: "assistant", content: resp.content });
    } else {
      raw.push({
        role: "user",
        content: `[${resp.agentName}]: ${resp.content}`,
      });
    }
  }

  // Merge consecutive same-role messages (Anthropic API requires alternation)
  const merged: Anthropic.MessageParam[] = [];
  for (const msg of raw) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1] = {
        role: msg.role,
        content: (merged[merged.length - 1].content as string) + "\n\n" + msg.content,
      };
    } else {
      merged.push({ role: msg.role, content: msg.content });
    }
  }

  // Ensure the last message is role: "user" (required to prompt a response)
  if (merged.length > 0 && merged[merged.length - 1].role === "assistant") {
    merged.push({ role: "user", content: "[The conversation continues. Please respond.]" });
  }

  return merged;
}

export async function streamAgentResponse(
  agent: AgentConfig,
  history: ChatMessage[],
  currentTurnResponses: { agentName: string; content: string }[],
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  canPass: boolean
): Promise<string> {
  const systemPrompt = canPass
    ? agent.systemPrompt
    : agent.systemPrompt + "\n- You MUST respond this turn. Do not say \"pass\".";

  const messages = buildAnthropicMessages(agent, history, currentTurnResponses);

  const startEvent = JSON.stringify({
    type: "agent_start",
    agent: agent.name,
    emoji: agent.emoji,
  });
  await writer.write(encoder.encode(`data: ${startEvent}\n\n`));

  let fullContent = "";

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 150,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullContent += event.delta.text;
      const chunkEvent = JSON.stringify({
        type: "agent_chunk",
        content: event.delta.text,
      });
      await writer.write(encoder.encode(`data: ${chunkEvent}\n\n`));
    }
  }

  const trimmed = fullContent.trim().toLowerCase();
  if (trimmed === "pass" && canPass) {
    const skipEvent = JSON.stringify({
      type: "agent_skip",
      agent: agent.name,
    });
    await writer.write(encoder.encode(`data: ${skipEvent}\n\n`));
    return "";
  }

  const doneEvent = JSON.stringify({
    type: "agent_done",
    agent: agent.name,
    emoji: agent.emoji,
    fullContent,
  });
  await writer.write(encoder.encode(`data: ${doneEvent}\n\n`));

  return fullContent;
}
