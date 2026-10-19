import { createHash } from 'node:crypto';

const ROLE_RULES = [
  { category: 'translation', re: /\b(translat(?:e|es|ed|ion|ions|or|ors|ing)|locali[sz](?:ation|e|ing|ed|er|ers)|language\s+(?:quality|review|qa|specialist)|linguist|subtitl(?:e|es|ing|er)|proofread(?:er|ing)?)\b|번역|현지화|교정|traducci[oó]n|traductor(?:a)?|traducir|localizaci[oó]n/i },
  { category: 'advertising', re: /\b(advertis(?:ing|ement|ements|er)|ads?\s+(?:ops|operations|campaigns?|specialist|manager|buyer|buying)|paid\s+(?:media|social|search|ads?|acquisition)|media\s+buy(?:er|ing)|ppc|programmatic|performance\s+market(?:er|ing)|google\s+ads?|meta\s+ads?)\b|광고|퍼포먼스\s*마케팅|publicidad|anuncios?\s+digitales?/i },
  { category: 'marketing', re: /\b(marketing|marketer|growth\s+(?:specialist|manager|marketing|associate)|seo|sem|crm|social\s+media\s+(?:manager|specialist|strategist|coordinator)|brand\s+(?:manager|strategist|marketing)|email\s+marketing|demand\s+generation|campaign\s+manager|community\s+manager|digital\s+campaigns?)\b|마케팅|브랜드\s*관리|mercadotecnia|mercadeo|m[aá]rketing/i },
  { category: 'content', re: /\b(content\s+(?:creat(?:or|ion)|writer|editor|strategist|manager|marketing|producer|specialist|coordinator|moderator)|copywrit(?:er|ing)|social\s+(?:content|media\s+content)|video\s+editor|editorial\s+(?:writer|specialist|manager)|newsletter\s+(?:writer|editor)|ugc\s+creator)\b|콘텐츠\s*(?:제작|기획|마케팅|에디터)|카피라이터|redactor(?:a)?\s+de\s+contenidos?|creaci[oó]n\s+de\s+contenido/i }
];

const INTERPRETING_RE = /\b(interpreter|interpreters|interpreting|interpretation\s+(?:services?|specialist)|simultaneous\s+translation|consecutive\s+translation|live\s+interpretation)\b|통역|int[eé]rprete|interpretaci[oó]n/i;
const SPANISH_RE = /\b(spanish|espa[nñ]ol|castilian|latam|latin\s+american)\b|스페인어/i;
const KOREAN_RE = /\b(korean|hangul)\b|한국어|한국말/i;
const ENGLISH_RE = /\b(english|anglophone|englisch)\b|영어/i;
const GERMAN_RE = /\b(german|deutsch|deutschkenntnisse)\b|독일어/i;
const FRENCH_RE = /\b(french|fran[cç]ais|franz[oö]sisch)\b|프랑스어/i;
const REQUIREMENT_RE = /\b(required|mandatory|must\s+(?:speak|be|have)|fluency\s+in|fluent\s+in|native\s+(?:speaker|level)|proficien(?:t|cy)|bilingual|written\s+and\s+spoken|kenntnisse|niveau|verhandlungssicher(?:e|em|er|es)?|sehr\s+gut(?:e|es)?|c1|c2)\b|필수|능통|requerido|imprescindible|fluido|indispensable/i;

