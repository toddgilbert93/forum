"use client";

import { useState } from "react";
import { AgentConfig } from "@/lib/types";

interface AgentHeaderProps {
  agents: AgentConfig[];
}

export function AgentHeader({ agents }: AgentHeaderProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const toggle = (name: string) => {
    setExpandedAgent((prev) => (prev === name ? null : name));
  };

  const expanded = agents.find((a) => a.name === expandedAgent);

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h1 className="text-sm font-semibold text-zinc-300">Agent Chat Room</h1>
        <div className="flex items-center gap-2">
          {agents.map((agent) => (
            <button
              key={agent.name}
              onClick={() => toggle(agent.name)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer
                ${expandedAgent === agent.name ? "bg-zinc-800" : "hover:bg-zinc-800/50"}`}
            >
              <span className="text-sm">{agent.emoji}</span>
              <span className={`text-xs ${agent.color}`}>{agent.name}</span>
              <span className="w-2 h-2 bg-green-500 rounded-full" />
            </button>
          ))}
        </div>
      </div>
      {expanded && (
        <div className="absolute right-4 top-12 z-10 w-64 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{expanded.emoji}</span>
            <span className={`text-sm font-semibold ${expanded.color}`}>
              {expanded.name}
            </span>
            <span className="flex items-center gap-1 ml-auto text-xs text-green-400">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              online
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {expanded.description}
          </p>
        </div>
      )}
    </div>
  );
}
