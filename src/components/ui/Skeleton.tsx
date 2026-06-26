import { cn } from "@/lib/cn";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-ph-blue-light/70", className)}
      aria-hidden
    />
  );
}

type SkeletonScreenProps = {
  label?: string;
  children: React.ReactNode;
  className?: string;
};

export function SkeletonScreen({ label = "Loading", children, className }: SkeletonScreenProps) {
  return (
    <div className={className} role="status" aria-busy="true" aria-label={label}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-lg border border-faced-blue-border bg-white px-4 py-3"
        >
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-8 w-14" />
          <Skeleton className="mt-2 h-3 w-36" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex gap-3 border-b border-faced-blue-border pb-3">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-3 py-1">
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton
              key={col}
              className={cn("h-4 flex-1", col === 0 && "max-w-[35%]", col === columns - 1 && "max-w-[4.5rem]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonRecordList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="overflow-hidden rounded-xl border border-faced-blue-border bg-white divide-y divide-faced-blue-border">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-start justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-52" />
              <Skeleton className="h-3 w-36" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonFormCard({ fields = 6 }: { fields?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-faced-blue-border bg-white shadow-card">
      <div className="border-b border-faced-blue-border bg-ph-blue-light/40 px-5 py-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-3 w-64" />
      </div>
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        {Array.from({ length: fields }, (_, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="space-y-4 rounded-lg border border-faced-blue-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="rounded-md border border-faced-blue-border px-3 py-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="mt-2 h-7 w-10" />
          </div>
        ))}
      </div>
      <Skeleton className="h-44 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <SkeletonStatGrid count={4} />
      <div className="space-y-4">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <SkeletonTable rows={6} columns={5} />
      </div>
    </div>
  );
}

export function SkeletonDuplicateList({ groups = 3 }: { groups?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: groups }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-amber-300/60 bg-ph-yellow-light/30"
        >
          <div className="border-b border-amber-300/40 px-4 py-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-56" />
          </div>
          <div className="divide-y divide-amber-200/60 px-4 py-2">
            {Array.from({ length: 2 }, (_, row) => (
              <div key={row} className="space-y-2 py-2">
                <div className="flex justify-between gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Skeleton className="h-5 w-28 rounded" />
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-5 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonVerifyResults({ cards = 2 }: { cards?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <div className="flex gap-4 rounded-xl border border-faced-blue-border bg-white p-5 shadow-card">
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-full max-w-md" />
          <Skeleton className="h-3 w-3/4 max-w-sm" />
        </div>
      </div>
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-faced-blue-border bg-white shadow-card">
          <div className="border-b border-faced-blue-border px-5 py-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, field) => (
              <div key={field} className="space-y-1">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonLoginCard() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-faced-blue-border bg-white shadow-card-lg">
      <Skeleton className="h-10 w-full rounded-none" />
      <div className="space-y-4 p-5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonSessionBar() {
  return (
    <div className="border-b border-faced-blue-border bg-gradient-to-r from-ph-yellow-light to-ph-blue-light px-4 py-2">
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

export function SkeletonEmblemLoader() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

function SkeletonDetailSection({
  titleWidth,
  fieldCount,
}: {
  titleWidth: string;
  fieldCount: number;
}) {
  return (
    <div className="space-y-3">
      <Skeleton className={cn("h-4", titleWidth)} />
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: fieldCount }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonRecordView() {
  return (
    <div className="space-y-6">
      <SkeletonDetailSection titleWidth="w-40" fieldCount={6} />
      <SkeletonDetailSection titleWidth="w-36" fieldCount={15} />
      <SkeletonDetailSection titleWidth="w-44" fieldCount={6} />
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <SkeletonTable rows={3} columns={9} />
      </div>
    </div>
  );
}
