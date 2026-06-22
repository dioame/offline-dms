type TricolorBarProps = {
  className?: string;
  thick?: boolean;
};

export default function TricolorBar({ className = "", thick = false }: TricolorBarProps) {
  return (
    <div
      className={`ph-tricolor flex w-full overflow-hidden rounded-sm ${thick ? "h-1.5" : "h-1"} ${className}`}
      aria-hidden
    >
      <span className="flex-1 bg-[var(--ph-blue)]" />
      <span className="flex-1 bg-[var(--ph-red)]" />
      <span className="flex-1 bg-[var(--ph-yellow)]" />
    </div>
  );
}
