import React from 'react';

function simpleMarkdownToHtml(md) {
  if (!md) return '';
  return md
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>');
}

export default function NotebookRenderer({ notebook }) {
  const cells = notebook.cells || [];
  return (
    <div className="space-y-4">
      {cells.map((cell, idx) => {
        if (cell.cell_type === 'markdown') {
          return (
            <div
              key={idx}
              className="p-4 bg-white/80 border rounded"
              dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml((cell.source || []).join('')) }}
            />
          );
        }
        if (cell.cell_type === 'code') {
          return (
            <div key={idx} className="p-4 bg-slate-50 border rounded">
              <div className="font-mono text-xs">Code cell #{idx}</div>
              <pre className="mt-2 whitespace-pre-wrap">{(cell.source || []).join('')}</pre>
            </div>
          );
        }
        return <div key={idx}>Unknown cell type {cell.cell_type}</div>;
      })}
    </div>
  );
}
