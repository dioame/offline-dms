import Image from "next/image";

type BrandEmblemProps = {
  size?: number;
  className?: string;
};

export default function BrandEmblem({ size = 72, className = "" }: BrandEmblemProps) {
  return (
    <Image
      src="/ph-emblem.png"
      alt="Philippines national emblem"
      width={size}
      height={size}
      className={`object-contain drop-shadow-sm ${className}`}
      priority
    />
  );
}
