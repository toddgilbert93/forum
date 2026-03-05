"use client";

import { useState, useEffect, useRef } from "react";
import { AgentConfig } from "@/lib/types";

interface AgentHeaderProps {
  agents: AgentConfig[];
}

export function AgentHeader({ agents }: AgentHeaderProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = (name: string) => {
    setExpandedAgent((prev) => (prev === name ? null : name));
  };

  useEffect(() => {
    if (!expandedAgent) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpandedAgent(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expandedAgent]);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-amber-700/30">
      <h1 className="text-sm font-normal text-zinc-800" style={{ fontFamily: 'var(--font-cinzel)' }}>The Forum</h1>
      <div ref={containerRef} className="flex items-center gap-2">
        {agents.map((agent) => (
          <div key={agent.name} className="relative">
            <button
              onClick={() => toggle(agent.name)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer
                ${expandedAgent === agent.name ? "bg-amber-200/40" : "hover:bg-amber-100/30"}`}
            >
              <span className="text-sm">{agent.emoji}</span>
              <span className={`text-xs ${agent.color}`}>{agent.name}</span>
              <span className="w-2 h-2 bg-green-500 rounded-full" />
            </button>
            {expandedAgent === agent.name && (
              <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-[#ece5d5] border border-amber-700/30 rounded-lg p-3 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{agent.emoji}</span>
                  <span className={`text-sm font-semibold ${agent.color}`}>
                    {agent.name}
                  </span>
                  <span className="flex items-center gap-1 ml-auto text-xs text-zinc-600 bg-zinc-200/70 border border-green-500 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    online
                  </span>
                </div>
                <p className="text-xs text-zinc-800 font-medium leading-relaxed">
                  {agent.description}
                </p>
                <p className="text-[10px] text-zinc-500 mt-2 font-mono">
                  {agent.model}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
