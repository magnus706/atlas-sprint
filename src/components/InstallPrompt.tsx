"use client";
// Registers the service worker and offers an install affordance:
//  - Chrome/Android/desktop: captures beforeinstallprompt → "Install" button
//  - iOS Safari (no beforeinstallprompt): a one-time "Add to Home Screen" hint
// Dismissals are remembered in localStorage. Hidden entirely once installed.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CrossIcon, ShareIcon } from "./icons";
import Mascot from "./Mascot";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "atlas-sprint-install-dismissed";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Register the SW in production only — a caching SW interferes with the
    // dev server's HMR and can serve stale chunks.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (dismissed) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS Safari never fires beforeinstallprompt — detect and hint instead.
    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    if (isIos && isSafari) {
      const t = setTimeout(() => {
        setShowIosHint(true);
        setVisible(true);
      }, 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }

    const onInstalled = () => setVisible(false);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-md px-3 pb-[max(90px,calc(env(safe-area-inset-bottom)+86px))]"
        >
          <div className="flex items-center gap-3 rounded-2xl border-2 border-line bg-white p-3 shadow-[0_6px_0_#E5E5E5]">
            <Mascot size={48} float={false} />
            <div className="flex-1">
              <p className="text-sm font-extrabold leading-tight">Add Atlas Sprint to your phone</p>
              {showIosHint ? (
                <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-sub">
                  Tap <ShareIcon size={14} className="text-blue" /> then “Add to Home Screen”
                </p>
              ) : (
                <p className="mt-0.5 text-xs font-bold text-sub">Play like a real app, even offline.</p>
              )}
            </div>
            {!showIosHint && deferred && (
              <button
                onClick={install}
                className="rounded-xl bg-brand px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_3px_0_#008F88]"
              >
                Install
              </button>
            )}
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sub"
            >
              <CrossIcon size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
