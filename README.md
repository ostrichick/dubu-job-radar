# Dubu Job Radar

아내의 실제 취업 가능성을 우선해 전주·완주 및 한국 전국의 오프라인 채용과 한국 거주자가 지원할 가능성이 있는 원격 업무를 별도 탭에서 조사하는 영어 UI 채용 레이더입니다. 공고 수가 많다는 것과 지원 가능하다는 것은 구별합니다.

## 실행과 검증

Node.js 22 이상. npm.cmd run refresh로 공개 API 데이터를 갱신하고 npm.cmd run check 및 npm.cmd run test:e2e로 검증합니다. npm.cmd start는 localhost:4380에서 정적 페이지를 엽니다.

## 수집 범위

- 온라인: Remotive, Jobicy, Remote OK, Arbeitnow 공식 공개 API. 해외 거주 제한, 지원할 수 없는 필수 언어, 실시간 통역, 5년 이상 경력 필수 직무를 가능한 범위에서 제외합니다.
- 한국 오프라인: 공식 채용 ATS Greenhouse의 KRAFTON 및 Appier, Lever의 ShopBack·Xsolla·Channel Corp.·Match Group, Ashby의 Sahara AI·Plaud. 한국 근무지가 명시된 공고를 우선하며, 신입 경력·한국어 요구사항을 검토합니다. 90일 초과 오래된 게시물을 자동 보존하지 않으며, 정확한 지원 자격은 원문 확인이 필요합니다.
- 고용24는 사용자 요청에 따라 기본 수집에서 제외했습니다. 외국인 대상 구직과 직접 관련되는 소스를 우선합니다.
- 출근형 공고는 전주·완주, 익산·김제, 그 밖의 국내 지역(이사/근무형태 협의 필요), 위치 미확인으로 구분합니다. 실제 통근 시간은 계산하지 않습니다.
- 데이터의 공고 상태 seen은 이번 수집에서 URL이 발견됐다는 의미이고, 지원 가능이나 마감 전을 보장하지 않습니다. 과거에만 등장한 URL은 이전 확인 시점을 명시합니다.
- 날짜 표시: `Posted`는 원문 게시일(원문에 없으면 미상), `Added to Radar`는 레이더 최초 등록일, 자동 수집 공고의 `Last collected`는 실제 공개 수집에서 마지막으로 발견한 날짜입니다. 수동 원문 조사 공고는 별도로 `Source last reviewed`(사람/AI가 원문을 실제 열어 본 날짜)와 `Last included in feed`(자동 갱신에서 기존 연구 데이터를 다시 반영한 날짜)를 표시합니다. 후자는 원문 재검수 날짜가 아니며, 어떤 날짜도 현재 채용 보장을 뜻하지 않습니다.

## 외국인 채용 플랫폼 — KOWORK 최우선

KOWORK: https://kowork.kr/en
KOWORK 스페인어 검색: https://kowork.kr/en?keyword=spanish
K-WORK: https://k-work.or.kr/empmnInfo/empmn/list.do
한울타리: https://mcfamily.or.kr/en/jobs/opening
JOBPLOY: https://www.jobploy.kr/en
PeopleNJob 신입 공고: https://www.peoplenjob.com/jobs?career_level=1

전주교차로 지역 채용: https://m.gyocharo.com/job/job_main.do (전주·완주 현장 공고. 개별 페이지를 확인한 공고만 수동 등록하며, '상시채용' 표시가 고용주의 현재 채용 확정을 의미하지는 않습니다.)
전주교차로 사무직 탐색: https://m.gyocharo.com/job/job_list.do?codename=office
사람인 지역 원문: https://www.saramin.co.kr (2026-10-22 전주 콘텐츠·마케팅 개별 공고 확인; 게시 시작일을 별도 검증 없는 작성일로 쓰지 않음.)

KOWORK 공개 SSR 목록과 소수의 공개 상세 URL을 실제로 확인하는 최소 정보 수집기가 활성화되었습니다 (scripts/collect-kowork.mjs). 매 갱신마다 공개 목록 1페이지, 공개 상세 최대 6개만 순차 요청하며 요청 간 약 1.1초 간격을 둡니다. 제목·회사·근무지역·원본 URL과 간략한 출처 정보만 저장합니다. 원문 본문·이미지·개인 지원자 정보는 저장하지 않으며, 로그인이나 robots.txt에서 금지한 /api/ 경로에 접근하지 않습니다. 이 정보가 올라가는 GitHub Pages는 공개 사이트이므로 완전한 사적 로컬 수집과는 다릅니다.

