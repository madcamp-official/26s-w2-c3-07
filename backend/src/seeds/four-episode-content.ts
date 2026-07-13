import type { SeedRow, SeedTables } from './content-seed.js';
import { tableOrder } from './content-seed.js';

type SuspectSpec = {
  name: string;
  age: number;
  occupation: string;
  culprit?: boolean;
  profile: string;
  fact: string;
  lie: string;
  response: string;
};

type EpisodeSpec = {
  code: string;
  regionCode: string;
  regionName: string;
  title: string;
  location: string;
  synopsis: string;
  victim: { name: string; age: number; occupation: string; profile: string };
  suspects: SuspectSpec[];
  timeline: [string, string][];
  evidence: [string, string][];
  clues: [string, string][];
  dialect: [string, string, string][];
  endings: { correct: string; wrongA: string; wrongB: string };
};

const id = (group: number, item: number) => `${group.toString(16).padStart(8, '0')}-0000-4000-8000-${item.toString(16).padStart(12, '0')}`;

const specs: EpisodeSpec[] = [
  {
    code: 'GS-01', regionCode: 'GS', regionName: '경상도', title: '종가의 밤', location: '안동 인근 종가 고택',
    synopsis: '시제를 하루 앞둔 밤, 17대 종손 김재현이 사랑채에서 숨진 채 발견된다. 부검 결과 사인은 두부 외상이 아닌 초오 중독으로 밝혀진다.',
    victim: { name: '김재현', age: 68, occupation: '17대 종손·대주', profile: '원칙주의자이며 완고한 성격으로, 최근 가족들에게 유독 엄격했다.' },
    suspects: [
      { name: '이순임', age: 58, occupation: '종부·김재현의 아내', culprit: true, profile: '21세에 시집와 37년째 종부로 살았으며 오랜 울분을 숨기고 있다.', fact: '유언장에서 자신의 몫이 삭제된 것을 알고 초오를 탄 안동식혜를 건넸다.', lie: '식혜를 가져다준 뒤에는 다시 사랑채에 가지 않았다고 주장한다.', response: '유언장을 언급하면 방어적으로 변하고 초오와 뒷산을 추궁하면 동요한다.' },
      { name: '김도현', age: 42, occupation: '둘째아들', profile: '사업 실패와 빚 때문에 고향에 내려왔으며 죄책감에 시달린다.', fact: '18시경 아버지를 밀쳐 문틀에 머리를 부딪히게 했지만 그 상처는 사인이 아니었다.', lie: '아버지와 크게 싸우지 않았다고 주장한다.', response: '몸싸움을 추궁하면 자신이 죽였을지도 모른다는 두려움 속에서 사실을 털어놓는다.' },
      { name: '박말순', age: 71, occupation: '행랑어멈', profile: '김재현의 이복 누나지만 평생 집안의 일하는 사람으로 살아왔다.', fact: '21시경 사랑채에서 신음 소리를 들었으나 그냥 지나쳤다.', lie: '그날 밤 아무 소리도 듣지 못했다고 주장한다.', response: '신분과 신음 소리를 함께 추궁하면 침묵한 이유를 밝히며 오열한다.' },
      { name: '김판석', age: 71, occupation: '문중회장·6촌 형', profile: '문중 재산인 위토답을 관리하며 종손과 매각 문제로 갈등했다.', fact: '김재현이 땅을 팔아 둘째아들의 사업자금을 대주려던 계획을 알고 있다.', lie: '땅 문제는 이미 모두 해결됐다고 주장한다.', response: '위토답 문제를 추궁하면 거만한 태도에서 방어적으로 변한다.' }
    ],
    timeline: [['18:00', '김도현이 사업자금 문제로 김재현과 몸싸움을 벌인 뒤 마을 술집으로 간다.'], ['19:00', '이순임이 초오를 탄 안동식혜를 사랑채에 전달한다.'], ['21:00', '박말순이 사랑채 앞을 지나며 신음 소리를 듣지만 지나친다.'], ['22:00', '이순임이 위독한 남편을 확인하고도 방치한다.'], ['익일 05:00', '박말순이 제사 준비 중 시신을 발견한다.']],
    evidence: [['마시다 만 안동식혜 그릇', '남은 식혜에서 초오 성분이 검출된다.'], ['사랑채 문 앞 옥비녀', '이순임 소유의 옥비녀다.'], ['유언장 초안', '이순임의 몫이 삭제되어 있다.'], ['문틀의 혈흔과 긁힌 자국', '김도현과 피해자의 몸싸움 흔적이다.'], ['부검 소견서', '두부 외상은 경미하며 사인은 초오 중독이다.']],
    clues: [['유언장 초안', '이순임의 살해 동기를 보여준다.'], ['부검 소견서', '김도현이 만든 두부 외상이 사인이 아님을 보여준다.'], ['문틀 흔적과 김도현의 진술', '몸싸움은 있었지만 치명상은 아니었다.'], ['박말순의 신음 소리 증언', '피해자가 21시경 살아 있었음을 보여준다.'], ['옥비녀', '이순임이 사랑채에 다시 들어갔음을 뒷받침한다.']],
    dialect: [['됐다 고마', '됐어요, 그만해요', '대화를 중단하려는 표현'], ['억수로', '매우, 엄청', '강조 표현'], ['정지', '부엌', '장소 표현'], ['속이 다 시커멓다', '오랜 세월 마음이 썩어들었다', '이순임의 반복 표현']],
    endings: { correct: '37년의 시집살이와 유언장의 마지막 배신감이 이순임의 살인으로 이어졌음이 밝혀진다.', wrongA: '김도현은 자신이 아버지를 죽이지 않았다고 절규하고 진범 이순임은 의심을 피한다.', wrongB: '박말순은 자신의 신분과 침묵의 이유를 밝히지만 진범 이순임은 안도한다.' }
  },
  {
    code: 'JL-01', regionCode: 'JL', regionName: '전라도', title: '삭힌 진실', location: '나주 홍어 가공업체 발효창고',
    synopsis: '홍어 가공업체 대표 서병만이 발효창고에서 뒤통수를 맞고 쓰러진 채 발견된다. 사고사처럼 보였지만 장부 조작을 숨기려는 살인이었다.',
    victim: { name: '서병만', age: 65, occupation: '홍어 가공업체 대표', profile: '위암 말기 진단을 숨긴 채 딸과 화해하려 했고 외부 회계사에게 장부 검토를 맡기려 했다.' },
    suspects: [
      { name: '정춘삼', age: 60, occupation: '동업자·부사장', culprit: true, profile: '20년 지기 동업자이며 3년 전부터 회사 자금을 빼돌렸다.', fact: '장부 검토로 횡령이 발각될 것을 막으려 저울추로 서병만을 살해했다.', lie: '사건 당시 계속 사무실에 있었다고 주장한다.', response: '회계사와 장부를 언급하면 동요하고 CCTV를 제시하면 격앙된다.' },
      { name: '최말자', age: 55, occupation: '가공팀 반장', profile: '20년 근무했으며 밀린 월급 때문에 피해자와 자주 부딪혔다.', fact: '서병만의 위암 말기 진단서와 장부를 모두 밝히겠다는 말을 알고 있다.', lie: '진단서를 본 사실만 끝까지 숨긴다.', response: '임금 문제에는 당당하지만 진단서를 언급하면 크게 동요한다.' },
      { name: '서지영', age: 35, occupation: '피해자의 딸', profile: '아버지와 갈등한 뒤 서울에 살고 있다.', fact: '전날 밤 아버지에게 유언장을 다시 쓰겠다는 전화를 받았다.', lie: '최근 아버지와 거의 연락하지 않았다고 주장한다.', response: '마지막 전화 내용을 추궁하면 화해의 기회를 놓친 일을 후회한다.' },
      { name: '오갑수', age: 58, occupation: '목포 경쟁업체 사장', profile: '정춘삼과 서병만 몰래 회사 인수 협상을 진행했다.', fact: '정춘삼과 회사 인수 문제로 은밀히 통화했다.', lie: '서병만과 최근 연락하지 않았다고 주장한다.', response: '인수 협상을 언급하면 여유를 잃고 당황한다.' }
    ],
    timeline: [['전날 22:00', '서병만이 딸 서지영에게 유언장을 다시 쓰겠다고 전화한다.'], ['14:00', '최말자가 사장실에서 서병만의 진단서를 목격한다.'], ['17:00', '서병만이 외부 회계사에게 장부를 모두 보자고 전화한다.'], ['19:00', '정춘삼이 서병만을 살해하고 실족사로 위장한다.'], ['19:30', '오갑수가 정춘삼과 회사 인수 건으로 통화한다.'], ['익일 07:00', '최말자가 창고에서 시신을 발견한다.']],
    evidence: [['조작 흔적이 있는 회계장부', '회사 자금 횡령 정황이 남아 있다.'], ['창고 잠금장치', '강제로 열린 흔적이 없어 내부인 소행을 암시한다.'], ['휴대전화 통화기록', '회계사, 딸, 정춘삼 순의 마지막 발신 내역이다.'], ['발효통 주변 흔적', '미끄러진 흔적과 몸싸움 흔적이 남아 있다.'], ['병원 진단서', '서병만의 위암 말기 진단서다.']],
    clues: [['조작된 장부 숫자', '정춘삼의 횡령 정황을 보여준다.'], ['회계사 통화', '정춘삼에게 장부 검사를 막아야 할 긴급한 동기가 있었다.'], ['CCTV와 진술의 모순', '정춘삼의 사무실 알리바이를 무너뜨린다.'], ['최말자가 본 진단서', '최말자의 침묵이 살인 은폐가 아니었음을 보여준다.'], ['서지영의 마지막 통화', '유언장 이야기가 상속이 아니라 화해 시도였음을 보여준다.']],
    dialect: [['거시기', '애매하게 지칭하거나 얼버무리는 말', '정춘삼의 습관어'], ['몰것는디', '모르겠습니다', '회피 표현'], ['참말이여', '정말이에요', '확인 표현'], ['겁나', '매우, 엄청', '강조 표현']],
    endings: { correct: '3년간의 횡령이 발각될 위기에서 정춘삼이 벌인 계획적 살인임이 드러난다.', wrongA: '서지영은 아버지의 마지막 화해 시도를 놓친 채 무고하게 체포되고 정춘삼은 비웃는다.', wrongB: '최말자는 진단서 비밀을 털어놓지만 정춘삼은 안도한다.' }
  },
  {
    code: 'CC-01', regionCode: 'CC', regionName: '충청도', title: '정자나무집의 불', location: '충남 부여 정자나무 백숙집',
    synopsis: '백숙집 화재 뒤 사장이 발견된다. 부검 결과 화재 전 둔기에 맞아 숨졌으며, 사건은 살인 후 방화로 전환된다.',
    victim: { name: '정태식', age: 61, occupation: '정자나무 백숙집 사장', profile: '돈을 빌려준 뒤 거칠게 독촉하는 성격으로 맹용식과 채무 문제로 갈등했다.' },
    suspects: [
      { name: '노방석', age: 21, occupation: '무직', profile: '소심하고 자신의 소문이 퍼지는 것을 싫어한다.', fact: '19시 30분경 부엌 뒤편에서 몰래 담배를 피운 뒤 귀가했다.', lie: '그날은 집에서 계속 자고 있었다고 주장한다.', response: '초저녁에 현장에 있었지만 범행 시각에는 이미 귀가했다고 말한다.' },
      { name: '맹용식', age: 24, occupation: '일용직 노동자', culprit: true, profile: '도박 빚에 시달리며 웃는 얼굴 뒤에 잔인하고 계산적인 면을 숨긴다.', fact: '돈궤를 훔치다 발각되자 피해자를 살해하고 주방에 불을 질렀다.', lie: '그날 밤 내내 당구장에 있었다고 주장한다.', response: '그을음과 장부 조작을 추궁하면 공격적으로 증거를 요구한다.' },
      { name: '목성구', age: 20, occupation: '배달원', profile: '말수가 적고 맹용식 앞에서 위축된다.', fact: '23시 35분경 그을음이 묻은 맹용식이 당구장에 도착해 장부를 고치는 것을 봤다.', lie: '맹용식이 처음부터 당구장에 있었다고 주장한다.', response: '협박을 두려워하지만 도착 시각과 그을음을 차츰 털어놓는다.' },
      { name: '표성두', age: 19, occupation: '고등학교 중퇴', profile: '겁이 많고 심리적 압박에 약하다.', fact: '23시 43분 맹용식에게 거짓 알리바이를 강요하는 협박 전화를 받았다.', lie: '맹용식과 당구장에 함께 있었다고 주장한다.', response: '통화 기록을 제시하면 보복이 두려워 거짓말했다고 밝힌다.' }
    ],
    timeline: [['19:30', '노방석이 부엌 뒤편에서 담배를 피운 뒤 귀가한다.'], ['22:20', '목성구가 읍내 당구장에 먼저 도착한다.'], ['22:55', '맹용식이 백숙집에 침입한다.'], ['23:10', '맹용식이 피해자를 둔기로 살해한다.'], ['23:15', '돈을 훔친 뒤 주방에 불을 지른다.'], ['23:35', '맹용식이 그을음이 묻은 채 당구장에 도착한다.'], ['23:43', '표성두에게 거짓 알리바이를 강요한다.']],
    evidence: [['깨진 손목시계', '밤 11시 10분에 멈춰 범행 시각을 보여준다.'], ['수정된 당구장 장부', '입장 시각 23시 38분을 22시로 덧씌웠다.'], ['녹색 테이프 라이터', '맹용식이 소지품에 감는 것과 같은 테이프가 감겨 있다.'], ['표성두의 통화기록', '23시 43분 맹용식과 통화한 기록이다.'], ['돈궤와 둔기', '돈은 사라졌고 둔기에서 피해자의 혈흔이 확인된다.']],
    clues: [['손목시계', '범행 시각이 밤 11시 10분임을 보여준다.'], ['노방석의 시간 표현', '노방석은 초저녁에 현장을 떠났음을 보여준다.'], ['목성구의 그을음 증언', '맹용식이 화재 현장에 있었음을 암시한다.'], ['조작된 당구장 장부', '맹용식의 알리바이를 무너뜨린다.'], ['표성두의 통화기록', '공동 알리바이가 조작됐음을 보여준다.'], ['녹색 테이프 라이터', '맹용식과 방화 현장을 연결한다.']],
    dialect: [['해 어스름할 적', '해가 질 무렵, 초저녁', '시간 표현'], ['정지', '부엌', '장소 표현'], ['끄을뎅이', '검게 묻은 그을음', '목성구의 증언'], ['몰러유', '몰라요', '회피 표현'], ['강냉이 털리다', '얻어맞다', '협박 표현']],
    endings: { correct: '조작된 장부와 그을음 증언, 통화기록, 라이터가 맹용식의 살인·절도·방화를 입증한다.', wrongA: '노방석은 초저녁에 담배만 피웠다고 결백을 호소하고 맹용식은 조용히 웃는다.', wrongB: '협박받은 목성구 또는 표성두가 체포되고 맹용식은 마을을 떠난다.' }
  },
  {
    code: 'JJ-01', regionCode: 'JJ', regionName: '제주도', title: '애월 별장의 마지막 차', location: '제주 애월 해안 별장',
    synopsis: '자산가 차영백 회장이 독이 든 차를 마시고 숨진 채 발견된다. 금고의 비밀 장부도 사라졌고 직원 네 명의 공동 알리바이는 조금씩 어긋난다.',
    victim: { name: '차영백', age: 72, occupation: '관광·유통 회사 회장', profile: '모든 지출을 직접 기록하며 운전기사 강윤호의 비용 횡령 정황을 확인했다.' },
    suspects: [
      { name: '문태오', age: 22, occupation: '별장 관리 보조', profile: '애월 출신으로 겁이 많고 해고를 두려워한다.', fact: '18시 40분경 탕비실에서 고급 찻잎을 조금 훔쳤다.', lie: '탕비실 근처에도 가지 않았다고 주장한다.', response: '해가 지기 전 찻잎을 가져갔을 뿐 밤에는 들어가지 않았다고 밝힌다.' },
      { name: '강윤호', age: 29, occupation: '개인 운전기사', culprit: true, profile: '성산 출신으로 영악하고 상대를 압박하는 데 익숙하다.', fact: '차량 비용 횡령이 발각되자 차에 독을 넣고 비밀 장부를 훔쳤다.', lie: '사건 당시 직원들과 탑동에서 계속 술을 마셨다고 주장한다.', response: '흰 가루와 출입 기록을 제시하면 공격적으로 증거를 요구한다.' },
      { name: '양재우', age: 27, occupation: '별장 경비원', profile: '한림 출신으로 말수가 적고 강윤호에게 위축되어 있다.', fact: '22시 50분경 서재에서 나오는 강윤호와 소매의 흰 가루를 봤다.', lie: '직원 모두 탑동에 함께 있었다고 주장한다.', response: '협박을 두려워하지만 강윤호의 소매에 흰 가루가 많이 묻었다고 증언한다.' },
      { name: '오민석', age: 23, occupation: '정원 관리 보조', profile: '대정 출신으로 심리적 압박에 약하다.', fact: '23시 27분 강윤호에게 공동 알리바이를 강요하는 협박 전화를 받았다.', lie: '직원 모두 탑동에 있었다고 주장한다.', response: '통화 기록을 제시하면 누명을 쓸까 두려워 거짓말했다고 밝힌다.' }
    ],
    timeline: [['18:40', '문태오가 탕비실에서 고급 찻잎을 몰래 덜어낸다.'], ['21:30', '차영백이 비밀 장부를 검토한 뒤 강윤호를 서재로 부른다.'], ['22:10', '강윤호가 차에 독성 약물을 넣는다.'], ['22:30', '강윤호가 차를 서재에 전달한다.'], ['22:50', '양재우가 서재에서 나온 강윤호의 소매에 묻은 흰 가루를 본다.'], ['23:18', '강윤호가 사용하던 차량이 정문을 나간다.'], ['23:27', '강윤호가 오민석에게 거짓 알리바이를 강요한다.']],
    evidence: [['차영백의 전용 찻잔', '남은 차에서 백색 분말형 독성 약물이 검출된다.'], ['사라진 비밀 장부', '현금과 귀중품은 그대로이고 장부만 사라졌다.'], ['비밀 장부 복사본', '강윤호가 차량 수리비와 유류비를 부풀린 기록이다.'], ['별장 정문 출입기록', '23시 18분 강윤호가 사용하던 차량이 나갔다.'], ['오민석의 통화기록', '23시 27분 강윤호에게서 걸려 온 통화다.'], ['빈 약품 포장지', '찻잔에서 검출된 것과 같은 계열의 약품 포장지다.']],
    clues: [['문태오의 방문 시각', '탕비실 방문은 해가 지기 전이어서 독 투입 시간과 다르다.'], ['양재우의 흰 고루 증언', '강윤호의 소매에 흰 가루가 많이 묻어 있었다.'], ['정문 출입기록', '강윤호의 탑동 알리바이와 충돌한다.'], ['오민석의 통화기록', '공동 알리바이가 강요됐음을 보여준다.'], ['장부 복사본', '강윤호가 장부를 훔쳐야 했던 횡령 동기를 보여준다.'], ['찻잔과 빈 약품 포장지', '탕비실과 독살 수법을 연결한다.']],
    dialect: [['하영', '많이', '수량 표현'], ['게메', '글쎄', '답하기 어려울 때 쓰는 표현'], ['고루', '가루', '물질 표현'], ['안트레', '안으로', '방향 표현'], ['모르쿠다', '모르겠습니다', '회피 표현']],
    endings: { correct: '흰 가루, 차량 출입기록, 협박 전화, 횡령 장부와 독성 약물이 강윤호의 범행을 입증한다.', wrongA: '문태오는 해 지기 전에 찻잎만 가져갔다고 결백을 호소하고 강윤호는 장부를 챙겨 떠난다.', wrongB: '협박받은 양재우 또는 오민석이 체포되고 강윤호의 거짓 알리바이는 진실로 기록된다.' }
  }
];

