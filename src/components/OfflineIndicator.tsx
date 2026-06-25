"use client";

import { useSyncExternalStore } from "react";
import { Wifi, WifiOff } from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

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
      className={cn(
        ui.withIcon,
        "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
        online ? ui.badgeOnline : ui.badgeOffline,
      )}
      suppressHydrationWarning
    >
      {online ? (
        <Wifi className={ui.iconSm} aria-hidden />
      ) : (
        <WifiOff className={ui.iconSm} aria-hidden />
      )}
      {online ? "Online" : "Offline"}
    </div>
  );
}