사이트맵 전체를 한 번에 수집하거나 대규모로 미러링하지 않습니다. 더 넓은 KOWORK 데이터가 필요하면 운영사 master@kowork.kr 에 API·제휴 데이터 공급을 문의해야 합니다. 모집 상태·한국어 요구 수준·지원자격은 언제든 바뀔 수 있으므로 각 공고의 직접 링크에서 최종 확인합니다. 수동 저장 기능도 유지합니다.

한울타리, JOBPLOY, PeopleNJob 역시 무단 복제/재게시 또는 로봇 접근 제한이 확인되어 공식 원문 검색 링크만 제공합니다. K-WORK는 외국인 인재 공공 채용 서비스지만 개별 공고의 한국어·비자 요구조건을 확인해야 합니다. 잡코리아 공식 API https://www.jobkorea.co.kr/service/api 는 신청·승인이 필요합니다. 승인 전 실제 수집 건수로 집계하지 않습니다.

## 사용자 데이터·배포

## ChatGPT 수동 리서치 수집

ChatGPT에게 개별 플랫폼에서 공고를 조사하도록 요청하면, 공개 원문 URL을 열어 한국 거주 지원 가능 여부·한국어 고급 필수 여부·경력 5년 이상 필수 여부·영어 요구사항·마감일을 확인한 후 config/research-jobs.json에 사람이 검토한 짧은 자체 요약과 근거 날짜만 등록할 수 있습니다. 등록된 자료는 scripts/curated-research.mjs에서 기존 자동 API 데이터와 중복 제거하며, 원문 전체·사진·개인 연락처를 옮겨 적지 않습니다. 별도 ChatGPT 대화가 실행되거나 자동으로 웹을 조사한다는 뜻은 아닙니다.

