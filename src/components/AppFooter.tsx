import TricolorBar from "@/components/brand/TricolorBar";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

export default function AppFooter() {
  return (
    <footer className={ui.appFooter}>
      <TricolorBar />
      <div className={ui.appFooterInner}>
        <p className={ui.appFooterTitle}>Developed by DSWD Field Office Caraga</p>
        <p className={ui.appFooterSub}>
          Department of Social Welfare and Development · Region XIII · Family Assistance
          Card in Emergencies and Disasters (FACED)
        </p>
        <p className={cn(ui.appFooterSub, "mt-1")}>
          Republic of the Philippines
        </p>
      </div>
    </footer>
  );
}
