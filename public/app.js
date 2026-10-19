const FEED_URL = './jobs.json';
const PAGE_SIZE = 24;
const STORAGE_KEY = 'nicole-job-radar:watchlist:v1';
const MANUAL_KEY = 'nicole-job-radar:manual-jobs:v1';
const numberFormatter = new Intl.NumberFormat('ko-KR');

const categoryNames = {
  marketing: '마케팅', advertising: '광고', translation: '번역',
  interpreting: '통역', content: '콘텐츠', other: '기타',
};
const workplaceNames = {
  remote: '원격', onsite: '출근', hybrid: '하이브리드', unknown: '근무방식 미확인',
};
const regionNames = {
  nearby: '전주·완주권', expanded: '근교·통근 확인',
  relocation: '타지역·이사/원격협의 필요', unknown: '위치 미확인',
};
const provincePatterns = [
  ['서울', /서울|seoul/i], ['부산', /부산|busan/i], ['대구', /대구|daegu/i],
  ['인천', /인천|incheon/i], ['광주', /광주|gwangju/i], ['대전', /대전|daejeon/i],
  ['울산', /울산|ulsan/i], ['세종', /세종|sejong/i],
  ['경기', /경기|gyeonggi|수원|성남|용인|고양|파주|화성|안양|평택|부천|안산|시흥|의정부|남양주|하남|광명|김포|구리|오산|안성|이천|광주\s*시/i],
  ['강원', /강원|gangwon|춘천|원주|강릉|속초|동해|삼척|태백|홍천/i],
  ['충북', /충북|충청북|chungbuk|청주|충주|제천|음성|진천|증평/i],
  ['충남', /충남|충청남|chungnam|천안|아산|서산|당진|공주|보령|논산|계룡|홍성/i],
  ['전북', /전북|전라북|jeonbuk|north\s*jeolla|전주|완주|익산|김제|군산|정읍|임실|진안|남원|부안|고창|무주|장수|순창/i],
  ['전남', /전남|전라남|jeonnam|south\s*jeolla|목포|여수|순천|광양|나주|해남|화순/i],
  ['경북', /경북|경상북|gyeongbuk|포항|경주|구미|안동|경산|영주|문경|김천|상주/i],
  ['경남', /경남|경상남|gyeongnam|창원|김해|진주|양산|거제|통영|밀양|사천/i],
  ['제주', /제주|jeju|서귀포/i],
];
const nearbyPattern = /전주|완주|jeonju|wanju/i;
const expandedPattern = /익산|김제|군산|정읍|임실|진안|남원|iksan|gimje|gunsan|jeongeup|imsil|jinan|namwon/i;
const sourceStatusNames = { ok: '정상', partial: '일부 성공', error: '오류', manual: '수동 확인', unavailable: '수집 불가', not_configured: '미설정' };
const sourceKindNames = {
  official: '공식 채용', official_ats: '기업 공식 채용시스템', official_government: '정부 공식 채용',
  public_api: '공공 API', employer: '기업 원문', aggregator: '공고 모음', manual: '직접 추가 · 미검증', platform: '플랫폼',
};

const $ = (id) => document.getElementById(id);
const state = {
  activeTab: 'online', loaded: false, loading: false, loadError: '',
  jobs: [], remoteJobs: [], manualJobs: readManualJobs(), updatedAt: null, sourceStatus: [],
  saved: readWatchlist(),
  filters: {
    online: { query: '', category: 'all', archive: 'all', languageFit: 'all', savedOnly: false, limit: PAGE_SIZE },
    offline: { query: '', category: 'all', province: 'all', region: 'all', archive: 'all', languageFit: 'all', savedOnly: false, limit: PAGE_SIZE },
  },
};

function readWatchlist() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw.filter((id) => typeof id === 'string' && id.length <= 500).slice(0, 5000) : []);
  } catch {
    return new Set();
  }
}

