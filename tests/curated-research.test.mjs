import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectCuratedResearch, normalizeCuratedResearch } from '../scripts/curated-research.mjs';
import { mergeHistoricalFeed } from '../scripts/collect.mjs';

const now = '2026-10-19T08:00:00Z';
const valid = {
  source: 'Hanultari', url: 'https://mcfamily.or.kr/en/jobs/opening/14881',
  title: 'Spanish/English Online Team · Social Media and Content Support',
  company: 'Chingu Mobile', market: 'offline', workplaceMode: 'onsite',
  location: 'Geumcheon-gu, Seoul', category: 'marketing',
  reviewedAt: '2026-10-19T00:00:00Z',
  deadline: '2026-11-06', requiredExperienceYears: 0,
  requiredKoreanLevel: 'unknown', homeCountryEligible: 'unknown',
  languageRequirements: 'Spanish and English required',
  essentialRequirements: 'Spanish and English communication required; no prior experience needed.',
  researchSummary: 'Customer support, Spanish content and social media work. English must be confirmed.',
};

test('reviewed original with evidence and independent check date is included without pretending to refresh it', () => {
  const item = normalizeCuratedResearch(valid, { now });
  assert.ok(item);
  assert.equal(item.source, 'Hanultari');
  assert.equal(item.sourceKind, 'curated_research');
  assert.equal(item.verifiedAt, '2026-10-19T00:00:00.000Z');
  assert.equal(item.deadline, '2026-11-06T00:00:00.000Z');
  assert.equal(item.commuteClass, 'relocation');
  assert.match(item.evidenceNote, /NOT refreshed/);
  assert.equal(item.eligibilityStatus, 'unknown');
});

test('expired, stale, senior, advanced Korean and unsupported residence research entries never appear', () => {
  const reject = [
    { ...valid, deadline: '2026-10-18' },
    { ...valid, reviewedAt: '2026-08-01T00:00:00Z' },
    { ...valid, requiredExperienceYears: 5 },
    { ...valid, requiredKoreanLevel: 'fluent' },
    { ...valid, homeCountryEligible: 'no' },
    { ...valid, essentialRequirements: 'Requires at least 10 years of marketing experience.' },
    { ...valid, source: 'Unknown Fake Jobs' },
    { ...valid, url: 'javascript:alert(1)' },
  ];
  for (const entry of reject) assert.equal(normalizeCuratedResearch(entry, { now }), null);
});

test('curated collector reads finite reviewed file, reports rejected items and never fetches external pages', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dubu-curated-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'config'));
  await writeFile(join(root, 'config/research-jobs.json'), JSON.stringify({ jobs: [
    valid, { ...valid, url: 'https://example.com/expired', deadline: '2020-01-01' },
  ] }));
  const result = await collectCuratedResearch({ root, now });
  assert.equal(result.jobs.length, 1);
  assert.equal(result.successfulRequests, 0);
  assert.equal(result.sourceStatus[0].status, 'manual');
  assert.match(result.sourceStatus[0].detail, /1 excluded/);
});

test('historical curated leads expire after 30 days or passed application deadline', () => {
  const oldJob = normalizeCuratedResearch(valid, { now });
  assert.ok(oldJob);
  const currentFeed = { updatedAt: '2026-12-05T00:00:00Z', jobs: [], sourceStatus: [
    { source: 'ChatGPT Research', status: 'manual', count: 0 },
  ] };
  const result = mergeHistoricalFeed(currentFeed, { jobs: [oldJob] });
  assert.equal(result.jobs.length, 0);
});
