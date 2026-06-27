"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, ClipboardList } from "lucide-react";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";
import UsabilitySurveyForm from "@/components/survey/UsabilitySurveyForm";
import SurveyAnalyticsPanel from "@/components/survey/SurveyAnalyticsPanel";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type FormTab = "survey" | "analytics";

const ADMIN_STORAGE_KEY = "dms_admin_password";

const TABS: { id: FormTab; label: string; icon: typeof ClipboardList }[] = [
  { id: "survey", label: "Survey", icon: ClipboardList },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function FormSurveyPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "analytics" ? "analytics" : "survey";

  const [activeTab, setActiveTab] = useState<FormTab>(initialTab);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      setPassword(stored);
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("tab") === "analytics") {
      setActiveTab("analytics");
    }
  }, [searchParams]);

  function handleUnlock(nextPassword: string) {
    setPassword(nextPassword);
    setUnlocked(true);
  }

  return (
    <div className={ui.pageBg}>
      <header className={ui.appHeader}>
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-start gap-4">
            <BrandEmblem size={64} className="hidden shrink-0 sm:block" />
            <div>
              <p className={cn(ui.kicker, "text-xs font-bold uppercase")}>
                DSWD · Online/Offline Faced Application
              </p>
              <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                Offline/Online Faced App Evaluation Survey
              </h1>
              <p className={cn(ui.subtitle, "mt-2 max-w-xl text-sm")}>
                Online/Offline Faced Application — awareness, evaluation, impact,
                sustainability, and overall rating. Analytics and Excel export for
                administrators.
              </p>
            </div>
          </div>
        </div>
        <TricolorBar thick />
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <div className={ui.verifyTabs} role="tablist" aria-label="Survey sections">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn(ui.verifyTabClass(active), ui.withIcon)}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className={ui.iconSm} aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "survey" ? (
          <UsabilitySurveyForm />
        ) : (
          <SurveyAnalyticsPanel
            password={password}
            unlocked={unlocked}
            onUnlock={handleUnlock}
          />
        )}
      </main>
    </div>
  );
}