function readManualJobs() {
  try {
    const records = JSON.parse(localStorage.getItem(MANUAL_KEY) || '[]');
    if (!Array.isArray(records)) return [];
    return records.slice(0, 250).filter((row) => row && typeof row === 'object'
      && typeof row.id === 'string' && row.id.startsWith('manual:')
      && typeof row.title === 'string' && row.title.length > 0
      && typeof row.url === 'string' && safeUrl(row.url)
      && (row.market === 'online' || row.market === 'offline'));
  } catch { return []; }
}

function persistManualJobs() {
  try { localStorage.setItem(MANUAL_KEY, JSON.stringify(state.manualJobs)); return true; }
  catch {
    showMessage('직접 추가한 공고를 브라우저에 영구 저장할 수 없습니다. 이 페이지를 닫으면 사라질 수 있습니다.', 'warning');
    return false;
  }
}

function saveWatchlist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.saved])); }
  catch { showMessage('현재 브라우저에서 관심 공고를 영구 저장할 수 없습니다. 이 페이지를 닫으면 저장 상태가 사라질 수 있습니다.', 'warning'); }
}

function clean(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function cleanList(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean).join(' · ');
  return clean(value);
}

function safeUrl(raw) {
  const candidate = clean(raw);
  if (!candidate) return '';
  try {
    const url = new URL(candidate);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

function dateValue(raw) {
  const value = clean(raw);
  const date = value.match(/^(\d{4}-\d{2}-\d{2})(?:$|T|\s)/);
  if (!date) return '';
  const timestamp = Date.parse(`${date[1]}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date[1] ? date[1] : '';
}

function formatDate(raw, includeTime = false) {
  const value = clean(raw);
  const isoDay = dateValue(value);
  if (!isoDay) return '미표기';
  if (!includeTime || /^\d{4}-\d{2}-\d{2}$/.test(value)) return isoDay;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return isoDay;
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

function todayInKorea() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function daysSince(raw) {
  const day = dateValue(raw);
  if (!day) return null;
  const diff = (Date.parse(`${todayInKorea()}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86400000;
  return Number.isFinite(diff) ? Math.floor(diff) : null;
}

function detectLocation(location) {
  const name = clean(location);
  if (!name) return { province: 'unknown', region: 'unknown' };
  // 전국·복수 지역·근무지 협의는 출근 가능 지역을 단정할 수 없다.
  if (/전국|전지역|전 지 역|다수\s*지역|근무지\s*협의|지역\s*무관|nationwide|multiple\s*locations/i.test(name)) {
    return { province: 'unknown', region: 'unknown' };
  }
  const found = provincePatterns.filter(([, pattern]) => pattern.test(name)).map(([province]) => province);
  if (found.length !== 1) return { province: 'unknown', region: 'unknown' };
  const province = found[0];
  if (province !== '전북') return { province, region: 'relocation' };
  const near = nearbyPattern.test(name);
  const expanded = expandedPattern.test(name);
  if (near && !expanded) return { province, region: 'nearby' };
  if (expanded && !near) return { province, region: 'expanded' };
  // 전북 시·군 중 장거리 가능 지역은 통근 가능하다고 표시하지 않는다.
  if (/무주|장수|순창|부안|고창/.test(name)) return { province, region: 'relocation' };
  return { province, region: 'unknown' };
}

function resolveLocation(raw, location) {
  const inferred = detectLocation(location);
  const sourceProvince = clean(raw.province);
  const alias = {
    local: 'nearby', nearby: 'nearby', expanded: 'expanded', 'commutable-nearby': 'expanded',
    commutable_nearby: 'expanded', relocation: 'relocation', unknown: 'unknown',
  };
  const directClass = alias[clean(raw.commuteClass)] || '';
  // 수집기의 정규화 결과가 제공되면 사용하되, 근무지 자체가 비어 있는 경우에는 추정하지 않는다.
  if (directClass && clean(location)) {
    const canonicalProvince = provincePatterns.find(([name]) => sourceProvince === name || sourceProvince.startsWith(`${name}특별`) || sourceProvince.startsWith(`${name}도`));
    return { region: directClass, province: canonicalProvince?.[0] || inferred.province };
  }
  return inferred;
}

function eligibilityDisplay(value, explicitStatus, explicitDetail) {
  const object = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const status = clean(explicitStatus) || clean(object.status);
  const label = status === 'possible' ? '지원 가능성 있음' : status === 'restricted' ? '지원 제약 확인' : '지원 조건 확인 필요';
  const detailObject = explicitDetail && typeof explicitDetail === 'object' && !Array.isArray(explicitDetail) ? explicitDetail : {};
  const detail = [
    clean(explicitDetail), clean(detailObject.reason), clean(detailObject.geoScope),
    clean(object.reason), clean(object.geoScope), typeof value === 'string' ? value.trim() : '',
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' · ');
  return { label, description: detail || '자격 조건은 원문 확인', kind: status === 'possible' ? 'possible' : status === 'restricted' ? 'restricted' : 'unknown' };
}

function liveInterpreting(job) {
  if (job.category === 'interpreting') return true;
  const text = `${job.title} ${job.description}`;
  return /실시간\s*통역|동시\s*통역|순차\s*통역|전화\s*통역|화상\s*통역|현장\s*통역|통역사|live\s*interpret|simultaneous\s*interpret|consecutive\s*interpret|phone\s*interpret|video\s*interpret|remote\s*interpreter/i.test(text);
}

function normalizeJob(raw, index) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const market = clean(raw.market);
  if (market !== 'online' && market !== 'offline') return null;
  const source = clean(raw.source);
  const url = safeUrl(raw.url);
  const title = clean(raw.title);
  const id = clean(raw.id) || `${source}:${url || `${title}:${index}`}`;
  const location = clean(raw.location);
  return {
    id, market, title: title || '공고 제목 미확인', company: clean(raw.company) || '기업명 미확인',
    source: source === '고용24' ? '고용노동부 고용24 제공' : source || '출처 미확인', sourceKind: clean(raw.sourceKind), url,
    description: clean(raw.description), location,
    workplaceMode: workplaceNames[clean(raw.workplaceMode)] ? clean(raw.workplaceMode) : 'unknown',
    category: categoryNames[clean(raw.category)] ? clean(raw.category) : 'other',
    postedAt: clean(raw.postedAt), deadline: clean(raw.deadline), pay: clean(raw.pay),
    language: cleanList(raw.languageRequirements), eligibility: eligibilityDisplay(raw.eligibility, raw.eligibilityStatus, raw.eligibilityDetail),
    languageFit: ['match', 'mismatch'].includes(clean(raw.languageFitStatus)) ? clean(raw.languageFitStatus) : 'unknown',
    languageFitReason: clean(raw.languageFitReason),
    verifiedAt: clean(raw.verifiedAt), lastSeenAt: clean(raw.lastSeenAt), savedAt: clean(raw.savedAt),
    collectionState: clean(raw.collectionState) || 'unknown',
    archived: clean(raw.collectionState) === 'not_seen', manual: id.startsWith('manual:'),
    ...resolveLocation(raw, location),
  };
}

function rebuildJobs() {
  state.jobs = [...state.remoteJobs, ...state.manualJobs.map(normalizeJob).filter(Boolean)]
    .sort((a, b) => {
      // 사용자 직접 저장 공고는 게시일을 꾸미지 않고 목록 맨 위에 배치한다.
      if (a.manual !== b.manual) return a.manual ? -1 : 1;
      if (a.manual && b.manual) return b.savedAt.localeCompare(a.savedAt);
      return (dateValue(b.postedAt) || '').localeCompare(dateValue(a.postedAt) || '');
    });
}

function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function svgIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon'); svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#icon-${name}`); svg.append(use);
  return svg;
}

function infoRow(label, content, className = '') {
  const row = el('div', `detail-item ${className}`.trim());
  row.append(el('dt', '', label), el('dd', '', content));
  return row;
}

function createCard(job) {
  const card = el('article', 'job-card');
  const header = el('div', 'card-top');
  const chips = el('div', 'top-chips');
  chips.append(el('span', 'category-chip', categoryNames[job.category]));
  const age = daysSince(job.verifiedAt);
  if (age !== null) {
    const label = age < 0 ? '미래 확인일' : age <= 3 ? '최근 확인' : age <= 7 ? '7일 내 확인' : '확인일 오래됨';
    chips.append(el('span', `freshness-chip ${age > 7 ? 'is-old' : ''}`.trim(), label));
  } else {
    chips.append(el('span', 'freshness-chip is-old', '확인일 미기재'));
  }
  if (job.archived) chips.append(el('span', 'history-chip', '최근 수집에서 미확인 · 과거 기록'));
  else if (job.collectionState === 'unverified' && !job.manual) chips.append(el('span', 'history-chip is-unverified', '수집 여부 미검증'));
  if (job.manual) chips.append(el('span', 'history-chip is-manual', '직접 추가'));
  if (job.languageFit === 'mismatch') chips.append(el('span', 'language-fit-chip is-mismatch', '요구 언어 불일치 · 확인 필요'));
  else if (job.languageFit === 'match') chips.append(el('span', 'language-fit-chip is-match', '언어 요건 부합 가능'));
  const saved = state.saved.has(job.id);
  const bookmark = el('button', `bookmark-button ${saved ? 'is-saved' : ''}`.trim());
  bookmark.type = 'button'; bookmark.dataset.saveId = job.id;
  bookmark.setAttribute('aria-pressed', String(saved));
  bookmark.setAttribute('aria-label', `${job.title} 관심 공고 ${saved ? '저장 취소' : '저장'}`);
  bookmark.append(svgIcon('bookmark'), el('span', '', saved ? '저장됨' : '관심 저장'));
  bookmark.addEventListener('click', () => toggleSaved(job.id));
  header.append(chips, bookmark);

  const heading = el('h4', 'job-title', job.title);
  const company = el('p', 'job-company', job.company);
  const badges = el('div', 'job-badges');
  if (job.market === 'offline') {
    badges.append(el('span', `region-badge region-${job.region}`, regionNames[job.region]));
  }
  badges.append(el('span', 'workplace-badge', workplaceNames[job.workplaceMode]));

  const location = el('div', 'location-line');
  location.append(svgIcon('pin'), el('span', '', job.location || '위치 미기재'));

  const details = el('dl', 'job-details');
  details.append(
    infoRow('출처', job.source),
    infoRow('급여 / 보수', job.pay || '미표기'),
    infoRow('게시일', formatDate(job.postedAt)),
    infoRow('마감일', formatDate(job.deadline), dateValue(job.deadline) && dateValue(job.deadline) < todayInKorea() ? 'is-expired' : ''),
  );
  if (dateValue(job.deadline) && dateValue(job.deadline) < todayInKorea()) {
    details.lastElementChild.querySelector('dd')?.append(' (마감일 경과)');
  }

  const criteria = el('div', 'criteria');
  const eligibility = el('div', `eligibility eligibility-${job.eligibility.kind}`);
  eligibility.append(el('strong', '', job.eligibility.label), el('span', '', job.eligibility.description));
  const language = el('div', 'language');
  language.append(el('strong', '', '언어 조건'), el('span', '', [job.language || '미확인', job.languageFitReason].filter(Boolean).join(' · ')));
  criteria.append(eligibility, language);

  const description = el('div', 'description-block');
  if (job.description) {
    description.append(el('p', 'job-description', job.description));
    if (job.description.length > 200) {
      const expanded = el('details', 'description-more');
      expanded.append(el('summary', '', '상세 설명 전체 보기'), el('p', '', job.description));
      description.append(expanded);
    }
  } else {
    description.append(el('p', 'job-description is-empty', '업무 설명 미기재 · 원문에서 확인하세요.'));
  }

  const footer = el('div', 'card-footer');
  const source = el('span', 'source-kind', sourceKindNames[job.sourceKind] || job.sourceKind || '출처 유형 미확인');
  const stamp = el('span', 'verified-date', job.archived
    ? `마지막 수집 확인 ${formatDate(job.lastSeenAt || job.verifiedAt)} · 현재 채용 여부 미확인`
    : job.manual ? `직접 저장 ${formatDate(job.savedAt, true)} · 원문 미검증`
      : `자료 확인 ${formatDate(job.verifiedAt)}`);
  const meta = el('div', 'source-meta'); meta.append(source, stamp);
  footer.append(meta);
  if (job.url) {
    const link = el('a', 'job-link', '공고 원문 보기');
    link.href = job.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `${job.title} 원문 새 창에서 열기`);
    link.append(svgIcon('arrow')); footer.append(link);
  } else {
    footer.append(el('span', 'job-link is-disabled', '원문 링크 미확인'));
  }
  card.append(header, heading, company, badges, location, details, criteria, description, footer);
  return card;
}

