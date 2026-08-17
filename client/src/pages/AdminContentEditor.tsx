import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Code as Code2, Eye, Copy, Download, Trash2, FileCode, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import LivePreview from "@/components/LivePreview";
import { useIsMobile } from "@/hooks/useMobile";
import { toast } from "sonner";

const STARTER_HTML = `<div class="container">
  <h1>Welcome to MathFuel</h1>
  <p class="subtitle">Interactive math problem preview</p>

  <div class="problem-card">
    <div class="problem-badge">Grade 3</div>
    <h2>What is 24 + 38?</h2>
    <div class="choices">
      <button class="choice" onclick="checkAnswer(this, false)">52</button>
      <button class="choice" onclick="checkAnswer(this, true)">62</button>
      <button class="choice" onclick="checkAnswer(this, false)">72</button>
      <button class="choice" onclick="checkAnswer(this, false)">42</button>
    </div>
    <div id="feedback" class="feedback"></div>
  </div>
</div>`;

const STARTER_CSS = `.container {
  max-width: 540px;
  margin: 0 auto;
  text-align: center;
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 32px;
}

.problem-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 32px 24px;
  position: relative;
}

.problem-badge {
  display: inline-block;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.problem-card h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 24px;
}

.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.choice {
  padding: 14px;
  font-size: 1.1rem;
  font-weight: 500;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.choice:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-1px);
}

.choice.correct {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #15803d;
}

.choice.incorrect {
  border-color: #ef4444;
  background: #fef2f2;
  color: #b91c1c;
}

.feedback {
  margin-top: 20px;
  font-weight: 600;
  font-size: 1rem;
  min-height: 28px;
}

.feedback.success { color: #16a34a; }
.feedback.error { color: #dc2626; }`;

const STARTER_JS = `function checkAnswer(btn, isCorrect) {
  // Reset all buttons
  document.querySelectorAll('.choice').forEach(b => {
    b.classList.remove('correct', 'incorrect');
    b.disabled = false;
  });

  const feedback = document.getElementById('feedback');

  if (isCorrect) {
    btn.classList.add('correct');
    feedback.textContent = 'Correct! Great work!';
    feedback.className = 'feedback success';
  } else {
    btn.classList.add('incorrect');
    feedback.textContent = 'Not quite. Try again!';
    feedback.className = 'feedback error';
  }

  // Disable all buttons briefly after correct answer
  if (isCorrect) {
    document.querySelectorAll('.choice').forEach(b => {
      b.disabled = true;
    });
  }
}`;

const STORAGE_KEY = "mathfuel-editor-state";

function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveState(html: string, css: string, js: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ html, css, js }));
}

export default function AdminContentEditor() {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const saved = loadSavedState();

  const [html, setHtml] = useState(saved?.html ?? STARTER_HTML);
  const [css, setCss] = useState(saved?.css ?? STARTER_CSS);
  const [js, setJs] = useState(saved?.js ?? STARTER_JS);
  const [activeTab, setActiveTab] = useState("html");
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);

  const handleCodeChange = useCallback(
    (lang: string, value: string) => {
      if (lang === "html") setHtml(value);
      else if (lang === "css") setCss(value);
      else setJs(value);

      const next = {
        html: lang === "html" ? value : html,
        css: lang === "css" ? value : css,
        js: lang === "js" ? value : js,
      };
      saveState(next.html, next.css, next.js);
    },
    [html, css, js]
  );

  const handleCopyAll = useCallback(() => {
    const full = `<!DOCTYPE html>\n<html>\n<head>\n<style>\n${css}\n</style>\n</head>\n<body>\n${html}\n<script>\n${js}\n<\/script>\n</body>\n</html>`;
    navigator.clipboard.writeText(full);
    toast.success("Full HTML copied to clipboard");
  }, [html, css, js]);

  const handleDownload = useCallback(() => {
    const full = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<title>MathFuel Preview</title>\n<style>\n${css}\n</style>\n</head>\n<body>\n${html}\n<script>\n${js}\n<\/script>\n</body>\n</html>`;
    const blob = new Blob([full], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mathfuel-preview.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded mathfuel-preview.html");
  }, [html, css, js]);

  const handleReset = useCallback(() => {
    setHtml(STARTER_HTML);
    setCss(STARTER_CSS);
    setJs(STARTER_JS);
    saveState(STARTER_HTML, STARTER_CSS, STARTER_JS);
    toast.success("Reset to starter template");
  }, []);

  const currentCode = activeTab === "html" ? html : activeTab === "css" ? css : js;

  const editorPanel = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="h-8">
            <TabsTrigger value="html" className="text-xs gap-1 px-3">
              <span className="text-orange-500 font-bold">&lt;/&gt;</span> HTML
            </TabsTrigger>
            <TabsTrigger value="css" className="text-xs gap-1 px-3">
              <span className="text-blue-500 font-bold">#</span> CSS
            </TabsTrigger>
            <TabsTrigger value="js" className="text-xs gap-1 px-3">
              <span className="text-amber-500 font-bold">JS</span> JavaScript
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-1 ml-2">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopyAll} title="Copy full HTML">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleDownload} title="Download HTML">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={handleReset} title="Reset to starter">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <textarea
          value={currentCode}
          onChange={(e) => handleCodeChange(activeTab, e.target.value)}
          className="absolute inset-0 w-full h-full resize-none p-4 font-mono text-sm leading-relaxed bg-[#1e1e2e] text-[#cdd6f4] outline-none"
          spellCheck={false}
          placeholder={`Enter your ${activeTab.toUpperCase()} here...`}
        />
      </div>
    </div>
  );

  const previewPanel = (
    <LivePreview html={html} css={css} js={js} className="h-full rounded-none border-0" />
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-blue-600" />
            <h1 className="text-sm font-semibold tracking-tight">Content Editor</h1>
          </div>
        </div>

        {isMobile && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setShowPreviewMobile((v) => !v)}
          >
            {showPreviewMobile ? (
              <><Code2 className="h-3.5 w-3.5" /> Code</>
            ) : (
              <><Eye className="h-3.5 w-3.5" /> Preview</>
            )}
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs ml-2" onClick={() => setLocation("/admin/users")}>
          <Users className="h-3.5 w-3.5" /> Users
        </Button>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {isMobile ? (
          showPreviewMobile ? previewPanel : editorPanel
        ) : (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={25}>
              {editorPanel}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={25}>
              {previewPanel}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