현재 조사 예시:
- SNOW 공식 채용, 남미 콘텐츠 마케팅 체험형 인턴 (https://recruit.snowcorp.com/rcrt/view.do?annoId=30005557&lang=ko), 2026-10-22 접수 마감. 스페인어 원어민 강점과 맞지만 영상·이미지 편집/숏폼 제작 실력 필수.
- SNOW 공식 채용, 남미(스페인어권) 콘텐츠 마케터 계약직 (https://recruit.snowcorp.com/rcrt/view.do?annoId=30005516&lang=ko), 2026-10-21 접수 마감. 6개월 계약, 콘텐츠 직접 제작 역량 필수.
- KOWORK, 한수나텍 스페인어 화자 유튜브 출연 (https://kowork.kr/en/post/3175), 대전 촬영 시급 3만5000원 표기·한국어 불필요·영어로 설명 필수. 현재 모집 확인 필요.
- KOncierge 공식 채용, Growth Marketing Intern (https://koncierge.kr/ko/careers/growth-intern), 한국어 우대·영어 필수, 하이브리드 가능. 과거 시작일과 채용중 배지가 공존해 최신 모집 여부 확인 필요.
- 서울 다문화가족 포털 Hanultari, Chingu Mobile 스페인어·영어 온라인팀 (https://mcfamily.or.kr/en/jobs/opening/14881), 2026-11-06 마감 공고·신입 가능·영어 고객응대 필수.
- KOWORK, The Founders(Anua) 글로벌 마케팅 시딩 인턴 (https://kowork.kr/en/post/1924), 스페인어·프랑스어·아랍어 중 하나 가능·필수 고경력 미명시·현재 모집 여부 미확인.
- KOWORK, MyRealTrip Overseas Marketing Intern (https://kowork.kr/en/post/4264), 스페인어 관련 시장조사·콘텐츠 현지화·광고 카피. 기존 유효 체류자격과 한국어 또는 영어 의사소통 필요, 마감일 미표시.
- KOWORK, EStar E-commerce Marketing Intern (https://kowork.kr/en/post/7322), 스페인어 필수·한국어 우대(필수 아님)·세전 월 250만 원·모집 여부 미확인.
- JOBPLOY, Cellimax Global MD (Spain) Intern (https://www.jobploy.kr/en/recruit/retailservice-seoul-global-md-intern-spain-intern), 세전 월 300만 원·2026-10-31 마감·언어/비자 요건 추가 확인 필요.
- Hanultari, Art Korea English/Spanish-speaking Sales Staff (https://mcfamily.or.kr/en/jobs/opening/14986), 경력 불필요·영어/스페인어 고객 응대·마케팅이 아닌 인접 외국어 직무.

수동으로 재확인하지 않은 리서치는 30일 경과 시 표시 대상에서 제외되고, 명시된 마감일이 지나면 자동 제외됩니다. GitHub Actions 6시간 갱신은 이 파일을 다시 읽을 뿐, 원문을 다시 검수했다고 표시하지 않습니다. 기존 KOWORK/기업 ATS 자동 수집은 별도로 유지합니다. 다른 출처의 후보를 추가할 때는 공식 원문·검증 시각·근무방식·지리적 제한·필수 언어·지원경력과 자체 작성 요약을 기록해야 합니다.

개인 관심 저장, 공고/회사/출처 숨김, 수동 등록은 브라우저 IndexedDB `dubu-job-radar`에 저장됩니다. 각 동작을 최신 상태에 하나의 트랜잭션으로 적용하며 여러 탭은 BroadcastChannel 또는 storage/focus 알림으로 동기화합니다. 저장 성공 후 화면에 반영하고 실패하면 기존 상태를 유지합니다. 예전 Nicole Job Radar의 localStorage 키는 최초 한 번 자동 이전하며 원본은 삭제하거나 이중 갱신하지 않습니다. IndexedDB가 열리지 않으면 기존에 읽을 수 있는 상태와 피드를 읽기 전용으로 표시합니다. 구버전 롤백은 최초 이전 당시 localStorage만 읽으므로 이전 후 상태가 자동 역이전되지는 않습니다. 사이트 경로만 변경되므로 같은 GitHub Pages 도메인에서 기존 저장 정보를 사용할 수 있습니다. PC-휴대폰 간 자동 동기화는 지원하지 않습니다.

공개 저장소: https://github.com/ostrichick/dubu-job-radar
사이트: https://ostrichick.github.io/dubu-job-radar/
GitHub Pages Actions는 6시간 간격으로 테스트·공식 API 새로고침·사이트 배포를 수행합니다. KOWORK 공개 목록 1페이지와 최대 6개 공개 상세 페이지만 제한적으로 확인합니다. 공개 HTML이 변경되거나 수집이 막히면 우회하지 않고 출처 상태에 오류를 기록합니다.

주 소스 경로는 C:\Projects\DigitalNomad\nicole-job-radar이며, 디렉터리 이름을 변경하지 않아도 공개 서비스 이름은 Dubu Job Radar입니다. 상위 저장소의 다른 개인 프로젝트는 공개 배포 저장소에 함께 밀어 넣지 않습니다.

## 2026-10-19 안정성 보완

- 같은 원문 공고가 KOWORK 목록에서 수동 조사로 보강돼도 `legacyIds`로 관심·숨김을 승계합니다. 과거 KOWORK ID도 URL에서 복원합니다.
- 한국어 고급 수준의 필수조건과 우대/선택/필수 아님을 구별합니다. 별도 문장의 필수조건은 계속 제외합니다.
- E2E의 달력을 고정하고 3일·7일 경계, 동시 저장/해제·숨김 복구·수동 등록·저장 실패를 검사합니다.
- 24시간 넘게 갱신되지 않은 피드는 화면에 경고합니다. `Monitor published feed`는 배포 실행 완료 후 및 6시간 간격으로 공개 피드의 HTTP 응답·형식·시각을 독립 검사합니다. 실패는 Actions 실패 및 요약에 남으며 이메일/앱 알림은 사용자의 GitHub 알림 설정에 따릅니다.
- `node scripts/check-feed-health.mjs https://ostrichick.github.io/dubu-job-radar/jobs.json`으로 수동 점검할 수 있습니다.