function toggleSaved(id) {
  if (state.saved.has(id)) state.saved.delete(id);
  else state.saved.add(id);
  saveWatchlist();
  const activeButton = [...document.querySelectorAll('.bookmark-button')].find((button) => button.dataset.saveId === id);
  const focusedId = activeButton?.dataset.saveId;
  renderJobs(state.activeTab);
  if (!state.filters[state.activeTab].savedOnly && focusedId) {
    [...document.querySelectorAll('.bookmark-button')].find((button) => button.dataset.saveId === focusedId)?.focus({ preventScroll: true });
  }
}

function visibleJobs(tab) {
  const filters = state.filters[tab];
  const query = filters.query.trim().toLocaleLowerCase('ko-KR');
  return state.jobs.filter((job) => {
    if (job.market !== tab || (tab === 'online' && liveInterpreting(job))) return false;
    if (filters.category !== 'all' && job.category !== filters.category) return false;
    if (filters.languageFit !== 'all' && job.languageFit !== filters.languageFit) return false;
    if (filters.archive === 'archived' && !job.archived) return false;
    if (filters.archive === 'current' && !((job.collectionState === 'seen') || job.manual)) return false;
    if (filters.archive === 'unverified' && job.collectionState !== 'unverified' && job.collectionState !== 'unknown') return false;
    if (filters.savedOnly && !state.saved.has(job.id)) return false;
    if (tab === 'offline') {
      if (filters.region !== 'all' && job.region !== filters.region) return false;
      if (filters.province !== 'all' && job.province !== filters.province) return false;
    }
    if (!query) return true;
    return [job.title, job.company, job.source, job.description, job.location, job.pay,
      job.language, job.eligibility.description, categoryNames[job.category]]
      .some((value) => value.toLocaleLowerCase('ko-KR').includes(query));
  });
}

