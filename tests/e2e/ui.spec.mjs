import { test, expect } from '@playwright/test';

const sourceStatus = [
  { source: '가상 출처', status: 'ok', count: 4, detail: '테스트 전용 공개 공고', checkedAt: '2026-10-19T01:00:00Z' },
  { source: '고용24', status: 'not_configured', count: 0, detail: 'WORK24_AUTH_KEY 미설정', checkedAt: '2026-10-19T01:00:00Z' },
];

const basic = { company: '가상회사', source: '가상 출처', sourceKind: 'public_api', verifiedAt: '2026-10-19T01:00:00Z',
  postedAt: '2026-10-18', deadline: '2026-11-18', languageRequirements: '스페인어', eligibilityStatus: 'unknown', eligibility: '확인 필요',
  collectionState: 'seen', pay: '', description: '수집 및 필터 UI 동작 검사에만 사용하는 가상 공고', workplaceMode: 'onsite' };

const feed = { updatedAt: '2026-10-19T01:00:00Z', sourceStatus, jobs: [
  { ...basic, id: 'fixture:online', title: 'Spanish social media strategist', category: 'marketing', location: 'Remote', market: 'online', workplaceMode: 'remote', url: 'https://example.org/jobs/online' },
  { ...basic, id: 'fixture:interpreting', title: 'Video interpreter (Spanish)', category: 'interpreting', location: 'Remote', market: 'online', workplaceMode: 'remote', url: 'https://example.org/jobs/interpreter' },
  { ...basic, id: 'fixture:jeonju', title: '전주 스페인어 마케팅', category: 'marketing', location: '전북 전주시 덕진구', market: 'offline', url: 'https://example.org/jobs/jeonju' },
  { ...basic, id: 'fixture:iksan', title: '익산 광고 콘텐츠', category: 'advertising', location: '전북 익산시', market: 'offline', url: 'https://example.org/jobs/iksan' },
  { ...basic, id: 'fixture:seoul', title: '서울 브랜드 마케터', category: 'marketing', location: '서울특별시 강남구', market: 'offline', url: 'https://example.org/jobs/seoul' },
  { ...basic, id: 'fixture:old', title: '서울 과거 공고', category: 'marketing', location: '서울특별시', market: 'offline',
    collectionState: 'not_seen', lastSeenAt: '2026-10-02T01:00:00Z', url: 'https://example.org/jobs/old' },
] };

test.beforeEach(async ({ page }) => {
  await page.route('**/jobs.json', (route) => route.fulfill({ json: feed }));
});

test('Dubu Job Radar is branded in English and foreign-friendly original-site links remain direct', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Dubu Job Radar/);
  await expect(page.locator('.brand-words')).toContainText('DUBU');
  await page.locator('#tab-offline').click();
  const links = page.locator('#panel-offline .platform-grid a');
  await expect(links).toHaveCount(6);
  await expect(links.first()).toHaveAttribute('href', 'https://kowork.kr/en');
  await expect(page.locator('#panel-offline .platform-footnote')).toContainText('lightweight public-listing discovery');
});

test('online avoids live interpreting; offline includes nationwide and retains historical jobs', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/');
  await expect(page.locator('#tab-count-online')).toHaveText('1');
  await page.locator('#tab-offline').click();
  await expect(page.locator('#tab-count-offline')).toHaveText('4');
  await expect(page.locator('.region-nearby')).toHaveCount(1);
  await expect(page.locator('.region-expanded')).toHaveCount(1);
  await expect(page.locator('.region-relocation')).toHaveCount(2);
  await page.locator('#province-offline').selectOption('서울');
  await expect(page.locator('#list-offline .job-card')).toHaveCount(2);
  await page.locator('#archive-offline').selectOption('archived');
  await expect(page.locator('#list-offline .job-card')).toHaveCount(1);
  await expect(page.locator('#list-offline')).toContainText('서울 과거 공고');
  await page.locator('#source-drawer > summary').click();
  await expect(page.locator('#source-list')).toContainText('WORK24_AUTH_KEY is not configured');
  expect(errors).toEqual([]);
});

