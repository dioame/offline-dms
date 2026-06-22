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
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
        online
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-900"
      }`}
      suppressHydrationWarning
    >
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-amber-500"}`}
        aria-hidden
      />
      {online ? "Online" : "Offline — records saved locally"}
    </div>
  );
}