function emptyState(tab, anyInTab) {
  const wrapper = el('div', 'empty-state');
  const icon = el('div', 'empty-symbol', anyInTab ? '⌕' : '—');
  const title = !state.loaded ? '공고를 불러오지 못했습니다' : anyInTab ? '조건에 맞는 공고가 없습니다' : '아직 수집된 공고가 없습니다';
  const detail = !state.loaded ? '새로고침을 눌러 다시 시도하세요.' : anyInTab ? '검색어 또는 지역·분야 필터를 변경해 보세요.' : '출처별 수집 현황을 확인하거나 아래 플랫폼 링크에서 직접 검색하세요.';
  wrapper.append(icon, el('h4', '', title), el('p', '', detail));
  if (anyInTab) {
    const reset = el('button', 'reset-button', '필터 초기화');
    reset.type = 'button'; reset.addEventListener('click', () => resetFilters(tab));
    wrapper.append(reset);
  }
  return wrapper;
}

function renderJobs(tab) {
  const list = $(`list-${tab}`);
  const filtered = visibleJobs(tab);
  const count = state.jobs.filter((job) => job.market === tab && (tab !== 'online' || !liveInterpreting(job))).length;
  const limit = state.filters[tab].limit;
  const shown = filtered.slice(0, limit);
  const fragment = document.createDocumentFragment();
  if (!shown.length) fragment.append(emptyState(tab, count > 0));
  else shown.forEach((job) => fragment.append(createCard(job)));
  list.replaceChildren(fragment);
  $(`tab-count-${tab}`).textContent = numberFormatter.format(count);
  $(`count-${tab}`).textContent = state.loaded
    ? `전체 ${numberFormatter.format(count)}건 중 ${numberFormatter.format(filtered.length)}건${filtered.length > limit ? ` · ${numberFormatter.format(shown.length)}건 표시` : ''}`
    : '공고를 불러오지 못했습니다.';
  const more = $(`more-${tab}`);
  more.hidden = filtered.length <= limit;
  if (!more.hidden) more.textContent = `공고 ${numberFormatter.format(Math.min(PAGE_SIZE, filtered.length - limit))}건 더 보기`;
}

