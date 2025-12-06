import React from "react";
import type { ScriptStatus } from "@/hooks/useScriptBridge";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scripts: ScriptStatus[];
}

const STATUS_UI: Record<ScriptStatus["status"], { card: string; badge: string; label: string }> = {
  running: {
    card: "border-ink bg-overlay",
    badge: "bg-ink/20 text-ink-soft",
    label: "RUNNING",
  },
  completed: {
    card: "border-green-500/30 bg-green-500/5",
    badge: "bg-green-500/20 text-green-400",
    label: "COMPLETED",
  },
  error: {
    card: "border-red-500/30 bg-red-500/5",
    badge: "bg-red-500/20 text-red-400",
    label: "ERROR",
  },
};

export default function ScriptDebugPanel({ isOpen, onClose, scripts }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-ink rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-ink">
          <h3 className="text-lg font-medium text-cream">Script Execution Debugger</h3>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-amber transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {scripts.length === 0 ? (
            <div className="text-center text-ink-soft py-8">
              No scripts detected or executed yet.
            </div>
          ) : (
            scripts.map((script) => (
              <div 
                key={`${script.scriptName || "script"}-${script.timestamp}`}
                className={`p-3 rounded border ${STATUS_UI[script.status].card}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-cream">{script.scriptName || "Script"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_UI[script.status].badge}`}>
                    {STATUS_UI[script.status].label}
                  </span>
                </div>
                <div className="text-xs text-ink-soft mb-1">
                  {new Date(script.timestamp).toLocaleTimeString()}
                </div>
                {script.message && (
                  <div className="mt-2 p-2 bg-black/30 rounded text-xs text-red-300 font-mono whitespace-pre-wrap">
                    {script.message}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
