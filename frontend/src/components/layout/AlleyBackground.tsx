import Image from "next/image";

export function AlleyBackground() {
  return (
    <>
      <Image
        src="/images/ui/alley-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(30,22,15,0.08) 0%, rgba(15,11,8,0.25) 45%, rgba(5,4,3,0.45) 75%, rgba(5,4,3,0.62) 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.2)_0%,transparent_18%,transparent_82%,rgba(0,0,0,0.2)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15)_0px,transparent_1px,transparent_2px)] opacity-30" />
    </>
  );
}