function renderSources() {
  const list = $('source-list');
  const fragment = document.createDocumentFragment();
  const rows = state.sourceStatus;
  if (!rows.length) {
    fragment.append(el('li', 'source-empty', '출처별 상태 정보가 제공되지 않았습니다.'));
  }
  rows.forEach((raw) => {
    if (!raw || typeof raw !== 'object') return;
    const status = clean(raw.status);
    const item = el('li', 'source-row');
    const line = el('div', 'source-row-main');
    const name = el('strong', '', clean(raw.source) || '출처 미확인');
    const statusLabel = el('span', `source-state source-${sourceStatusNames[status] ? status : 'unknown'}`, sourceStatusNames[status] || '미확인');
    line.append(name, statusLabel);
    const info = el('p', 'source-row-sub', [
      Number.isSafeInteger(raw.count) && raw.count >= 0 ? `${numberFormatter.format(raw.count)}건` : '',
      `확인 ${formatDate(raw.checkedAt, true)}`,
      clean(raw.message) || clean(raw.detail),
    ].filter(Boolean).join(' · '));
    item.append(line, info);
    const url = safeUrl(raw.url);
    if (url) {
      const link = el('a', 'source-url', '출처 사이트 열기 ↗');
      link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      item.append(link);
    }
    fragment.append(item);
  });
  list.replaceChildren(fragment);
  const normal = rows.filter((r) => r?.status === 'ok').length;
  const other = rows.length - normal;
  $('source-summary').textContent = rows.length ? `정상 ${normal} · 기타 ${other}` : '상태 정보 없음';
}

