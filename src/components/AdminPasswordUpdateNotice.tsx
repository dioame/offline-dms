import { AlertTriangle } from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type AdminPasswordUpdateNoticeProps = {
  className?: string;
};

export default function AdminPasswordUpdateNotice({
  className,
}: AdminPasswordUpdateNoticeProps) {
  return (
    <div
      role="status"
      className={cn(
        ui.alertWarning,
        "flex items-start gap-3 border-ph-yellow bg-[#fff3d6] text-[#7a4e00] shadow-sm",
        className,
      )}
    >
      <AlertTriangle className={cn(ui.iconMd, "mt-0.5 shrink-0 text-ph-yellow-dark")} aria-hidden />
      <div className="min-w-0 space-y-1.5 text-sm leading-relaxed">
        <p>
          <strong>Admin password update:</strong> We are updating the Admin Password to ensure
          security. Please contact{" "}
          <a href="mailto:djcrendon@dswd.gov.ph" className="font-semibold underline underline-offset-2">
            djcrendon@dswd.gov.ph
          </a>{" "}
          or{" "}
          <a href="mailto:jlompad@dswd.gov.ph" className="font-semibold underline underline-offset-2">
            jlompad@dswd.gov.ph
          </a>{" "}
          for the new admin password. Thank you.
        </p>
        <p className="font-semibold">
          Reminder: All beneficiary information is strictly confidential. Do not share, disclose,
          or misuse any personal data of FACED beneficiaries.
        </p>
      </div>
    </div>
  );
}
