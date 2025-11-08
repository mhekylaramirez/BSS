import React, { useState, useEffect } from "react";

// Simple Markdown -> HTML (minimal subset)
function simpleMarkdownToHtml(md) {
  if (!md) return "";
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return md
    .split("\n")
    .map((line) => {
      if (/^#{1,6}\s/.test(line)) {
        const level = line.match(/^#+/)[0].length;
        return `<h${level}>${esc(line.slice(level + 1).trim())}</h${level}>`;
      }
      let replaced = esc(line).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      replaced = replaced.replace(/\*(.*?)\*/g, "<em>$1</em>");
      replaced = replaced.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' rel='noreferrer'>$1</a>");
      return `<p>${replaced}</p>`;
    })
    .join("\n")
    .split(/```/g)
    .map((part, idx) =>
      idx % 2 === 0 ? part : `<pre class='notebook-code'><code>${part.replace(/&lt;/g, "<").replace(/&gt;/g, ">")}</code></pre>`
    )
    .join("");
}

function FileCard({ filename, content }) {
  return (
    <div className="bg-white/80 dark:bg-slate-800/60 border rounded p-3 shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div className="font-mono text-sm text-slate-700 dark:text-slate-200">{filename}</div>
        <div className="flex gap-2">
          <button className="py-1 px-2 rounded text-sm border" onClick={() => navigator.clipboard.writeText(content)}>Copy</button>
          <a
            className="py-1 px-2 rounded text-sm border"
            href={URL.createObjectURL(new Blob([content], { type: "text/plain" }))}
            download={filename}
            onClick={(e) => setTimeout(() => URL.revokeObjectURL(e.target.href), 2000)}
          >
            Download
          </a>
        </div>
      </div>
      <pre className="mt-2 text-xs overflow-auto max-h-48 bg-slate-50 dark:bg-slate-900 p-2 rounded text-slate-800 dark:text-slate-100">
        {content.slice(0, 400)}
        {content.length > 400 ? "..." : ""}
      </pre>
    </div>
  );
}

export default function App() {
  const [notebook, setNotebook] = useState(null);
  const [error, setError] = useState("");
  const [selectedCell, setSelectedCell] = useState(null);
  const [files, setFiles] = useState({});

  useEffect(() => {
    if (notebook) setFiles(generateProjectFromNotebook(notebook));
    else setFiles({});
  }, [notebook]);

  function handleFile(e) {
    setError("");
    const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
    if (!file) return;
    if (!file.name.endsWith(".ipynb")) {
      setError("Please upload a .ipynb (Jupyter) notebook file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        setNotebook(json);
        setSelectedCell(0);
      } catch (err) {
        setError("Failed to parse notebook: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function renderCell(cell, i) {
    if (!cell) return null;
    if (cell.cell_type === "markdown") {
      return (
        <div
          key={i}
          className={`p-3 rounded border hover:shadow-sm cursor-pointer ${selectedCell === i ? "ring-2 ring-indigo-300" : ""}`}
          onClick={() => setSelectedCell(i)}
          dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml((cell.source || []).join("")) }}
        />
      );
    }
    if (cell.cell_type === "code") {
      const code = (cell.source || []).join("");
      const outputs = (cell.outputs || [])
        .map((o) => (o.data?.["text/plain"] || o.text || []).join(""))
        .join("\n\n");
      return (
        <div
          key={i}
          className={`p-3 rounded border hover:shadow-sm ${selectedCell === i ? "ring-2 ring-indigo-300" : ""}`}
          onClick={() => setSelectedCell(i)}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="font-mono text-xs text-slate-700">Code cell #{i}</div>
            <div className="flex gap-2">
              <button
                className="py-1 px-2 text-xs border rounded"
                onClick={(ev) => {
                  ev.stopPropagation();
                  navigator.clipboard.writeText(code);
                }}
              >
                Copy code
              </button>
              <a
                className="py-1 px-2 text-xs border rounded"
                href={URL.createObjectURL(new Blob([code], { type: "text/plain" }))}
                download={`cell-${i}.py`}
                onClick={(e) => setTimeout(() => URL.revokeObjectURL(e.target.href), 2000)}
              >
                Download .py
              </a>
            </div>
          </div>
          <pre className="mt-2 text-xs overflow-auto max-h-44 bg-slate-50 dark:bg-slate-900 p-2 rounded text-slate-800 dark:text-slate-100">{code}</pre>
          {outputs && (
            <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900 rounded text-xs text-slate-700 dark:text-slate-200">
              <strong>Outputs</strong>
              <pre className="mt-1 whitespace-pre-wrap">{outputs}</pre>
            </div>
          )}
        </div>
      );
    }
    return <div key={i}>Unknown cell type {cell.cell_type}</div>;
  }

  function generateProjectFromNotebook(nb) {
    const nbJsonString = JSON.stringify(nb, null, 2);
    const packageJson = {
      name: "notebook-web-export",
      version: "1.0.0",
      private: true,
      scripts: { start: "vite", build: "vite build", preview: "vite preview" },
      dependencies: { react: "^18.0.0", "react-dom": "^18.0.0" },
      devDependencies: { vite: "^5.0.0" },
    };
    return {
      "package.json": JSON.stringify(packageJson, null, 2),
      "src/NotebookData.js": `const notebook = ${nbJsonString}; export default notebook;`,
    };
  }

  function renderGeneratedFiles() {
    const entries = Object.entries(files);
    if (!entries.length) return <div className="text-slate-500">No generated files yet. Upload a .ipynb to begin.</div>;
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {entries.map(([name, content]) => (
          <FileCard key={name} filename={name} content={content} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto bg-white/60 dark:bg-slate-900/60 border rounded-lg p-6 shadow">
        <h2 className="text-2xl font-bold">Notebook → GitHub project converter</h2>
        <p className="text-sm text-slate-600 mt-1">Upload your .ipynb and get a ready-to-paste React project structure. Files are generated client-side — nothing is uploaded to a server.</p>
        <div className="mt-4 flex gap-3 items-center">
          <label className="cursor-pointer inline-flex items-center gap-2 py-2 px-3 bg-indigo-600 text-white rounded">
            Upload .ipynb
            <input onChange={handleFile} type="file" accept=".ipynb" className="hidden" />
          </label>
          <div className="text-sm text-slate-500">or drag & drop the file onto this window</div>
        </div>
        {error && <div className="mt-3 text-red-600">{error}</div>}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Notebook preview</h3>
              <div className="text-xs text-slate-500">Click cells to focus / copy</div>
            </div>
            <div className="space-y-2">{notebook ? notebook.cells.map(renderCell) : <div className="p-6 border rounded text-slate-500">No notebook loaded. Try uploading a .ipynb</div>}</div>
          </div>
          <aside className="p-3 border rounded bg-slate-50 dark:bg-slate-900">
            <h4 className="font-semibold">Export / GitHub</h4>
            <p className="text-sm text-slate-500 mt-1">Generated files are shown below. Copy/Download to your Git repo.</p>
            <div className="mt-2">{renderGeneratedFiles()}</div>
          </aside>
        </div>
      </div>
    </div>
  );
}
