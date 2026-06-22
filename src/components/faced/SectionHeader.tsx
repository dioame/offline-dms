type SectionHeaderProps = {
  title: string;
  number?: string;
};

export default function SectionHeader({ title, number }: SectionHeaderProps) {
  return (
    <div className="faced-section-header">
      {number && <span className="mr-2 font-bold">{number}.</span>}
      {title}
    </div>
  );
}
