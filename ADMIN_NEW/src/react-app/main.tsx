import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderFatalShell(message: string, details?: string) {
  const root = document.getElementById("root");
  if (!root) return;

  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(180deg,#f7f8fc 0%,#edf1f8 100%);font-family:Inter,system-ui,sans-serif;">
      <div style="width:min(100%,560px);background:#fff;border:1px solid #e6e8f0;border-radius:28px;padding:32px;box-shadow:0 24px 70px rgba(30,39,73,0.12);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          <div style="width:48px;height:48px;border-radius:16px;background:#f4eeff;color:#5240e8;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;">B</div>
          <div>
            <div style="font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#98a2b3;">Bago Admin</div>
            <div style="font-size:22px;font-weight:900;color:#1e2749;">Application recovery screen</div>
          </div>
        </div>
        <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#475467;">${escapeHtml(message)}</p>
        ${
          details
            ? `<details style="margin:0 0 18px 0;">
                 <summary style="cursor:pointer;font-size:12px;font-weight:700;color:#667085;">Show technical details</summary>
                 <pre style="margin-top:12px;white-space:pre-wrap;word-break:break-word;background:#f8f9fc;border:1px solid #eef0f5;border-radius:16px;padding:14px;font-size:12px;color:#475467;">${escapeHtml(details)}</pre>
               </details>`
            : ""
        }
        <button onclick="window.location.reload()" style="border:0;background:#5240e8;color:#fff;border-radius:16px;padding:14px 18px;font-weight:800;cursor:pointer;">
          Reload admin
        </button>
      </div>
    </div>
  `;
}

window.addEventListener("error", (event) => {
  const error = event.error instanceof Error ? event.error : null;
  renderFatalShell(
    "The admin interface hit an unexpected startup error. Reload the page to try again.",
    error?.stack || event.message,
  );
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const details =
    reason instanceof Error
      ? reason.stack || reason.message
      : typeof reason === "string"
        ? reason
        : JSON.stringify(reason, null, 2);
  renderFatalShell(
    "A background admin request failed before the interface could finish loading.",
    details,
  );
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Missing #root mount element");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (error) {
  const err = error instanceof Error ? error : new Error("Unknown bootstrap error");
  renderFatalShell(
    "The admin interface could not boot correctly.",
    err.stack || err.message,
  );
}