const LANGUAGE_RULES = [
  { code: 'es', name: 'Spanish', re: SPANISH_RE },
  { code: 'ko', name: 'Korean', re: KOREAN_RE },
  { code: 'en', name: 'English', re: ENGLISH_RE },
  { code: 'de', name: 'German', re: GERMAN_RE },
  { code: 'fr', name: 'French', re: FRENCH_RE },
  { code: 'he', name: 'Hebrew', re: /\bhebrew\b|히브리어/i },
  { code: 'my', name: 'Burmese', re: /\b(burmese|myanmar\s+language)\b|버마어|미얀마어/i },
  { code: 'ja', name: 'Japanese', re: /\bjapanese\b|일본어/i },
  { code: 'zh', name: 'Chinese', re: /\b(?:mandarin|cantonese|chinese)\b|중국어/i },
  { code: 'pt', name: 'Portuguese', re: /\bportuguese\b|포르투갈어/i },
  { code: 'ar', name: 'Arabic', re: /\barabic\b|아랍어/i },
  { code: 'hi', name: 'Hindi', re: /\bhindi\b|힌디어/i },
  { code: 'th', name: 'Thai', re: /\bthai\b|태국어/i },
  { code: 'vi', name: 'Vietnamese', re: /\bvietnamese\b|베트남어/i },
  { code: 'id', name: 'Indonesian', re: /\bindonesian\b|인도네시아어/i },
  { code: 'ru', name: 'Russian', re: /\brussian\b|러시아어/i },
  { code: 'it', name: 'Italian', re: /\bitalian\b|이탈리아어/i },
  { code: 'tr', name: 'Turkish', re: /\bturkish\b|튀르키예어|터키어/i },
];

export function stripHtml(value) {
  const s = String(value ?? '');
  return s
    .replace(/<(script|style|svg|iframe|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(x[0-9a-f]+|\d+);?/gi, (_full, number) => {
      const n = number.toLowerCase().startsWith('x') ? parseInt(number.slice(1), 16) : Number(number);
      return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : ' ';
    })
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/gi, (_full, name) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" })[name.toLowerCase()] ?? ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

export function safeText(value, length = 1000) {
  return stripHtml(value).slice(0, length);
}

export function safePublicUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || !host.includes('.') ||
        host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') ||
        /^\d+(?:\.\d+){3}$/.test(host) || host.includes(':')) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ref_src$)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch { return null; }
}

export function isoDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const timestamp = typeof value === 'number' && Number.isFinite(value)
    ? (value < 1e11 ? value * 1000 : value)
    : Date.parse(String(value));
  if (!Number.isFinite(timestamp) || timestamp < Date.UTC(2000, 0, 1) || timestamp > Date.now() + 86400_000) return null;
  return new Date(timestamp).toISOString();
}

export function classifyRole({ title = '', description = '', categories = [], market = 'online' }) {
  const heading = safeText(title, 300);
  const tags = (Array.isArray(categories) ? categories : [categories]).filter(Boolean).join(' ');
  const supporting = safeText(tags, 500);
  const body = safeText(description, 3000);
  if (market === 'online' && (INTERPRETING_RE.test(heading) || (INTERPRETING_RE.test(supporting) && !ROLE_RULES[0].re.test(heading)))) return null;
  if (market === 'offline' && INTERPRETING_RE.test(heading)) return 'interpreting';
  const headingMatch = ROLE_RULES.find(({ re }) => re.test(heading));
  if (headingMatch) return headingMatch.category;
  // Generic titles can be considered only with a strong provider category and related body.
  if (/\b(coordinator|specialist|associate|manager|consultant|assistant|intern|analyst|freelancer|contractor)\b|담당자|사원/i.test(heading)) {
    return ROLE_RULES.find(({ re }) => re.test(supporting) && re.test(body))?.category ?? null;
  }
  return null;
}

export function extractLanguages({ title = '', description = '' }) {
  const titleText = safeText(title, 300);
  const text = safeText(description, 5000);
  const required = [];
  // Preserve explicit title languages; mark body occurrences only near requirement wording.
  for (const { name, re } of LANGUAGE_RULES) {
    const titleHit = re.test(titleText);
    const bodyHit = [...text.matchAll(new RegExp(re.source, 'gi'))].some((match) => {
      const context = text.slice(Math.max(0, match.index - 90), match.index + match[0].length + 90);
      return REQUIREMENT_RE.test(context);
    });
    if (titleHit || bodyHit) required.push(name);
  }
  return required;
}

