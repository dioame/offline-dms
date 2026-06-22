"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getOnlineServerSnapshot() {
  return true;
}

export default function OfflineIndicator() {
  const online = useSyncExternalStore(
    subscribe,
    getOnlineSnapshot,
    getOnlineServerSnapshot,
  );

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
        online ? "ph-badge-online" : "ph-badge-offline"
      }`}
      suppressHydrationWarning
    >
      <span
        className={`h-2 w-2 rounded-full ${
          online ? "bg-[var(--ph-blue)]" : "bg-[var(--ph-yellow)]"
        }`}
        aria-hidden
      />
      {online ? "Online" : "Offline"}
    </div>
  );
}