function renderManualJobs() {
  const list = $('manual-saved-list');
  const fragment = document.createDocumentFragment();
  $('manual-count').textContent = `저장 ${numberFormatter.format(state.manualJobs.length)}건`;
  if (!state.manualJobs.length) {
    fragment.append(el('p', 'manual-empty', '직접 추가한 공고가 아직 없습니다.'));
  }
  state.manualJobs.forEach((job) => {
    const row = el('div', 'manual-saved-row');
    const info = el('div', 'manual-saved-info');
    const a = el('a', '', clean(job.title));
    a.href = safeUrl(job.url); a.target = '_blank'; a.rel = 'noopener noreferrer';
    info.append(a, el('small', '', `${job.market === 'online' ? '온라인' : '오프라인'} · ${clean(job.company) || '회사명 미확인'}`));
    const remove = el('button', 'manual-remove', '삭제');
    remove.type = 'button'; remove.setAttribute('aria-label', `${clean(job.title)} 직접 추가 기록 삭제`);
    remove.addEventListener('click', () => {
      if (!window.confirm(`'${clean(job.title)}' 공고를 직접 추가 목록에서 삭제하시겠습니까?`)) return;
      state.manualJobs = state.manualJobs.filter((record) => record.id !== job.id);
      state.saved.delete(job.id);
      persistManualJobs(); saveWatchlist(); rebuildJobs(); render();
      $('manual-feedback').textContent = '직접 추가한 공고를 삭제했습니다.';
    });
    row.append(info, remove); fragment.append(row);
  });
  list.replaceChildren(fragment);
}

