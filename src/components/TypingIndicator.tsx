interface TypingIndicatorProps {
  agentName: string;
  agentEmoji: string | null;
}

export function TypingIndicator({
  agentName,
  agentEmoji,
}: TypingIndicatorProps) {
  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-800/60">
        <span>{agentEmoji}</span>
        <span>{agentName} is thinking</span>
        <span className="flex gap-0.5">
          <span className="w-1 h-1 bg-amber-700/50 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1 h-1 bg-amber-700/50 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1 h-1 bg-amber-700/50 rounded-full animate-bounce [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}
