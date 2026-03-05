import { ChatMessage } from "@/lib/types";
import { agents } from "@/lib/agents";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isHuman = message.role === "user";

  if (isHuman) {
    return (
      <div className="flex justify-end">
        <div className="bg-zinc-700/50 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%]">
          <p className="text-zinc-100 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  const agent = agents.find((a) => a.name === message.agentName);
  const bgColor = agent?.accentBg || "bg-zinc-800/50";
  const nameColor = agent?.color || "text-zinc-400";

  return (
    <div className="flex justify-start">
      <div className={`${bgColor} rounded-xl px-4 py-2.5 max-w-[80%]`}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{message.agentEmoji}</span>
          <span className={`text-xs font-semibold ${nameColor}`}>
            {message.agentName}
          </span>
        </div>
        <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
}
