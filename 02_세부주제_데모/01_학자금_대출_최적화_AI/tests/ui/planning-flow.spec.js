import { expect, test } from '@playwright/test';

function trackPageErrors(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('예시 정보로 세 계획을 계산하고 키보드로 선택안을 바꾼다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');
  await page.locator('.hero').getByRole('button', { name: '예시 정보로 시작하기' }).click();
  await expect(page.getByRole('textbox', { name: '학교' })).toHaveValue('한빛대학교');

  await page.getByRole('button', { name: /세 가지 계획 비교하기/ }).click();
  await expect(page.getByRole('heading', { name: '내게 맞는 대학 생활 계획을 비교해 보세요.' })).toBeVisible();

  const balance = page.getByRole('radio', { name: /균형형/ });
  await expect(balance).toBeChecked();
  await balance.focus();
  await balance.press('ArrowLeft');

  const focus = page.getByRole('radio', { name: /학업시간 확보형/ });
  await expect(focus).toBeChecked();
  await expect(page.locator('.selected-detail').getByRole('heading', { name: '학업시간 확보형' })).toBeVisible();

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

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(errors).toEqual([]);
});