/** Language fit is separate from eligibility to reside/work in a given country. */
export function assessLanguageFit({ title = '', description = '', category = '', languageRequirements = '' },
  knownLanguages = { es: 'native', ko: 'beginner', en: 'unverified' }) {
  const heading = safeText(title, 300);
  const body = safeText(description, 7000);
  const explicit = safeText(languageRequirements, 500);
  const languageRole = category === 'translation' || category === 'interpreting' ||
    /\b(translat(?:ion|or|ing)|locali[sz]ation|linguist|language\s+(?:review|quality)|interpreter)\b|번역|통역|현지화/i.test(heading);
  const mentioned = LANGUAGE_RULES.filter(({ re }) => {
    if (re.test(heading) && (languageRole || /\b(?:speaking|speaker|fluency|fluent|native|bilingual|language)\b|언어|능통|원어민/i.test(heading))) return true;
    if (re.test(explicit) && !/공고\s*원문\s*확인\s*필요/.test(explicit)) return true;
    const bodyMatches = [...body.matchAll(new RegExp(re.source, 'gi'))];
    return bodyMatches.some((match) => {
      const context = body.slice(Math.max(0, match.index - 65), match.index + match[0].length + 65);
      return REQUIREMENT_RE.test(context) ||
        /\b(?:fluent|native|bilingual|speaking|language\s+skills?|kenntnisse|verhandlungssicher|mandatory|required)\b/i.test(context);
    });
  });
  if (!mentioned.length) return {
    languageFitStatus: 'unknown', languageFitReason: '공고에서 요구 언어를 확정할 근거가 부족합니다.',
  };
  const absent = mentioned.filter((x) => !['native', 'fluent', 'advanced', 'intermediate', 'beginner', 'unverified'].includes(knownLanguages?.[x.code]));
  const lowProficiency = mentioned.filter((x) => knownLanguages?.[x.code] === 'beginner' && languageRole);
  if (absent.length || lowProficiency.length) {
    const lang = [...absent, ...lowProficiency].map((x) => x.name).join(', ');
    return { languageFitStatus: 'mismatch',
      languageFitReason: `${lang}: 현재 확인된 언어 역량으로는 직무 요구 수준을 충족한다고 판단하기 어렵습니다. 실제 능력과 요건 확인 필요.` };
  }
  const unspecified = mentioned.filter((x) => ['unverified', 'beginner'].includes(knownLanguages?.[x.code]));
  if (unspecified.length) {
    return { languageFitStatus: 'unknown',
      languageFitReason: `${unspecified.map((x) => x.name).join(', ')} 능력 또는 직무에 필요한 숙련도가 확인되지 않았습니다.` };
  }
  return { languageFitStatus: 'match',
    languageFitReason: `${mentioned.map((x) => x.name).join(', ')}: 등록된 언어 정보와 공고의 확인된 언어 단서가 일치합니다. 세부 지원 자격은 확인 필요.` };
}

const RESTRICTED_COUNTRIES = [
  [/(?:^|\b)(?:united\s+states|usa|u\.?s\.?a?\.?|us\s+only|america\s+only|canada|canadian|uk\s+only|united\s+kingdom|britain|australia|new\s+zealand|germany|france|poland|portugal|spain|italy|netherlands|europe|eu\s+only|emea|north\s+america|latin\s+america|latam|south\s+america)\b/i, 'outside the stated location'],
];

const NON_KOREAN_RESIDENCY_RE = /\b(?:wohn(?:sitz|haft)|ans[aä]ssig|residen(?:t|ce)|based|located|resid(?:e|ing))\b.{0,90}\b(?:deutschland|[oö]sterreich|germany|austria|france|spain|united\s+states|canada|usa|uk|europa|europe)\b|\b(?:ausschlie[sß]lich|nur|only)\b.{0,100}\b(?:kandidat(?:en|innen|:innen)|bewerber(?:innen|:innen)?|applicants?|candidates?)\b.{0,100}\b(?:deutschland|[oö]sterreich|germany|austria|france|spain|usa|europe)\b|\b(?:residentes?|candidatos?)\b.{0,70}\b(?:espa[nñ]a|m[eé]xico|argentina)\b/i;

export function requiresPhysicalAttendance(description = '') {
  const text = safeText(description, 5500);
  return /\b(?:\d+(?:\s*[-–]\s*\d+)?\s+(?:feste\s+)?drehtage|(?:on[- ]site|in[- ]person|vor\s+ort|pr[eé]senti[ae]l)\s+(?:shoots?|filming|work|workdays?|meetings?|required|pflicht|drehen|t[aä]tigkeit)|shoots?\s+(?:at|with)\s+(?:clients?|customers?)|(?:must|required\s+to)\s+(?:work|shoot|film)\s+(?:at|on)[- ]?site)\b/i.test(text);
}

