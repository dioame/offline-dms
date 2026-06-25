import * as ui from "@/lib/ui";

type SectionHeaderProps = {
  title: string;
  number?: string;
};

export default function SectionHeader({ title, number }: SectionHeaderProps) {
  return (
    <div className={ui.sectionHeader}>
      {number && <span className="mr-2 font-bold">{number}.</span>}
      {title}
    </div>
  );
}