export const fourEpisodeContent = (): SeedTables => {
  const tables = Object.fromEntries(tableOrder.map((table) => [table, []])) as unknown as SeedTables;
  specs.forEach((spec, episodeIndex) => {
    const group = episodeIndex + 1;
    const regionId = id(group, 1);
    const episodeId = id(group, 2);
    const victimId = id(group, 3);
    const suspectIds = spec.suspects.map((_, index) => id(group, 10 + index));
    const culpritId = suspectIds[spec.suspects.findIndex((suspect) => suspect.culprit)];

    tables.regions.push({ id: regionId, code: spec.regionCode, name: spec.regionName, description: `${spec.regionName} 사건 지역`, image_url: null, display_order: group, is_active: true });
    tables.episodes.push({ id: episodeId, region_id: regionId, code: spec.code, title: spec.title, location: spec.location, incident_type: '살인 사건', synopsis: spec.synopsis, estimated_play_minutes: 15, culprit_suspect_id: null, _culprit_suspect_id: culpritId, status: 'published', content_version: 1, cover_image_url: null, display_order: group });
    ['easy', 'normal', 'hard'].forEach((difficulty, index) => {
      const total = difficulty === 'easy' ? 12 : difficulty === 'normal' ? 8 : spec.code === 'JJ-01' ? 6 : 4;
      tables.episode_difficulty_configs.push({ id: id(group, 20 + index), episode_id: episodeId, difficulty, questions_per_suspect: difficulty === 'easy' ? 3 : difficulty === 'normal' ? 2 : 1, total_questions: total, time_limit_seconds: difficulty === 'easy' ? 900 : difficulty === 'normal' ? 720 : 600, dialect_level: difficulty === 'easy' ? 1 : difficulty === 'normal' ? 2 : 3, hint_limit: difficulty === 'easy' ? 3 : difficulty === 'normal' ? 1 : 0, config: {} });
    });

    tables.victims.push({ id: victimId, episode_id: episodeId, name: spec.victim.name, age: spec.victim.age, role: spec.victim.occupation, public_profile: { summary: spec.victim.profile }, server_truth: { synopsis: spec.synopsis }, image_url: null });
    spec.suspects.forEach((suspect, index) => {
      const suspectId = suspectIds[index];
      const code = `${spec.code}-S${index + 1}`;
      const factId = id(group, 100 + index);
      tables.suspects.push({ id: suspectId, episode_id: episodeId, code, name: suspect.name, age: suspect.age, occupation: suspect.occupation, public_profile: { summary: suspect.profile }, personality: { summary: suspect.profile }, speech_style: { guidance: suspect.response }, victim_relation: suspect.occupation, actual_route: [], claimed_route: [], initial_emotion: 'NEUTRAL', display_order: index + 1, image_url: null, is_active: true });
      tables.suspect_facts.push({ id: factId, suspect_id: suspectId, code: `${code}-FACT`, fact_type: 'KNOWN', content: suspect.fact, disclosure_level: 'LLM_ALLOWED', priority: 10, metadata: {} });
      tables.suspect_lies.push({ id: id(group, 110 + index), suspect_id: suspectId, code: `${code}-LIE`, topic: '알리바이', true_content: suspect.fact, claimed_content: suspect.lie, reveal_conditions: {} });
      tables.suspect_response_rules.push({ id: id(group, 120 + index), suspect_id: suspectId, question_type: 'Q-OTHER', response_policy: { guidance: suspect.response }, allowed_fact_refs: [factId], hidden_fact_refs: [], evasion_type: 'PARTIAL_ANSWER', difficulty_overrides: {} });
      tables.suspect_emotion_rules.push({ id: id(group, 130 + index), suspect_id: suspectId, trigger_type: 'INTERROGATION', from_emotion: 'NEUTRAL', to_emotion: 'DEFENSIVE', condition: {}, priority: 10 });
    });

    tables.episode_timelines.push({ id: id(group, 199), episode_id: episodeId, sequence_no: 0, occurred_at_label: '사건 발견', public_description: spec.synopsis, server_description: spec.synopsis, visibility: 'PUBLIC_INITIAL', metadata: {} });
    spec.timeline.forEach(([occurredAt, description], index) => tables.episode_timelines.push({ id: id(group, 200 + index), episode_id: episodeId, sequence_no: index + 1, occurred_at_label: occurredAt, public_description: null, server_description: description, visibility: 'SERVER_ONLY', metadata: {} }));

    const evidenceIds = spec.evidence.map((_, index) => id(group, 300 + index));
    spec.evidence.forEach(([title, description], index) => tables.evidence.push({ id: evidenceIds[index], episode_id: episodeId, code: `${spec.code}-E${index + 1}`, title, description, evidence_type: 'PHYSICAL', disclosure_level: index === 0 ? 'PUBLIC_INITIAL' : 'SESSION_UNLOCKED', role: null, initial_visible: index === 0, _initial_visible: index === 0, image_url: null, metadata: {}, display_order: index + 1 }));

    const clueIds = spec.clues.map((_, index) => id(group, 400 + index));
    spec.clues.forEach(([title, content], index) => {
      tables.clues.push({ id: clueIds[index], episode_id: episodeId, code: `${spec.code}-C${index + 1}`, title, content, clue_type: 'PHYSICAL', importance: 'CORE', record_summary: content, supports_culprit_id: culpritId, source_refs: [], excludes_suspect_refs: [], is_repeatable: false, is_required_for_full_resolution: true, display_order: index + 1, _is_core: true });
      const conditions: SeedRow[] = [
        { condition_type: 'EVIDENCE_VIEWED', target_ref: evidenceIds[0], operator: 'EQ', expected_value: evidenceIds[0], _target_evidence_id: evidenceIds[0] },
        { condition_type: 'QUESTION_TYPE_ASKED', target_ref: 'Q-TIME', operator: 'EXISTS', expected_value: true },
        { condition_type: 'QUESTION_TYPE_ASKED', target_ref: 'Q-EVIDENCE', operator: 'EXISTS', expected_value: true },
        { condition_type: 'FACT_USED', target_ref: id(group, 100 + (index % suspectIds.length)), operator: 'EQ', expected_value: true },
        { condition_type: 'SUSPECT_INTERROGATED', target_ref: culpritId, operator: 'EXISTS', expected_value: true, _target_suspect_id: culpritId },
        { condition_type: 'CLUE_ACQUIRED', target_ref: clueIds[index - 1], operator: 'EQ', expected_value: true, _target_clue_id: clueIds[index - 1] }
      ];
      tables.clue_unlock_conditions.push({ id: id(group, 500 + index), clue_id: clueIds[index], group_no: 1, condition_order: 1, ...conditions[index] });
    });

    spec.dialect.forEach(([expression, standardMeaning, usageContext], index) => tables.dialect_expressions.push({ id: id(group, 600 + index), episode_id: episodeId, code: `${spec.code}-D${index + 1}`, expression, standard_meaning: standardMeaning, usage_context: usageContext, importance: 'SUPPORT', related_clue_id: clueIds[clueIds.length - 1], difficulty_rules: {}, is_post_ending_only: false, display_order: index + 1, _episode_id: episodeId, _related_clue_id: clueIds[clueIds.length - 1] }));

    [spec.endings.correct, spec.endings.wrongA, spec.endings.wrongB].forEach((fixedContent, index) => tables.endings.push({ id: id(group, 700 + index), episode_id: episodeId, code: `${spec.code}-${index === 0 ? 'TRUE' : `FALSE-${index}`}`, ending_type: index === 0 ? 'TRUE' : 'WRONG_SPECIFIC', target_suspect_id: index === 0 ? culpritId : suspectIds[index], title: index === 0 ? '정답 엔딩' : `오답 엔딩 ${index}`, fixed_content: { narrative: fixedContent }, llm_prompt_context: {}, asset_url: null, display_order: index + 1, _target_suspect_id: index === 0 ? culpritId : suspectIds[index] }));

    spec.suspects.slice(1).forEach((suspect, index) => tables.suspect_relationships.push({ id: id(group, 800 + index), episode_id: episodeId, source_suspect_id: culpritId, target_suspect_id: suspectIds[index + 1], target_victim_id: null, relation_type: 'CO_SUSPECT', public_description: `${spec.suspects.find((item) => item.culprit)?.name}와 ${suspect.name}은 같은 사건의 용의자다.`, hidden_description: null, disclosure_level: 'PUBLIC_PROFILE' }));
  });
  return tables;
};
