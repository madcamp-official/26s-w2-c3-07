import type { SeedRow, SeedTables } from './content-seed.js';
import { tableOrder } from './content-seed.js';

type SuspectSpec = { name: string; age: number; occupation: string; culprit?: boolean; profile: string; fact: string; lie: string; response: string; emotion: string };
type EpisodeSpec = {
  code: string; regionCode: string; regionName: string; dialectName: string; title: string; synopsis: string;
  victim: { name: string; age: number; occupation: string; profile: string };
  suspects: SuspectSpec[]; timeline: [string, string][]; evidence: [string, string][]; clues: [string, string][];
  dialect: [string, string, string][]; endings: { correct: string; wrongA: string; wrongB: string };
};

const id = (group: number, item: number) => `${group.toString(16).padStart(8, '0')}-0000-4000-8000-${item.toString(16).padStart(12, '0')}`;
const slug = (value: string) => value.replace(/[^A-Z0-9]+/gi, '-').replace(/^-|-$/g, '').toUpperCase();

const specs: EpisodeSpec[] = [
  {
    code: 'GS-01', regionCode: 'GS', regionName: '경상도', dialectName: '경상도 사투리', title: '종가의 밤',
    synopsis: '안동 인근 17대 종가 고택에서 시제를 하루 앞두고 대주 김재현이 사랑채에서 숨진 채 발견된다.',
    victim: { name: '김재현', age: 68, occupation: '17대 종손·대주', profile: '원칙주의자이며 완고하고, 최근 당뇨와 고혈압으로 예민해졌다.' },
    suspects: [
      { name: '이순임', age: 58, occupation: '종부·김재현의 아내', culprit: true, profile: '21세에 시집와 37년째 종부로 살며 눌러온 울분이 있다.', fact: '유언장에서 자신의 몫이 삭제됐다.', lie: '식혜를 갖다준 뒤 다시 나가지 않았다고 주장한다.', response: '유언장 언급 시 방어적이며 초오와 뒷산 언급 시 동요하고 눈물을 보인다.', emotion: '초반 담담, 유언장 언급 시 방어적, 초오·뒷산 언급 시 동요·눈물' },
      { name: '김도현', age: 42, occupation: '둘째아들', profile: '사업 실패와 빚 때문에 귀향했으며 다혈질이나 근본은 소심하다.', fact: '18시경 아버지를 밀쳐 문틀에 머리를 부딪히게 했으나 사인은 아니었다.', lie: '아버지와 크게 싸우지 않았다고 주장한다.', response: '몸싸움 언급 시 무너지듯 사실을 말하고 부검 결과를 들으면 안도와 죄책감을 보인다.', emotion: '회피·과민 반응에서 자백 뒤 안도와 죄책감으로 변화' },
      { name: '박말순', age: 71, occupation: '행랑어멈·김재현의 이복 누나', profile: '족보에 오르지 못하고 평생 집안의 일하는 사람으로 살았다.', fact: '21시경 사랑채에서 신음 소리를 들었다.', lie: '그날 밤 아무 소리도 듣지 못했다고 주장한다.', response: '숨겨진 신분과 신음 소리를 외면한 이유를 추궁하면 오열한다.', emotion: '회피에서 신분 질문 시 동요, 방관 추궁 시 오열' },
      { name: '김판석', age: 71, occupation: '문중회장·6촌 형', profile: '문중 재산인 위토답을 관리하는 원칙주의자다.', fact: '김재현이 땅을 팔아 김도현의 사업자금을 대주려 했다.', lie: '땅 문제는 이미 해결됐다고 주장한다.', response: '위토답에 대한 개인적 욕심을 추궁하면 방어적으로 변한다.', emotion: '거만함에서 땅 문제 추궁 시 방어적으로 변화' }
    ],
    timeline: [['18:00','김도현이 사업자금 문제로 김재현과 몸싸움한 뒤 술집으로 간다.'],['19:00','이순임이 초오를 탄 안동식혜를 사랑채에 전달한다.'],['21:00','박말순이 사랑채 앞에서 신음 소리를 듣고 지나간다.'],['22:00','이순임이 위독한 남편을 확인하고도 방치한다.'],['익일 05:00','박말순이 제사 준비 중 시신을 발견한다.']],
    evidence: [['안동식혜 그릇','마시다 만 식혜에서 초오 성분이 검출된다.'],['옥비녀','사랑채 문 앞에서 발견되며 이순임 소유다.'],['유언장 초안','이순임의 몫이 삭제되어 있다.'],['문틀 흔적','미세한 혈흔과 긁힌 자국이 김도현의 몸싸움을 보여준다.'],['부검 소견서','두부 외상은 경미하고 사인은 초오 중독이다.']],
    clues: [['유언장과 초오','유언장 삭제가 동기이며 뒷산에서 초오를 캤다는 제3자 증언이 입수 경로를 보여준다.'],['부검과 문틀','두부 외상은 사인이 아니어서 김도현을 배제한다.'],['신음 소리와 옥비녀','신음 시각과 22시 재방문을 연결한다.'],['박말순의 신분','침묵의 동기를 살인이 아닌 가족사로 재해석한다.'],['속이 다 시커멓다','오랜 세월 마음이 썩어들었다는 뜻이다.']],
    dialect: [['됐다 고마','됐어요, 그만해요','그만하자는 표현'],['억수로','매우, 엄청','강조 표현'],['정지','부엌','장소 표현'],['속이 다 시커멓다','마음이 상하고 썩어들었다','관용 표현']],
    endings: { correct: '이순임의 초오 중독 살인과 37년 시집살이 끝의 배신감이 밝혀진다.', wrongA: '김도현이 밀치기만 했다고 절규하고 이순임은 옅게 비웃는다.', wrongB: '박말순이 자신이 그 집 딸임을 밝히며 결백을 호소하고 이순임은 안도한다.' }
  },
  {
    code: 'JL-01', regionCode: 'JL', regionName: '전라도', dialectName: '전라도 사투리', title: '삭힌 진실',
    synopsis: '나주의 3대 홍어 가공·유통업체 발효창고에서 대표 서병만이 뒤통수를 맞고 숨진 채 발견된다.',
    victim: { name: '서병만', age: 65, occupation: '홍어 가공업체 대표', profile: '위암 말기 진단을 숨기고 소원했던 딸과 화해하려 했다.' },
    suspects: [
      { name: '정춘삼', age: 60, occupation: '동업자·부사장', culprit: true, profile: '20년 동업자이며 계산적이고 3년간 회사 자금을 횡령했다.', fact: '서병만이 외부 회계사를 불러 장부를 점검할 예정이었다.', lie: '사건 저녁 내내 사무실에 있었다고 주장한다.', response: '회계사와 장부 언급 시 동요하고 CCTV 제시 시 격앙된다.', emotion: '여유에서 동요를 거쳐 격앙' },
      { name: '최말자', age: 55, occupation: '가공팀 반장', profile: '20년 근무했으며 밀린 월급 때문에 서병만과 자주 부딪혔다.', fact: '서병만의 위암 말기 진단서와 회계사에게 모두 밝히겠다는 말을 안다.', lie: '진단서에 관한 비밀 약속 때문에 그 이야기만 회피한다.', response: '임금 문제에는 당당하지만 진단서가 언급되면 크게 동요하고 오열한다.', emotion: '당당함에서 진단서 언급 시 동요·오열' },
      { name: '서지영', age: 35, occupation: '서병만의 딸', profile: '아버지와 갈등 후 서울에 정착했으며 표준어에 사투리가 섞인다.', fact: '전날 밤 아버지가 유언장을 다시 쓰겠다고 전화했다.', lie: '최근 아버지와 거의 연락하지 않았다고 주장한다.', response: '마지막 전화 내용을 추궁하면 짜증만 냈던 일을 후회하며 무너진다.', emotion: '상속 이야기에는 방어적, 전화 추궁 시 후회하며 무너짐' },
      { name: '오갑수', age: 58, occupation: '목포 경쟁업체 사장', profile: '호탕하지만 뒤끝이 있고 원료 독점계약으로 서병만과 갈등했다.', fact: '정춘삼과 회사 인수를 은밀히 협상했다.', lie: '서병만과 최근 연락하지 않았다고 주장한다.', response: '목포 알리바이 확인 후 여유를 찾지만 인수 협상 언급 시 당황한다.', emotion: '방어적에서 여유, 인수 협상 언급 시 당황' }
    ],
    timeline: [['전날 22:00','서병만이 서지영에게 유언장을 다시 쓰겠다고 전화한다.'],['14:00','최말자가 임금 문제로 언쟁 중 진단서를 본다.'],['17:00','서병만이 외부 회계사에게 장부를 모두 보자고 전화한다.'],['19:00','정춘삼이 창고에서 서병만을 저울추로 살해하고 실족사로 위장한다.'],['19:30','오갑수가 정춘삼과 회사 인수 건으로 통화한다.'],['익일 07:00','최말자가 시신을 발견한다.']],
    evidence: [['회계장부','숫자 조작 흔적이 있다.'],['창고 잠금장치','강제로 열린 흔적이 없어 내부인 소행을 암시한다.'],['휴대폰 통화기록','회계사, 딸, 정춘삼 순의 마지막 발신 내역이다.'],['발효통 주변 흔적','미끄러진 흔적과 몸싸움 흔적이 있다.'],['병원 진단서','서병만의 위암 말기 진단서다.']],
    clues: [['조작된 장부와 회계사 통화','횡령과 정춘삼의 살해 동기를 연결한다.'],['CCTV 알리바이 모순','정춘삼이 창고 근처에 있었음을 보여준다.'],['진단서','최말자의 침묵을 비밀 약속으로 재해석한다.'],['마지막 전화','서지영과의 통화가 상속이 아니라 화해 목적이었음을 보여준다.'],['인수 협상 통화','오갑수와 정춘삼의 거래를 살인과 분리해 판단하게 한다.']],
    dialect: [['거시기','애매하게 지칭하거나 얼버무리는 말','정춘삼의 습관어'],['몰것는디','모르겠습니다','회피 표현'],['참말이여','정말이에요','확인 표현'],['겁나','매우, 엄청','강조 표현']],
    endings: { correct: '정춘삼의 3년간 횡령과 이를 감추기 위한 살인이 밝혀진다.', wrongA: '서지영이 마지막 전화조차 제대로 듣지 못했다고 절규하고 정춘삼은 비웃는다.', wrongB: '최말자가 진단서 비밀을 털어놓으며 결백을 호소하고 정춘삼은 안도한다.' }
  },
  {
    code: 'CC-01', regionCode: 'CC', regionName: '충청도', dialectName: '충청도 사투리', title: '정자나무집의 불',
    synopsis: '부여의 정자나무 백숙집 화재 뒤 사장이 발견되며, 부검으로 살인 후 방화 사건임이 드러난다.',
    victim: { name: '정태식', age: 61, occupation: '정자나무 백숙집 사장', profile: '돈을 빌려준 뒤 거칠게 독촉해 맹용식과 채무 갈등이 있었다.' },
    suspects: [
      { name: '노방석', age: 21, occupation: '무직', profile: '소심하며 소문이 퍼지는 것을 싫어한다.', fact: '19시 30분경 부엌 뒤편에서 몰래 담배를 피웠다.', lie: '그날 집에서 계속 잤다고 주장한다.', response: '해 어스름할 적 정지 옆에 있었음을 인정하지만 범행 시각과 다르다.', emotion: '방화범으로 몰릴까 두려워함' },
      { name: '맹용식', age: 24, occupation: '일용직 노동자', culprit: true, profile: '겉으로 웃지만 잔인하고 계산적이며 도박 빚이 있다.', fact: '돈궤를 훔치다 발각되어 정태식을 살해하고 주방에 불을 질렀다.', lie: '그날 밤 내내 당구장에 있었다고 주장한다.', response: '그을음과 장부 조작을 추궁하면 공격적으로 증거를 요구한다.', emotion: '웃는 태도에서 공격적 방어로 변화' },
      { name: '목성구', age: 20, occupation: '배달원', profile: '말수가 적고 맹용식 앞에서 위축된다.', fact: '23시 35분경 그을음이 묻은 맹용식과 장부 조작을 목격했다.', lie: '맹용식이 처음부터 당구장에 있었다고 주장한다.', response: '협박이 두려워 말끝을 흐리지만 도착 시각과 그을음을 밝힌다.', emotion: '위축과 공포' },
      { name: '표성두', age: 19, occupation: '고등학교 중퇴', profile: '겁이 많고 심리적 압박에 약하다.', fact: '23시 43분 맹용식에게 거짓 알리바이를 강요받았다.', lie: '당구장에서 맹용식과 함께 있었다고 주장한다.', response: '통화 기록을 제시하면 협박 때문에 거짓말했다고 밝힌다.', emotion: '보복에 대한 공포' }
    ],
    timeline: [['19:30','노방석이 정지 뒤편에서 담배를 피우고 귀가한다.'],['22:20','목성구가 당구장에 도착한다.'],['22:55','맹용식이 백숙집에 침입한다.'],['23:10','맹용식이 정태식을 둔기로 살해한다.'],['23:15','돈을 훔치고 주방에 방화한다.'],['23:35','맹용식이 그을음이 묻은 채 당구장에 도착한다.'],['23:38','당구장 장부 입장 시각을 조작한다.'],['23:43','표성두에게 거짓 알리바이를 강요한다.']],
    evidence: [['깨진 손목시계','23시 10분에 멈춰 범행 시각을 보여준다.'],['당구장 장부','23시 38분 입장을 22시로 덧씌운 흔적이 있다.'],['녹색 테이프 라이터','맹용식이 소지품에 감는 것과 같은 테이프가 감겨 있다.'],['표성두 통화 기록','23시 43분 맹용식과 통화해 공동 알리바이와 충돌한다.'],['돈궤와 둔기','돈은 사라졌고 둔기에서 피해자 혈흔이 확인된다.']],
    clues: [['손목시계와 노방석의 시간 표현','노방석의 초저녁 방문을 범행 시각과 분리한다.'],['끄을뎅이 증언','맹용식이 화재 현장에 있었음을 암시한다.'],['조작된 당구장 장부','맹용식의 알리바이를 무너뜨린다.'],['통화 기록','표성두의 공동 알리바이가 강요된 것임을 보여준다.'],['라이터와 사라진 돈','맹용식을 방화 현장과 도박 빚 동기에 연결한다.']],
    dialect: [['해 어스름할 적','해가 질 무렵, 초저녁','시간 표현'],['정지','부엌','장소 표현'],['끄을뎅이','검게 묻은 그을음','증언 표현'],['강냉이 털리다','얻어맞다','위협 표현']],
    endings: { correct: '장부, 그을음 증언, 통화 기록과 라이터로 맹용식의 살인·절도·방화가 밝혀진다.', wrongA: '노방석이 초저녁에 담배만 피웠다고 결백을 호소하고 맹용식은 조용히 웃는다.', wrongB: '협박 피해자가 체포되고 맹용식은 알리바이를 인정받아 마을을 떠난다.' }
  },
  {
    code: 'JJ-01', regionCode: 'JJ', regionName: '제주도', dialectName: '제주 방언', title: '애월 별장의 마지막 차',
    synopsis: '애월 해안 별장에서 차영백 회장이 독이 든 차를 마시고 숨지며 비밀 장부가 사라진다.',
    victim: { name: '차영백', age: 72, occupation: '관광·유통회사 회장', profile: '직원들을 믿지 않고 지출 내역을 직접 기록했으며 강윤호의 횡령을 확인했다.' },
    suspects: [
      { name: '문태오', age: 22, occupation: '별장 관리 보조', profile: '애월 출신으로 겁이 많고 해고를 두려워한다.', fact: '18시 40분 탕비실에서 고급 찻잎을 훔쳤다.', lie: '탕비실 근처에도 가지 않았다고 주장한다.', response: '해 지기 전 찻잎을 가져갔을 뿐 밤에는 가지 않았다고 말한다.', emotion: '해고와 독살 누명에 대한 공포' },
      { name: '강윤호', age: 29, occupation: '개인 운전기사', culprit: true, profile: '성산 출신으로 영악하고 상대를 압박하는 데 익숙하다.', fact: '차량 비용을 조작해 횡령했고 차에 독을 넣어 회장을 살해한 뒤 장부를 훔쳤다.', lie: '사건 당시 직원들과 탑동에서 술을 마셨다고 주장한다.', response: '흰 고루를 차고 약품 탓으로 돌리고 증거를 내놓으라며 공격적으로 부인한다.', emotion: '공격적 방어' },
      { name: '양재우', age: 27, occupation: '별장 경비원', profile: '한림 출신으로 말수가 적고 강윤호에게 위축되어 있다.', fact: '22시 50분 서재에서 나오는 강윤호와 소매의 흰 가루를 봤다.', lie: '근무 중 흡연과 협박 때문에 공동 알리바이에 동조한다.', response: '늦은 밤 강윤호와 흰 고루를 봤지만 더는 모르겠다고 말끝을 흐린다.', emotion: '위축과 협박에 대한 공포' },
      { name: '오민석', age: 23, occupation: '정원 관리 보조', profile: '대정 출신으로 심리적 압박에 약하다.', fact: '23시 27분 강윤호에게 거짓 알리바이를 강요받았다.', lie: '직원 모두 탑동에 있었다고 주장한다.', response: '누명을 씌우겠다는 협박 때문에 시킨 말만 했다고 밝힌다.', emotion: '누명과 협박에 대한 공포' }
    ],
    timeline: [['18:40','문태오가 탕비실에서 고급 찻잎을 훔친다.'],['21:30','차영백이 장부를 검토하고 강윤호를 부른다.'],['22:10','강윤호가 차에 독성 약물을 넣는다.'],['22:30','강윤호가 차를 서재에 전달한다.'],['22:50','양재우가 서재 쪽에서 나오는 강윤호와 흰 가루를 본다.'],['23:05','차영백이 독성 약물로 쓰러진다.'],['23:18','강윤호가 사용하던 차량이 정문을 나간다.'],['23:27','강윤호가 오민석에게 거짓 알리바이를 강요한다.']],
    evidence: [['전용 찻잔','차와 잔에서 백색 분말형 독성 약물이 검출된다.'],['사라진 비밀 장부','금고의 현금은 그대로이고 장부만 사라졌다.'],['장부 복사본','강윤호가 차량 수리비와 유류비를 부풀린 기록이다.'],['정문 출입 기록','23시 18분 강윤호가 쓰던 차량이 나갔다.'],['오민석 통화 기록','23시 27분 강윤호에게서 전화가 왔다.'],['빈 약품 포장지','찻잔에서 검출된 것과 같은 계열 약품이 사라졌다.']],
    clues: [['문태오의 방문 시각','탕비실 방문은 해가 지기 전으로 독 투입 시각과 다르다.'],['흰 고루 증언','강윤호 소매에 많은 흰 가루가 묻어 있었다.'],['정문 출입 기록','강윤호의 탑동 알리바이와 충돌한다.'],['협박 전화 기록','공동 알리바이가 강요됐음을 보여준다.'],['장부 복사본','강윤호의 횡령과 살해 동기를 보여준다.'],['찻잔과 약품 포장지','탕비실과 독살 수법을 연결한다.']],
    dialect: [['하영','많이','수량 표현'],['게메','글쎄','답하기 어려울 때 쓰는 담화 표현'],['고루','가루','물질 표현'],['안트레','안으로','방향 표현'],['모르쿠다','모르겠습니다','회피 표현']],
    endings: { correct: '흰 가루, 차량 기록, 협박 전화, 장부 복사본과 독성 약물로 강윤호가 체포된다.', wrongA: '문태오가 해 지기 전 찻잎만 가져갔다고 결백을 호소하고 강윤호는 장부와 함께 떠난다.', wrongB: '협박받은 직원이 체포되고 강윤호는 횡령 자금과 장부를 챙겨 제주를 떠난다.' }
  }
];

