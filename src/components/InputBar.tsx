"use client";

import { useState, useRef, useEffect } from "react";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function InputBar({ onSend, disabled }: InputBarProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 border-t border-zinc-800">
      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            disabled ? "Agents are thinking..." : "Type a message..."
          }
          rows={1}
          className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5
                     text-sm text-zinc-100 placeholder:text-zinc-500
                     focus:outline-none focus:ring-1 focus:ring-zinc-600
                     resize-none disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30
                     disabled:hover:bg-zinc-700 text-zinc-100 rounded-xl
                     px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  );
}
