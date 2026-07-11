const SUSPECTS = [
  { name: "전사도", rotate: "-rotate-3" },
  { name: "봉곤도", rotate: "rotate-2" },
  { name: "돌쇠", rotate: "-rotate-1" },
];

export function SuspectPolaroids() {
  return (
    <div className="flex gap-4">
      {SUSPECTS.map((suspect) => (
        <figure
          key={suspect.name}
          className={`w-28 shrink-0 bg-parchment-100 p-2 pb-4 shadow-[0_10px_24px_rgba(0,0,0,0.6)] ${suspect.rotate}`}
        >
          <div className="aspect-square w-full bg-[radial-gradient(circle_at_35%_25%,#3a322a_0%,#1a1510_55%,#0a0806_100%)]" />
          <figcaption className="mt-2 text-center font-display text-sm text-noir-900">
            {suspect.name}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