export const fourEpisodeContent = (): SeedTables => {
  const tables = Object.fromEntries(tableOrder.map((table) => [table, []])) as unknown as SeedTables;
  specs.forEach((spec, episodeIndex) => {
    const group = episodeIndex + 1;
    const regionId = id(group, 1); const episodeId = id(group, 2); const victimId = id(group, 3);
    const suspectIds = spec.suspects.map((_, index) => id(group, 10 + index));
    const culpritId = suspectIds[spec.suspects.findIndex((suspect) => suspect.culprit)];
    tables.regions.push({ id: regionId, code: spec.regionCode, name: spec.regionName, dialect_name: spec.dialectName, description: `${spec.regionName} 사건 지역`, sort_order: group, is_active: true });
    tables.episodes.push({ id: episodeId, region_id: regionId, code: spec.code, title: spec.title, synopsis: spec.synopsis, scene_description: spec.synopsis, location: spec.regionName, incident_type: '살인 사건', estimated_play_minutes: 15, status: 'available', image_url: null, culprit_suspect_id: null, _culprit_suspect_id: culpritId, default_difficulty: 'normal', is_published: true, sort_order: group });
    ['easy','normal','hard'].forEach((difficulty, index) => { const total = difficulty === 'easy' ? 12 : difficulty === 'normal' ? 8 : spec.code === 'JJ-01' ? 6 : 4; tables.episode_difficulty_configs.push({ id: id(group, 20 + index), episode_id: episodeId, difficulty, questions_per_suspect: difficulty === 'easy' ? 3 : difficulty === 'normal' ? 2 : 1, total_questions: total, time_limit_seconds: difficulty === 'easy' ? 900 : difficulty === 'normal' ? 720 : 600, dialect_level: difficulty === 'easy' ? 'guided' : difficulty === 'normal' ? 'standard' : 'native', hint_limit: difficulty === 'easy' ? 3 : difficulty === 'normal' ? 1 : 0, score_multiplier: difficulty === 'easy' ? 0.8 : difficulty === 'hard' ? 1.2 : 1, config: {} }); });
    tables.victims.push({ id: victimId, episode_id: episodeId, ...spec.victim, profile: { description: spec.victim.profile } });
    spec.suspects.forEach((suspect, index) => {
      const suspectId = suspectIds[index]; const code = `${spec.code}-S${index + 1}`;
      tables.suspects.push({ id: suspectId, episode_id: episodeId, code, name: suspect.name, age: suspect.age, occupation: suspect.occupation, personality: suspect.profile, public_personality: suspect.profile, victim_relation: suspect.occupation, initial_emotion: suspect.emotion, image_url: null, public_profile: { summary: suspect.profile }, is_culprit: suspect.culprit ?? false, profile: { description: suspect.profile }, sort_order: index + 1 });
      tables.suspect_facts.push({ id: id(group, 100 + index), suspect_id: suspectId, fact_key: `${code}-FACT`, content: suspect.fact, is_public: false, sort_order: 1 });
      tables.suspect_lies.push({ id: id(group, 110 + index), suspect_id: suspectId, lie_key: `${code}-LIE`, claim: suspect.lie, truth: suspect.fact, exposure_data: {} });
      tables.suspect_response_rules.push({ id: id(group, 120 + index), suspect_id: suspectId, rule_type: 'scenario_guidance', trigger_data: {}, response_guidance: suspect.response, priority: 10 });
      tables.suspect_emotion_rules.push({ id: id(group, 130 + index), suspect_id: suspectId, trigger_type: 'interrogation', trigger_data: {}, emotion: suspect.emotion, intensity: 3 });
    });
    tables.episode_timelines.push({ id: id(group, 199), episode_id: episodeId, occurred_at: '사건 발견', title: spec.title, description: spec.synopsis, is_secret: false, visibility: 'PUBLIC_INITIAL', sort_order: 0 });
    spec.timeline.forEach(([occurred_at, description], index) => tables.episode_timelines.push({ id: id(group, 200 + index), episode_id: episodeId, occurred_at, title: description, description, is_secret: true, visibility: 'PRIVATE', sort_order: index + 1 }));
    const evidenceIds = spec.evidence.map((_, index) => id(group, 300 + index));
    spec.evidence.forEach(([title, description], index) => tables.evidence.push({ id: evidenceIds[index], episode_id: episodeId, code: `${spec.code}-E${index + 1}`, title, description, evidence_type: 'physical', metadata: {}, is_initial: index === 0, sort_order: index + 1 }));
    const clueIds = spec.clues.map((_, index) => id(group, 400 + index));
    spec.clues.forEach(([title, description], index) => {
      tables.clues.push({ id: clueIds[index], episode_id: episodeId, code: `${spec.code}-C${index + 1}`, title, description, clue_type: 'CORE', _is_core: true, metadata: {}, sort_order: index + 1 });
      const conditions: SeedRow[] = [
        { condition_type: 'EVIDENCE_VIEWED', condition_data: { evidence_id: evidenceIds[0] }, operator: 'EQ', _target_evidence_id: evidenceIds[0] },
        { condition_type: 'QUESTION_TYPE_ASKED', condition_data: { question_type: 'Q-TIME' }, operator: 'EXISTS' },
        { condition_type: 'QUESTION_TYPE_ASKED', condition_data: { question_type: 'Q-EVIDENCE' }, operator: 'EXISTS' },
        { condition_type: 'FACT_USED', condition_data: { fact_id: id(group, 100 + (index % suspectIds.length)) }, operator: 'EQ' },
        { condition_type: 'SUSPECT_INTERROGATED', condition_data: { suspect_id: culpritId }, operator: 'EXISTS', _target_suspect_id: culpritId },
        { condition_type: 'CLUE_ACQUIRED', condition_data: { clue_id: clueIds[index - 1] }, operator: 'EQ', _target_clue_id: clueIds[index - 1] }
      ];
      tables.clue_unlock_conditions.push({ id: id(group, 500 + index), clue_id: clueIds[index], group_no: 1, sort_order: 1, ...conditions[index] });
    });
    spec.dialect.forEach(([dialect_text, standard_text, usage_context], index) => tables.dialect_expressions.push({ id: id(group, 600 + index), region_id: regionId, code: `${spec.code}-D${index + 1}`, dialect_text, standard_text, meaning: standard_text, usage_context, difficulty: 2, _episode_id: episodeId, _related_clue_id: clueIds[clueIds.length - 1] }));
    [spec.endings.correct, spec.endings.wrongA, spec.endings.wrongB].forEach((narrative, index) => tables.endings.push({ id: id(group, 700 + index), episode_id: episodeId, code: `${spec.code}-${index === 0 ? 'TRUE' : `FALSE-${index}`}`, ending_type: index === 0 ? 'correct' : 'incorrect', title: index === 0 ? '정답 엔딩' : `오답 엔딩 ${index}`, narrative, conditions: { selected_suspect_id: index === 0 ? culpritId : suspectIds[index] }, _target_suspect_id: index === 0 ? culpritId : suspectIds[index], sort_order: index + 1 }));
    spec.suspects.slice(1).forEach((suspect, index) => tables.suspect_relationships.push({ id: id(group, 800 + index), suspect_id: culpritId, related_suspect_id: suspectIds[index + 1], victim_id: null, relationship_type: 'co_suspect', description: `${spec.suspects.find((item) => item.culprit)?.name}과 ${suspect.name}의 사건 내 관계` }));
  });
  return tables;
};
