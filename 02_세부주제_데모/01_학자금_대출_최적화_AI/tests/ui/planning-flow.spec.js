import { expect, test } from '@playwright/test';

function trackPageErrors(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('입력 화면에서 장학금·생활비성 지원금·특별자격을 요구하지 않는다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '학비와 대출 조건' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: '학기당 실제 납부 등록금 만 원' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: '학자금 지원구간' })).toBeVisible();
  await expect(page.getByText('확정 생활비성 지원금')).toHaveCount(0);
  await expect(page.getByText('특별 자격')).toHaveCount(0);
  await expect(page.getByText('확정 장학금')).toHaveCount(0);

  await page.locator('.hero').getByRole('button', { name: '예시 정보로 시작하기' }).click();
  await expect(page.getByRole('combobox', { name: '학자금 지원구간' })).toHaveValue('3');
  await expect(page.getByText('특별 자격')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('기본 생활비와 주휴·간편 차감이 반영된 근로소득을 입력 단계에서 확인한다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');

  await expect(page.getByRole('spinbutton', { name: '대학 시절 희망 월 생활비 만 원' })).toHaveValue('80');
  await expect(page.getByRole('spinbutton', { name: '계산 금리 %' })).toHaveCount(0);
  await expect(page.getByRole('radio', { name: '원금균등' })).toHaveCount(0);
  await expect(page.getByRole('spinbutton', { name: '희망 주당 근로시간 시간' })).toHaveCount(0);

  const taxPreset = page.getByRole('combobox', { name: '근로소득 간편 차감' });
  await expect(taxPreset).toHaveValue('simple-3.3');
  await expect(page.locator('#work-income-preview')).toContainText('121.0만 원');
  await expect(page.locator('#work-income-breakdown')).toContainText('주휴수당 20.9만 원');

  await taxPreset.selectOption('social-9.5');
  await expect(page.locator('#work-income-preview')).toContainText('113.3만 원');

  await page.getByRole('spinbutton', { name: '현재 주당 근로시간 시간' }).fill('14');
  await expect(page.locator('#work-holiday-note')).toContainText('주휴수당 적용 안 됨');
  expect(errors).toEqual([]);
});

test('예시 정보로 세 계획을 계산하고 키보드로 선택안을 바꾼다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');
  await page.locator('.hero').getByRole('button', { name: '예시 정보로 시작하기' }).click();
  await expect(page.getByRole('textbox', { name: '학교' })).toHaveValue('한빛대학교');

  await page.getByRole('button', { name: /세 가지 계획 비교하기/ }).click();
  await expect(page.getByRole('heading', { name: '내게 맞는 대학 생활 계획을 비교해 보세요.' })).toBeVisible();
  const results = page.locator('#result-root');
  await expect(results.getByText('지원사업')).toHaveCount(0);
  await expect(results.getByText('확정 생활비성 지원금')).toHaveCount(0);
  await expect(results.getByText('한국장학재단 공식 안내')).toHaveCount(2);

  const balance = page.getByRole('radio', { name: /균형형/ });
  await expect(balance).toBeChecked();
  await expect(balance).toHaveAccessibleName(/주당 10시간 · 현재보다 10시간 감소/);
  await expect(page.locator('.selected-detail')).toContainText('현재보다 주당 10시간 덜 일할 수 있어요');
  await expect(page.locator('.table-wrap')).toContainText('현재 20시간');
  await expect(page.locator('.table-wrap')).not.toContainText('희망 10시간');
  await balance.focus();
  await balance.press('ArrowLeft');

  const focus = page.getByRole('radio', { name: /학업시간 확보형/ });
  await expect(focus).toBeChecked();
  await expect(page.locator('.selected-detail').getByRole('heading', { name: '학업시간 확보형' })).toBeVisible();
  await expect(page.locator('.selected-detail')).toContainText('현재보다 주당 20시간 덜 일할 수 있어요');
  await expect(page.locator('.funding-ledger')).toContainText('예상 실수령 근로소득');
  await expect(page.locator('.funding-ledger')).toContainText('등록금 대출');
  await expect(page.locator('.funding-ledger')).toContainText('생활비 대출');

  await page.getByRole('checkbox', { name: /졸업 1년 지연/ }).check();
  await expect(page.getByText('위험 조건 초기화')).toBeVisible();
  expect(errors).toEqual([]);
});

test('첫 화면에서 소비평탄화 설명을 열고 상세 계산을 확인한다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');

  await page.getByRole('button', { name: /대출까지 써도 괜찮을까요/ }).click();
  const dialog = page.getByRole('dialog', { name: '대출까지 써도 괜찮을까요?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.rate-ledger dd').nth(0)).toContainText('약 17만 원');
  await expect(dialog.locator('.rate-ledger dd').nth(1)).toContainText('약 30만 원');

  await dialog.getByText('피셔 방정식으로 계산 원리 보기').click();
  await expect(dialog.getByText(/1\.017 ÷ 1\.028/)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: /대출까지 써도 괜찮을까요/ }).click();
  await expect(dialog.locator('details')).not.toHaveAttribute('open', '');
  expect(await dialog.locator('.smoothing-dialog-body').evaluate((element) => element.scrollTop)).toBe(0);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('취업 후 상환 유형을 계산하고 좁은 화면에서 가로 넘침이 없다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await page.locator('.hero').getByRole('button', { name: '예시 정보로 시작하기' }).click();
  await page.getByRole('radio', { name: /취업 후 상환/ }).check();
  await page.getByRole('button', { name: /세 가지 계획 비교하기/ }).click();

  await expect(page.getByText(/취업 후 상환 기준/)).toBeVisible();
  await expect(page.getByText('연간 예상 의무상환액').first()).toBeVisible();
  await expect(page.getByText('월평균 환산액(참고)').first()).toBeVisible();
  await expect(page.getByText('월평균 납입액')).toHaveCount(0);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(errors).toEqual([]);
});