export function assessEligibility({ market = 'online', location = '', restriction = '', description = '', homeCountry = 'KR' }) {
  if (market === 'offline') return { status: 'unknown', geoScope: safeText(location, 140) || 'Unspecified', reason: 'On-site eligibility and commute require verification.', requiresVerification: true };
  const geo = safeText(restriction || location, 160);
  const body = safeText(description, 5000);
  const text = `${geo} ${body}`;
  const explicitKorea = /\b(south\s+korea|republic\s+of\s+korea|korea|seoul|kr\s+only)\b|대한민국|한국/i.test(geo);
  const universal = /\b(worldwide|anywhere|global|work\s+from\s+anywhere|no\s+geographic\s+restriction|any\s+country)\b/i.test(geo);
  const regional = /\b(apac|asia(?:\s+pacific)?|asia-wide)\b/i.test(geo);
  const restrictPattern = /\b(?:must\s+(?:be\s+)?(?:based|located|resid(?:e|ing))\s+in|only\s+(?:in|for|from)|residents?\s+of|candidates?\s+in|within\s+(?:the\s+)?(?:us|usa|eu|europe)|us\s+work\s+authori[sz]ation\s+required|(?:us|usa|u\.s\.|uk|eu|europe|canada)\s+(?:residents?|applicants?|candidates?)\s+only|(?:us|usa|u\.s\.|uk|eu|europe|canada)[ -]only)\b/i;
  if (homeCountry === 'KR' && !explicitKorea && !universal && !regional && RESTRICTED_COUNTRIES.some(([re]) => re.test(geo))) {
    return { status: 'restricted', geoScope: geo, reason: 'The advertised geographic scope does not include South Korea.', requiresVerification: true };
  }
  const matchAt = text.search(restrictPattern);
  const context = matchAt >= 0 ? text.slice(Math.max(0, matchAt - 30), matchAt + 140) : '';
  if (homeCountry === 'KR' && !explicitKorea && NON_KOREAN_RESIDENCY_RE.test(body)) {
    return { status: 'restricted', geoScope: geo || 'See residency requirement in posting', reason: 'The job description explicitly limits country of residence or physical work location.', requiresVerification: true };
  }
  if (homeCountry === 'KR' && !explicitKorea && matchAt >= 0 && /\b(us|usa|u\.s\.|united\s+states|canada|uk|europe|eu|australia|new\s+zealand)\b/i.test(context)) {
    return { status: 'restricted', geoScope: geo || 'See posting', reason: 'The description includes a geographic or work-authorization restriction.', requiresVerification: true };
  }
  if (explicitKorea || universal || regional) {
    return { status: 'possible', geoScope: geo || 'See posting', reason: 'The stated region may include South Korea; employment, language and tax eligibility remain unverified.', requiresVerification: true };
  }
  return { status: 'unknown', geoScope: geo || 'Unspecified', reason: 'Remote work is advertised, but working from South Korea has not been confirmed.', requiresVerification: true };
}

export function stableId(source, providerId, url) {
  const key = `${source}:${String(providerId || url).trim()}`;
  return `${source.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${createHash('sha256').update(key).digest('hex').slice(0, 20)}`;
}

export function dedupeJobs(jobs) {
  const byId = new Set();
  const byUrl = new Set();
  const byRole = new Set();
  return jobs.filter((job) => {
    const cleanUrl = safePublicUrl(job.url);
    if (!cleanUrl || !job.title || !job.company || !job.id || byId.has(job.id) || byUrl.has(cleanUrl)) return false;
    const roleKey = `${safeText(job.company, 200).toLowerCase()}|${safeText(job.title, 200).toLowerCase()}|${safeText(job.location, 100).toLowerCase()}`;
    if (byRole.has(roleKey)) return false;
    byId.add(job.id); byUrl.add(cleanUrl); byRole.add(roleKey);
    return true;
  });
}
