import { NextRequest } from "next/server";
import { agents } from "@/lib/agents";
import { streamAgentResponse } from "@/lib/anthropic";
import { ChatMessage, ChatRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: NextRequest) {
  const { messages, userMessage }: ChatRequest = await request.json();

  const updatedHistory: ChatMessage[] = [
    ...messages,
    {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    },
  ];

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Check for @mentions — if found, only those agents respond
  const mentionedNames = agents
    .filter((a) => new RegExp(`@${a.name}\\b`, "i").test(userMessage))
    .map((a) => a.name);

  const activeAgents = mentionedNames.length > 0
    ? agents.filter((a) => mentionedNames.includes(a.name))
    : agents;

  const shuffledAgents = shuffleArray(activeAgents);

  (async () => {
    try {
      const turnStart = JSON.stringify({
        type: "turn_start",
        agentOrder: shuffledAgents.map((a) => a.name),
      });
      await writer.write(encoder.encode(`data: ${turnStart}\n\n`));

      const currentTurnResponses: { agentName: string; content: string }[] = [];

      for (let i = 0; i < shuffledAgents.length; i++) {
        const agent = shuffledAgents[i];
        const isLast = i === shuffledAgents.length - 1;
        const anyoneResponded = currentTurnResponses.length > 0;
        const canPass = mentionedNames.length > 0
          ? false  // Mentioned agents must respond
          : !(isLast && !anyoneResponded);

        const response = await streamAgentResponse(
          agent,
          updatedHistory,
          currentTurnResponses,
          writer,
          encoder,
          canPass
        );

        if (response) {
          currentTurnResponses.push({
            agentName: agent.name,
            content: response,
          });
        }
      }

      const turnDone = JSON.stringify({ type: "turn_done" });
      await writer.write(encoder.encode(`data: ${turnDone}\n\n`));
    } catch (error) {
      const errEvent = JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      try {
        await writer.write(encoder.encode(`data: ${errEvent}\n\n`));
      } catch {
        // Writer may already be closed
      }
    } finally {
      try {
        await writer.close();
      } catch {
        // Already closed
      }
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