function addManualJob(event) {
  event.preventDefault();
  const feedback = $('manual-feedback');
  feedback.classList.remove('is-error'); feedback.textContent = '';
  const title = $('manual-title').value.trim();
  const url = safeUrl($('manual-url').value);
  const company = $('manual-company').value.trim();
  const market = $('manual-market').value;
  const category = $('manual-category').value;
  const location = $('manual-location').value.trim();
  const description = $('manual-description').value.trim();
  const reject = (message) => { feedback.classList.add('is-error'); feedback.textContent = message; };
  if (!title || !url) { reject('공고 제목과 유효한 http(s) URL을 입력해 주세요.'); return; }
  if (market === 'online' && liveInterpreting({ category, title, description })) {
    reject('실시간 통역 공고는 온라인 목록에서 제외합니다. 직무를 다시 확인해 주세요.'); return;
  }
  if (state.manualJobs.length >= 250) { reject('직접 저장은 최대 250건까지 가능합니다.'); return; }
  if (state.manualJobs.some((job) => safeUrl(job.url) === url)) {
    reject('이미 직접 저장한 공고 URL입니다.'); return;
  }
  const unique = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const record = {
    id: `manual:${unique}`, title, url, company, market, category, location, description,
    source: '직접 추가(Upwork 등)', sourceKind: 'manual', workplaceMode: market === 'online' ? 'unknown' : 'unknown',
    postedAt: '', deadline: '', verifiedAt: '', pay: '', languageRequirements: [],
    eligibilityStatus: 'unknown', eligibilityDetail: '직접 저장한 링크로, 자격 정보는 원문에서 확인해야 합니다.',
    collectionState: 'seen', savedAt: new Date().toISOString(),
  };
  state.manualJobs.unshift(record);
  state.saved.add(record.id);
  const stored = persistManualJobs();
  saveWatchlist(); rebuildJobs(); render();
  $('manual-form').reset();
  feedback.textContent = stored
    ? `${market === 'online' ? '온라인' : '오프라인'} 목록에 관심 공고를 저장했습니다. 해당 탭에서 확인하세요.`
    : '현재 화면에는 추가했지만 브라우저에 영구 저장하지 못했습니다.';
}

function showMessage(text, kind = 'info') {
  const message = $('feed-message');
  message.textContent = text; message.dataset.kind = kind; message.hidden = !text;
}

function render() {
  $('feed-date').textContent = state.loaded ? `데이터 갱신 ${formatDate(state.updatedAt, true)}` : '공고 데이터 미확인';
  renderJobs('online'); renderJobs('offline'); renderSources();
  renderManualJobs();
}