test('manual Upwork lead appears immediately and survives reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('#manual-entry > summary').click();
  await page.locator('#manual-title').fill('Spanish content microproject');
  await page.locator('#manual-url').fill('https://www.upwork.com/jobs/~fixture-only');
  await page.locator('#manual-category').selectOption('content');
  await page.locator('#manual-form button[type=submit]').click();
  await expect(page.locator('#list-online')).toContainText('Spanish content microproject');
  await page.reload();
  await expect(page.locator('#list-online')).toContainText('Spanish content microproject');
  await expect(page.locator('#manual-count')).toContainText('1');
});

test('hiding a job persists and restoring brings the listing back', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#list-online .job-card')).toHaveCount(1);
  await page.locator('#list-online .hide-toggle').click();
  await page.getByRole('button', { name: 'Hide this job', exact: true }).click();
  await expect(page.locator('#list-online .job-card')).toHaveCount(0);
  await expect(page.locator('#hidden-count')).toHaveText('1 hidden');
  await page.reload();
  await expect(page.locator('#list-online .job-card')).toHaveCount(0);
  await page.locator('#hidden-manager > summary').click();
  await expect(page.locator('#hidden-list')).toContainText('Spanish social media strategist');
  await page.getByRole('button', { name: /Restore hidden job/ }).click();
  await expect(page.locator('#list-online .job-card')).toHaveCount(1);
  await expect(page.locator('#hidden-count')).toHaveText('0 hidden');
});

test('company and source blocks work across tabs and the saved-only filter', async ({ page }) => {
  await page.goto('/');
  await page.locator('#list-online .bookmark-button').click();
  await page.locator('#saved-online').check();
  await page.locator('#list-online .hide-toggle').click();
  await page.getByRole('button', { name: 'Hide this company', exact: true }).click();
  await expect(page.locator('#list-online .job-card')).toHaveCount(0);
  await page.locator('#tab-offline').click();
  await expect(page.locator('#tab-count-offline')).toHaveText('0');
  await expect(page.locator('#hidden-manager')).toHaveAttribute('open', '');
  await page.getByRole('button', { name: /Restore hidden company/ }).click();
  await expect(page.locator('#tab-count-offline')).toHaveText('4');
  await page.locator('#tab-online').click();
  await expect(page.locator('#list-online .job-card')).toHaveCount(1);
  await page.locator('#list-online .hide-toggle').click();
  await page.getByRole('button', { name: 'Hide this source/platform' }).click();
  await expect(page.locator('#list-online .job-card')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#tab-count-online')).toHaveText('0');
  await page.locator('#hidden-manager > summary').click();
  await page.getByRole('button', { name: /Restore hidden source/ }).click();
  await expect(page.locator('#tab-count-online')).toHaveText('1');
});

test('hiding Upwork hides only that manually saved platform and can be undone', async ({ page }) => {
  await page.goto('/');
  await page.locator('#manual-entry > summary').click();
  const add = async (title, url) => {
    await page.locator('#manual-title').fill(title);
    await page.locator('#manual-url').fill(url);
    await page.locator('#manual-form button[type=submit]').click();
  };
  await add('Upwork sample lead', 'https://www.upwork.com/jobs/~sample-only');
  await add('Workana sample lead', 'https://www.workana.com/job/sample-only');
  await expect(page.locator('#list-online .job-card')).toHaveCount(3);
  const card = page.locator('#list-online .job-card').filter({ hasText: 'Upwork sample lead' });
  await expect(card).toContainText('Upwork');
  await card.locator('.hide-toggle').click();
  await page.getByRole('button', { name: 'Hide this source/platform' }).click();
  await expect(page.locator('#list-online')).not.toContainText('Upwork sample lead');
  await expect(page.locator('#list-online')).toContainText('Workana sample lead');
  await page.reload();
  await expect(page.locator('#list-online')).not.toContainText('Upwork sample lead');
  await page.locator('#hidden-manager > summary').click();
  await page.getByRole('button', { name: /Restore hidden source/ }).click();
  await expect(page.locator('#list-online')).toContainText('Upwork sample lead');
  await expect(page.locator('#manual-count')).toContainText('2 saved');
});

test('narrow screen has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#tab-online')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
