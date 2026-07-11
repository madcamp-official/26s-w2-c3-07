export function AlleyBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(120,95,55,0.22) 0%, rgba(30,22,15,0.75) 45%, rgba(8,6,5,0.96) 75%, #050403 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.65)_0%,transparent_18%,transparent_82%,rgba(0,0,0,0.65)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15)_0px,transparent_1px,transparent_2px)] opacity-30" />
    </>
  );
}
