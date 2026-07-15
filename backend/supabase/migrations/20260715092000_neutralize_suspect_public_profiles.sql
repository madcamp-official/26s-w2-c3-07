update game_content.suspects
set public_profile = jsonb_build_object(
  'summary', case code
    when 'GS-01-S1' then '오랫동안 종가 살림과 제사 준비를 맡아 온 종부다.'
    when 'GS-01-S2' then '고향을 떠나 지내다 최근 집안일로 돌아온 둘째아들이다.'
    when 'GS-01-S3' then '오랫동안 종가의 집안일을 도우며 지내 온 가족 구성원이다.'
    when 'GS-01-S4' then '문중의 주요 의사결정과 재산 관리를 맡고 있는 친족이다.'
    when 'JL-01-S1' then '오랫동안 피해자와 회사를 함께 운영해 온 공동 경영자다.'
    when 'JL-01-S2' then '가공 현장에서 오랫동안 직원들을 이끌어 온 작업 반장이다.'
    when 'JL-01-S3' then '서울에서 생활하다 사건 소식을 듣고 내려온 피해자의 딸이다.'
    when 'JL-01-S4' then '인근에서 같은 업종의 회사를 운영하는 사업가다.'
    when 'CC-01-S1' then '마을에서 지내며 피해자의 가게 주변을 자주 오가던 청년이다.'
    when 'CC-01-S2' then '마을에서 일용직으로 일하며 피해자와 알고 지내던 청년이다.'
    when 'CC-01-S3' then '마을의 배달 일을 하며 가게를 자주 방문하던 청년이다.'
    when 'CC-01-S4' then '마을에서 지내며 다른 용의자들과 어울리던 청년이다.'
    when 'JJ-01-S1' then '별장의 일상 관리와 잔심부름을 맡아 온 보조 직원이다.'
    when 'JJ-01-S2' then '피해자의 차량 운행과 외부 일정을 담당해 온 운전기사다.'
    when 'JJ-01-S3' then '별장 출입 확인과 야간 경비를 맡아 온 직원이다.'
    when 'JJ-01-S4' then '별장 정원과 외부 시설 관리를 보조해 온 직원이다.'
  end
)
where code in (
  'GS-01-S1', 'GS-01-S2', 'GS-01-S3', 'GS-01-S4',
  'JL-01-S1', 'JL-01-S2', 'JL-01-S3', 'JL-01-S4',
  'CC-01-S1', 'CC-01-S2', 'CC-01-S3', 'CC-01-S4',
  'JJ-01-S1', 'JJ-01-S2', 'JJ-01-S3', 'JJ-01-S4'
);

update game_content.suspects
set victim_relation = case code
  when 'CC-01-S2' then '피해자와 알고 지내던 마을 청년'
  when 'CC-01-S3' then '피해자 식당에 자주 드나들던 배달원'
  when 'CC-01-S4' then '피해자 식당 주변을 오가던 마을 청년'
end
where code in ('CC-01-S2', 'CC-01-S3', 'CC-01-S4');
