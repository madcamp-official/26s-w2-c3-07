import Image from "next/image";

export function SuspectPortrait({ suspectId, name }: { suspectId: string; name: string }) {
  return (
    <div className="relative mx-auto h-72 w-full max-w-md overflow-hidden bg-[radial-gradient(circle_at_50%_25%,#3a322a_0%,#1a1510_55%,#0a0806_100%)] md:h-80">
      <Image
        src={`/images/suspects/${suspectId}.png`}
        alt={name}
        fill
        sizes="(min-width: 768px) 448px, 100vw"
        className="object-cover object-top"
        priority
      />
    </div>
  );
}
