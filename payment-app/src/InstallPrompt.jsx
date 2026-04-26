import { useState, useEffect } from "react";

/**
 * PWA Install Prompt
 *
 * Drop this component anywhere inside your App.
 * It listens for the browser's "beforeinstallprompt" event and shows
 * a custom bottom banner with Install / Dismiss buttons.
 *
 * Works on Chrome/Edge/Android. On iOS it shows a manual "Add to Home Screen" tip
 * since iOS doesn't support the native install prompt yet.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (running in standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if user already dismissed this session
    if (sessionStorage.getItem("pwa-dismissed")) return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    if (ios) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    // Chrome/Edge/Android — listen for the native prompt
    const handler = (e) => {
      e.preventDefault(); // stop browser's default mini-infobar
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "1");
  }

  if (!show || dismissed) return null;

  return (
    <div style={{
      position: "fixed", bottom: 80, left: 12, right: 12, zIndex: 200,
      background: "#212121", border: "1px solid #2a2a2a",
      borderRadius: 18, padding: "16px 18px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", gap: 14,
      animation: "slideUp 0.25s ease",
    }}>
      {/* Icon */}
      <div style={{ width: 46, height: 46, borderRadius: 14, background: "#c98a3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
        🎵
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#e8e8e6", marginBottom: 3 }}>
          Install GigLedger
        </p>
        {isIOS ? (
          <p style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>
            Tap <strong style={{ color: "#c98a3a" }}>Share</strong> then <strong style={{ color: "#c98a3a" }}>Add to Home Screen</strong>
          </p>
        ) : (
          <p style={{ fontSize: 12, color: "#888" }}>
            Add to home screen for quick access
          </p>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        {!isIOS && (
          <button onClick={handleInstall}
            style={{ background: "#c98a3a", border: "none", color: "#fff", borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Install
          </button>
        )}
        <button onClick={handleDismiss}
          style={{ background: "none", border: "1px solid #2a2a2a", color: "#666", borderRadius: 10, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>
          {isIOS ? "Got it" : "Not now"}
        </button>
      </div>
    </div>
  );
}
