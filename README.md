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

KOWORK robots.txt에서는 공개 공고 URL을 허용하지만, 공식 약관 https://kowork.kr/en/terms 는 DB 기계적 대량 크롤링·미러링과 무단 재게시를 제한합니다. 개별 공고에는 무단전재·재배포·재가공 금지 고지도 있습니다. 따라서 사이트맵에 공개된 637개 공고 링크를 일괄 수집해 대시보드에 재게시하지 않습니다. 이는 현재 모집 공고 637개를 뜻하지도 않습니다.

KOWORK 자동 연동을 위한 현실적인 방법은 운영사 master@kowork.kr 에 게시물 메타데이터·직접 링크 표시 권한, API 또는 제휴 데이터 제공, 업데이트 빈도, 만료 처리 및 저작권 표시 조건을 서면으로 문의한 뒤 승인된 범위만 구현하는 것입니다. 허가 전에는 공식 검색으로 연결하고 사용자가 직접 확인한 개별 URL을 브라우저에 수동 저장하도록 합니다.

한울타리, JOBPLOY, PeopleNJob 역시 무단 복제/재게시 또는 로봇 접근 제한이 확인되어 공식 원문 검색 링크만 제공합니다. K-WORK는 외국인 인재 공공 채용 서비스지만 개별 공고의 한국어·비자 요구조건을 확인해야 합니다. 잡코리아 공식 API https://www.jobkorea.co.kr/service/api 는 신청·승인이 필요합니다. 승인 전 실제 수집 건수로 집계하지 않습니다.

## 사용자 데이터·배포

개인 관심 저장, 공고/회사/출처 숨김, 수동 등록은 브라우저 localStorage에만 저장됩니다. 예전 Nicole Job Radar의 저장 항목은 유지하도록 구형 저장소 키를 변경하지 않았습니다. 사이트 경로만 변경되므로 같은 GitHub Pages 도메인에서 기존 저장 정보를 사용할 수 있습니다. PC-휴대폰 간 자동 동기화는 지원하지 않습니다.

공개 저장소: https://github.com/ostrichick/dubu-job-radar
사이트: https://ostrichick.github.io/dubu-job-radar/
GitHub Pages Actions는 6시간 간격으로 테스트·공식 API 새로고침·사이트 배포를 수행합니다. KOWORK 등에 무단으로 자동 요청하지 않습니다.

주 소스 경로는 C:\Projects\DigitalNomad\nicole-job-radar이며, 디렉터리 이름을 변경하지 않아도 공개 서비스 이름은 Dubu Job Radar입니다. 상위 저장소의 다른 개인 프로젝트는 공개 배포 저장소에 함께 밀어 넣지 않습니다.
