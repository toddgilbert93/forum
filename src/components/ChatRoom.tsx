"use client";

import { useState, useCallback, useRef } from "react";
import { ChatMessage, SSEEvent } from "@/lib/types";
import { agents } from "@/lib/agents";
import { MessageList } from "./MessageList";
import { InputBar } from "./InputBar";
import { AgentHeader } from "./AgentHeader";
import { TypingIndicator } from "./TypingIndicator";

export function ChatRoom() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [currentAgentEmoji, setCurrentAgentEmoji] = useState<string | null>(
    null
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  // Use ref to track messages for the fetch body (avoids stale closure)
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (isProcessing || !userMessage.trim()) return;

      setIsProcessing(true);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: userMessage.trim(),
        timestamp: Date.now(),
      };

      const historyForRequest = messagesRef.current;
      setMessages((prev) => [...prev, userMsg]);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyForRequest,
            userMessage: userMessage.trim(),
          }),
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();

        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += value;
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6);

            let event: SSEEvent;
            try {
              event = JSON.parse(json);
            } catch {
              continue;
            }

            switch (event.type) {
              case "turn_start":
                break;

              case "agent_start":
                setCurrentAgent(event.agent);
                setCurrentAgentEmoji(event.emoji);
                break;

              case "agent_chunk":
                break;

              case "agent_done": {
                const agentMsg: ChatMessage = {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  agentName: event.agent,
                  agentEmoji: event.emoji,
                  content: event.fullContent,
                  timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, agentMsg]);
                setCurrentAgent(null);
                setCurrentAgentEmoji(null);
                break;
              }

              case "agent_skip":
                setCurrentAgent(null);
                setCurrentAgentEmoji(null);
                break;

              case "turn_done":
                setIsProcessing(false);
                setCurrentAgent(null);
                setCurrentAgentEmoji(null);
                break;

              case "error":
                console.error("Stream error:", event.message);
                setIsProcessing(false);
                setCurrentAgent(null);
                setCurrentAgentEmoji(null);
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to send message:", err);
        }
        setIsProcessing(false);
        setCurrentAgent(null);
        setCurrentAgentEmoji(null);
      }
    },
    [isProcessing]
  );

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4">
      <div className="flex flex-col flex-1 min-h-0 rounded-2xl border border-zinc-800 bg-zinc-950/95 overflow-hidden">
        <AgentHeader agents={agents} />
        <MessageList messages={messages} />
        {isProcessing && currentAgent && (
          <TypingIndicator
            agentName={currentAgent}
            agentEmoji={currentAgentEmoji}
          />
        )}
        <InputBar onSend={sendMessage} disabled={isProcessing} />
      </div>
    </div>
  );
}
