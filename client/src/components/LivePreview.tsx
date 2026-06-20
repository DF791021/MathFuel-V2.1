import { useEffect, useMemo, useRef, useState } from "react";
import { Monitor, Smartphone, Tablet, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LivePreviewProps {
  html: string;
  css: string;
  js: string;
  className?: string;
}

type ViewportSize = "desktop" | "tablet" | "mobile";

const viewportConfig: Record<ViewportSize, { width: string; icon: typeof Monitor; label: string }> = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "375px", icon: Smartphone, label: "Mobile" },
};

export default function LivePreview({ html, css, js, className }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; color: #1a1a2e; background: #ffffff; }
  </style>
  <style>${css}</style>
</head>
<body>
${html}
<script>
try {
${js}
} catch(e) {
  const errDiv = document.createElement('div');
  errDiv.style.cssText = 'position:fixed;bottom:0;left:0;right:0;padding:12px 16px;background:#fef2f2;color:#991b1b;font-family:monospace;font-size:13px;border-top:2px solid #fca5a5;z-index:9999';
  errDiv.textContent = 'JS Error: ' + e.message;
  document.body.appendChild(errDiv);
}
<\/script>
</body>
</html>`;
  }, [html, css, js, refreshKey]);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = srcDoc;
    }
  }, [srcDoc]);

  const config = viewportConfig[viewport];

  return (
    <div className={cn("flex flex-col h-full bg-muted/30 rounded-lg border overflow-hidden", className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          {(Object.entries(viewportConfig) as [ViewportSize, typeof config][]).map(([key, cfg]) => (
            <Button
              key={key}
              variant={viewport === key ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewport(key)}
              title={cfg.label}
            >
              <cfg.icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted-foreground font-mono mr-2">
            {config.width === "100%" ? "100%" : config.width}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setRefreshKey(k => k + 1)}
            title="Refresh preview"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center overflow-auto bg-[#f0f0f3] p-3">
        <div
          className="bg-white rounded-md shadow-sm overflow-hidden transition-all duration-300 h-full"
          style={{
            width: config.width,
            maxWidth: "100%",
          }}
        >
          <iframe
            ref={iframeRef}
            key={refreshKey}
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            title="Live Preview"
            className="w-full h-full border-0"
            style={{ minHeight: "300px" }}
          />
        </div>
      </div>
    </div>
  );
}
