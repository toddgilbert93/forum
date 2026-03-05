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

  // Auto-resize textarea to fit content
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [input]);

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
    <div className="p-4 border-t border-amber-700/30">
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
          className="flex-1 bg-amber-50/50 border border-amber-700/20 rounded-lg px-4 py-2.5
                     text-sm font-medium text-zinc-800 placeholder:text-zinc-400
                     focus:outline-none focus:ring-1 focus:ring-amber-600/50
                     resize-none disabled:opacity-50 max-h-40 overflow-y-auto"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="bg-amber-800 hover:bg-amber-700 disabled:opacity-30
                     disabled:hover:bg-amber-800 text-amber-50 rounded-lg
                     px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  );
}
