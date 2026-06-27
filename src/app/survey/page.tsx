import { Suspense } from "react";
import FormSurveyPage from "../form/FormSurveyPage";
import { SkeletonScreen } from "@/components/ui/Skeleton";

export default function SurveyPage() {
  return (
    <Suspense
      fallback={
        <SkeletonScreen>
          <p className="text-sm text-gray-500">Loading survey…</p>
        </SkeletonScreen>
      }
    >
      <FormSurveyPage />
    </Suspense>
  );
}
