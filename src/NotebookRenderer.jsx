// src/NotebookRenderer.jsx
import React from "react";

function simpleMarkdownToHtml(md) {
  if (!md) return "";
  return md
    .replace(/^###### (.*$)/gim, "<h6>$1</h6>")
    .replace(/^##### (.*$)/gim, "<h5>$1</h5>")
    .replace(/^#### (.*$)/gim, "<h4>$1</h4>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2' target='_blank'>$1</a>")
    .replace(/\n/g, "<br/>");
}

export default function NotebookRenderer({ notebook }) {
  const cells = notebook.cells || [];

  return (
    <div className="space-y-6">
      {cells.map((cell, idx) => {
        if (cell.cell_type === "markdown") {
          return (
            <div
              key={idx}
              className="p-4 bg-white/80 dark:bg-slate-800 rounded shadow"
              dangerouslySetInnerHTML={{
                __html: simpleMarkdownToHtml((cell.source || []).join("")),
              }}
            />
          );
        }

        if (cell.cell_type === "code") {
          const code = (cell.source || []).join("");
          const outputs = (cell.outputs || [])
            .map((o) => {
              if (o.data && o.data["text/plain"]) return (o.data["text/plain"] || []).join("");
              if (o.text) return (o.text || []).join("");
              return JSON.stringify(o);
            })
            .join("\n\n");

          return (
            <div
              key={idx}
              className="p-4 bg-gray-50 dark:bg-slate-900 rounded shadow"
            >
              <div className="font-mono text-xs mb-2">Code cell #{idx}</div>
              <pre className="whitespace-pre-wrap">{code}</pre>
              {outputs ? (
                <div className="mt-2 p-2 bg-white/70 dark:bg-slate-800 rounded text-xs text-gray-700 dark:text-gray-300">
                  <strong>Output:</strong>
                  <pre>{outputs}</pre>
                </div>
              ) : null}
            </div>
          );
        }

        return <div key={idx}>Unknown cell type {cell.cell_type}</div>;
      })}
    </div>
  );
}
