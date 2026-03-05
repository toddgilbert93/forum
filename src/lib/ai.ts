import { streamText, ModelMessage } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { ChatMessage, AgentConfig } from "./types";

// --- Provider instances ---

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const xai = createXai({
  apiKey: process.env.XAI_API_KEY!,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function getModel(agent: AgentConfig) {
  switch (agent.provider) {
    case "anthropic":
      return anthropic(agent.model);
    case "xai":
      return xai(agent.model);
    case "google":
      return google(agent.model);
    case "openai":
      return openai.chat(agent.model);
  }
}

// --- Message building ---

function buildMessages(
  agent: AgentConfig,
  history: ChatMessage[],
  currentTurnResponses: { agentName: string; content: string }[]
): ModelMessage[] {
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

  // Merge consecutive same-role messages (some providers require alternation)
  const merged: ModelMessage[] = [];
  for (const msg of raw) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1] = {
        role: msg.role,
        content:
          (merged[merged.length - 1].content as string) + "\n\n" + msg.content,
      };
    } else {
      merged.push({ role: msg.role, content: msg.content });
    }
  }

  // Ensure the last message is role: "user" to prompt a response
  if (merged.length > 0 && merged[merged.length - 1].role === "assistant") {
    merged.push({
      role: "user",
      content: "[The conversation continues. Please respond.]",
    });
  }

  return merged;
}

// --- Streaming ---

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
    : agent.systemPrompt + '\n- You MUST respond this turn. Do not say "pass".';

  const messages = buildMessages(agent, history, currentTurnResponses);

  const startEvent = JSON.stringify({
    type: "agent_start",
    agent: agent.name,
    emoji: agent.emoji,
  });
  await writer.write(encoder.encode(`data: ${startEvent}\n\n`));

  let fullContent = "";

  // Gemini 2.5 Flash uses thinking tokens that count against maxOutputTokens
  const tokenLimit = agent.provider === "google" ? 2048 : 150;

  const { textStream } = streamText({
    model: getModel(agent),
    system: systemPrompt,
    messages,
    maxOutputTokens: tokenLimit,
  });

  for await (const chunk of textStream) {
    fullContent += chunk;
    const chunkEvent = JSON.stringify({
      type: "agent_chunk",
      content: chunk,
    });
    await writer.write(encoder.encode(`data: ${chunkEvent}\n\n`));
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
