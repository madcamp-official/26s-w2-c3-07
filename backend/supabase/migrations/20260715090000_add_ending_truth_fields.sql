update game_content.endings
set fixed_content = fixed_content || jsonb_build_object(
  'motive', case code
    when 'GS-01-TRUE' then '37년간 종부로 희생했지만 유언장에서 자신의 몫마저 삭제된 데 대한 배신감과 울분'
    when 'JL-01-TRUE' then '3년간 저지른 회사 자금 횡령이 외부 장부 검토로 드러나는 것을 막기 위해'
    when 'CC-01-TRUE' then '도박 빚을 갚기 위해 피해자의 돈궤를 훔치려다 발각되자 범행을 감추기 위해'
    when 'JJ-01-TRUE' then '차량 수리비와 유류비 횡령이 비밀 장부를 통해 발각되는 것을 막기 위해'
  end,
  'crimeMethod', case code
    when 'GS-01-TRUE' then '초오를 탄 안동식혜를 피해자에게 건넨 뒤 중독 증상이 나타난 피해자를 방치했다.'
    when 'JL-01-TRUE' then '발효창고에서 저울추로 피해자의 뒤통수를 가격한 뒤 실족 사고처럼 현장을 위장했다.'
    when 'CC-01-TRUE' then '피해자를 둔기로 살해하고 돈을 훔친 뒤 주방에 불을 질러 화재 사고로 위장했다.'
    when 'JJ-01-TRUE' then '피해자의 차에 독성 약물을 넣어 전달하고, 범행을 입증할 비밀 장부를 훔친 뒤 거짓 알리바이를 강요했다.'
  end
)
where code in ('GS-01-TRUE', 'JL-01-TRUE', 'CC-01-TRUE', 'JJ-01-TRUE');