async function loadFeed() {
  if (state.loading) return;
  state.loading = true; $('refresh-button').disabled = true;
  if (!state.loaded) showMessage('공고 데이터를 확인하고 있습니다.', 'info');
  try {
    const response = await fetch(FEED_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const feed = await response.json();
    if (!feed || !Array.isArray(feed.jobs) || !Array.isArray(feed.sourceStatus)) throw new Error('데이터 형식이 올바르지 않습니다.');
    state.remoteJobs = feed.jobs.map(normalizeJob).filter(Boolean);
    rebuildJobs();
    state.updatedAt = clean(feed.updatedAt);
    state.sourceStatus = feed.sourceStatus;
    state.loaded = true; state.loadError = '';
    const problems = state.sourceStatus.filter((row) => ['error', 'unavailable', 'partial', 'not_configured'].includes(row?.status));
    if (problems.length) showMessage(`일부 출처(${problems.length}곳)의 수집이 불완전하거나 설정되지 않았습니다. 출처 현황에서 확인하세요.`, 'warning');
    else if (!state.updatedAt) showMessage('데이터 업데이트 시점이 미확인되었습니다. 공고 원문에서 최신 상태를 확인하세요.', 'warning');
    else showMessage('', 'info');
  } catch (error) {
    state.loadError = error instanceof Error ? error.message : '알 수 없는 오류';
    showMessage(state.loaded
      ? `새 공고를 불러오지 못했습니다. 이전 데이터를 표시합니다. (${state.loadError})`
      : `공고 파일을 불러오지 못했습니다. 서버의 jobs.json 배포 상태를 확인하세요. (${state.loadError})`, 'error');
  } finally {
    state.loading = false; $('refresh-button').disabled = false; render();
  }
}

function switchTab(tab, moveFocus = false) {
  state.activeTab = tab;
  for (const current of ['online', 'offline']) {
    const active = current === tab;
    const button = $(`tab-${current}`);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    $(`panel-${current}`).hidden = !active;
  }
  if (moveFocus) $(`tab-${tab}`).focus();
}

function resetFilters(tab) {
  const defaultFilters = tab === 'online'
    ? { query: '', category: 'all', archive: 'all', languageFit: 'all', savedOnly: false, limit: PAGE_SIZE }
    : { query: '', category: 'all', province: 'all', region: 'all', archive: 'all', languageFit: 'all', savedOnly: false, limit: PAGE_SIZE };
  state.filters[tab] = defaultFilters;
  $(`search-${tab}`).value = '';
  $(`category-${tab}`).value = 'all';
  $(`archive-${tab}`).value = 'all';
  $(`language-fit-${tab}`).value = 'all';
  $(`saved-${tab}`).checked = false;
  if (tab === 'offline') {
    $('province-offline').value = 'all';
    document.querySelectorAll('[data-region]').forEach((button) => {
      const active = button.dataset.region === 'all';
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  renderJobs(tab);
}

function setupListeners() {
  const tabs = [...document.querySelectorAll('[role="tab"][data-tab]')];
  tabs.forEach((button) => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const target = event.key === 'Home' ? 'online' : event.key === 'End' ? 'offline'
          : state.activeTab === 'online' ? 'offline' : 'online';
        switchTab(target, true);
      }
    });
  });
  for (const tab of ['online', 'offline']) {
    const filters = state.filters[tab];
    $(`search-${tab}`).addEventListener('input', (event) => {
      filters.query = event.target.value; filters.limit = PAGE_SIZE; renderJobs(tab);
    });
    $(`category-${tab}`).addEventListener('change', (event) => {
      filters.category = event.target.value; filters.limit = PAGE_SIZE; renderJobs(tab);
    });
    $(`archive-${tab}`).addEventListener('change', (event) => {
      filters.archive = event.target.value; filters.limit = PAGE_SIZE; renderJobs(tab);
    });
    $(`language-fit-${tab}`).addEventListener('change', (event) => {
      filters.languageFit = event.target.value; filters.limit = PAGE_SIZE; renderJobs(tab);
    });
    $(`saved-${tab}`).addEventListener('change', (event) => {
      filters.savedOnly = event.target.checked; filters.limit = PAGE_SIZE; renderJobs(tab);
    });
    $(`more-${tab}`).addEventListener('click', () => {
      filters.limit += PAGE_SIZE; renderJobs(tab);
    });
  }
  $('province-offline').addEventListener('change', (event) => {
    state.filters.offline.province = event.target.value;
    state.filters.offline.limit = PAGE_SIZE; renderJobs('offline');
  });
  document.querySelectorAll('[data-region]').forEach((button) => {
    button.addEventListener('click', () => {
      state.filters.offline.region = button.dataset.region;
      state.filters.offline.limit = PAGE_SIZE;
      document.querySelectorAll('[data-region]').forEach((other) => {
        const active = other === button;
        other.setAttribute('aria-pressed', String(active));
        other.classList.toggle('is-selected', active);
      });
      renderJobs('offline');
    });
  });
  $('refresh-button').addEventListener('click', loadFeed);
  $('manual-form').addEventListener('submit', addManualJob);
}

setupListeners();
rebuildJobs();
render();
loadFeed();
