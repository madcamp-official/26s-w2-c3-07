const TICKER_TEXT = "출입금지 · 수사중 →";
const REPEATED_TICKER = Array.from({ length: 12 }, () => TICKER_TEXT).join("  ");

export function MarqueeStrip() {
  return (
    <div className="overflow-hidden border-t border-brass-600/20 bg-noir-950/80 py-2">
      <p className="animate-marquee whitespace-nowrap text-xs tracking-widest text-brass-500/60">
        {REPEATED_TICKER}
        {REPEATED_TICKER}
      </p>
    </div>
  );
}
