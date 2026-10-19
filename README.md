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

## 외국인 채용 플랫폼 — KOWORK 최우선

KOWORK: https://kowork.kr/en
KOWORK 스페인어 검색: https://kowork.kr/en?keyword=spanish
K-WORK: https://k-work.or.kr/empmnInfo/empmn/list.do
한울타리: https://mcfamily.or.kr/en/jobs/opening
JOBPLOY: https://www.jobploy.kr/en
PeopleNJob 신입 공고: https://www.peoplenjob.com/jobs?career_level=1

KOWORK 공개 SSR 목록과 소수의 공개 상세 URL을 실제로 확인하는 최소 정보 수집기가 활성화되었습니다 (scripts/collect-kowork.mjs). 매 갱신마다 공개 목록 1페이지, 공개 상세 최대 6개만 순차 요청하며 요청 간 약 1.1초 간격을 둡니다. 제목·회사·근무지역·원본 URL과 간략한 출처 정보만 저장합니다. 원문 본문·이미지·개인 지원자 정보는 저장하지 않으며, 로그인이나 robots.txt에서 금지한 /api/ 경로에 접근하지 않습니다. 이 정보가 올라가는 GitHub Pages는 공개 사이트이므로 완전한 사적 로컬 수집과는 다릅니다.

사이트맵 전체를 한 번에 수집하거나 대규모로 미러링하지 않습니다. 더 넓은 KOWORK 데이터가 필요하면 운영사 master@kowork.kr 에 API·제휴 데이터 공급을 문의해야 합니다. 모집 상태·한국어 요구 수준·지원자격은 언제든 바뀔 수 있으므로 각 공고의 직접 링크에서 최종 확인합니다. 수동 저장 기능도 유지합니다.

한울타리, JOBPLOY, PeopleNJob 역시 무단 복제/재게시 또는 로봇 접근 제한이 확인되어 공식 원문 검색 링크만 제공합니다. K-WORK는 외국인 인재 공공 채용 서비스지만 개별 공고의 한국어·비자 요구조건을 확인해야 합니다. 잡코리아 공식 API https://www.jobkorea.co.kr/service/api 는 신청·승인이 필요합니다. 승인 전 실제 수집 건수로 집계하지 않습니다.

## 사용자 데이터·배포

개인 관심 저장, 공고/회사/출처 숨김, 수동 등록은 브라우저 localStorage에만 저장됩니다. 예전 Nicole Job Radar의 저장 항목은 유지하도록 구형 저장소 키를 변경하지 않았습니다. 사이트 경로만 변경되므로 같은 GitHub Pages 도메인에서 기존 저장 정보를 사용할 수 있습니다. PC-휴대폰 간 자동 동기화는 지원하지 않습니다.

공개 저장소: https://github.com/ostrichick/dubu-job-radar
사이트: https://ostrichick.github.io/dubu-job-radar/
GitHub Pages Actions는 6시간 간격으로 테스트·공식 API 새로고침·사이트 배포를 수행합니다. KOWORK 공개 목록 1페이지와 최대 6개 공개 상세 페이지만 제한적으로 확인합니다. 공개 HTML이 변경되거나 수집이 막히면 우회하지 않고 출처 상태에 오류를 기록합니다.

주 소스 경로는 C:\Projects\DigitalNomad\nicole-job-radar이며, 디렉터리 이름을 변경하지 않아도 공개 서비스 이름은 Dubu Job Radar입니다. 상위 저장소의 다른 개인 프로젝트는 공개 배포 저장소에 함께 밀어 넣지 않습니다.
