type BrandMarkProps = {
  showIcon?: boolean;
};

export function BrandMark({ showIcon = false }: BrandMarkProps) {
  return (
    <div className="text-left">
      <p className="font-display text-xl text-parchment-100 md:text-2xl">
        {showIcon && (
          <span aria-hidden className="mr-2">
            🕵️
          </span>
        )}
        탐정님,
        <br />
        <span className="font-bold">그 뜻이 아니예라</span>
      </p>
      <p className="mt-2 text-xs text-brass-400 md:text-sm">
        사투리 속 <span className="text-evidence-red">진실</span>을 파헤치는 심문 추리 게임
      </p>
    </div>
  );
}
