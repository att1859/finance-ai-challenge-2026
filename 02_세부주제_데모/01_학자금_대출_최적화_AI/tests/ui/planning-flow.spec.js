import { expect, test } from '@playwright/test';

function trackPageErrors(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('최초 입력은 학비·생활·근로만 받고 대출 선택은 결과로 미룬다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '학비' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: '학기당 실제 납부 등록금 만 원' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: /학기당 대출 없이 낼 등록금/ })).toHaveValue('0');
  await expect(page.getByRole('combobox', { name: '학자금 지원구간' })).toBeVisible();
  await expect(page.getByText('확정 생활비성 지원금')).toHaveCount(0);
  await expect(page.getByText('특별 자격')).toHaveCount(0);
  await expect(page.getByText('확정 장학금')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: /일반 상환/ })).toHaveCount(0);
  await expect(page.getByRole('radio', { name: /취업 후 상환/ })).toHaveCount(0);
  await expect(page.getByText('신규 대출 한도')).toHaveCount(0);
  await expect(page.getByText('현재 학자금대출 잔액')).toHaveCount(0);
  await expect(page.getByText('졸업 후 거치기간')).toHaveCount(0);
  await expect(page.getByText('상환기간')).toHaveCount(0);

  await page.locator('.input-mode').getByRole('button', { name: '예시 정보로 시작하기' }).click();
  await expect(page.getByRole('combobox', { name: '학자금 지원구간' })).toHaveValue('3');
  await expect(page.getByRole('spinbutton', { name: /학기당 대출 없이 낼 등록금/ })).toHaveValue('120');
  await expect(page.getByText('특별 자격')).toHaveCount(0);

  await page.getByRole('spinbutton', { name: /학기당 대출 없이 낼 등록금/ }).fill('421');
  await page.getByRole('button', { name: /추천 결과 확인하기/ }).click();
  await expect(page.getByText('실제 납부 등록금 이하로 입력해 주세요.')).toBeVisible();
  await expect(page.locator('#result-root')).toBeEmpty();
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

test('결과에서 가능한 상품·생활비·상환기간·자격·기존 대출 조건을 선택한다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');
  await page.locator('.input-mode').getByRole('button', { name: '예시 정보로 시작하기' }).click();
  await page.getByRole('button', { name: /추천 결과 확인하기/ }).click();

  await page.getByText('대출 구성 및 상환 일정', { exact: true }).click();
  const loanOptions = page.locator('.loan-options');
  await expect(loanOptions.getByRole('heading', { name: /균형안 v1의 대출 구성/ })).toBeVisible();
  await expect(loanOptions.getByRole('radio')).toHaveCount(4);
  await expect(loanOptions.getByRole('checkbox', { name: /생활비 대출 포함/ })).toBeVisible();
  await expect(loanOptions.getByText('풀대출 상한 보기')).toBeVisible();

  const general = loanOptions.getByRole('radio', { name: /일반 상환 등록금 \+ 일반 상환 생활비/ });
  await general.check();
  await expect(general).toBeChecked();
  await expect(loanOptions.getByRole('combobox', { name: '졸업 후 준비기간' })).toHaveValue('1');
  await expect(loanOptions.getByRole('combobox', { name: '상환기간' })).toHaveValue('10');

  await loanOptions.getByText('현재 판정에 필요한 자격 조건').click();
  await expect(loanOptions.getByRole('combobox', { name: '학부·대학원' })).toBeVisible();
  await expect(loanOptions.getByRole('checkbox', { name: /공통 신청요건을 모두 확인/ })).toBeVisible();

  await loanOptions.getByRole('checkbox', { name: /기존 학자금대출이 있어요/ }).check();
  await expect(loanOptions.getByRole('combobox', { name: '기존 대출 상품' })).toBeVisible();
  await expect(loanOptions.getByRole('spinbutton', { name: /현재 대출 잔액/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('결과 조건을 바꾸면 자격·근로시간·실행액·상환값을 즉시 다시 계산한다', async ({ page }) => {
  test.setTimeout(60000);
  const errors = trackPageErrors(page);
  await page.goto('/');
  await page.locator('.input-mode').getByRole('button', { name: '예시 정보로 시작하기' }).click();
  await page.getByRole('button', { name: /추천 결과 확인하기/ }).click();

  await page.getByText('대출 구성 및 상환 일정', { exact: true }).click();
  let options = page.locator('.loan-options');
  await options.getByRole('radio', { name: /일반 상환 등록금 \+ 일반 상환 생활비/ }).check();
  const monthlyPayment = page.locator('.loan-detail dl > div').first().locator('dd');
  const tenYearPayment = await monthlyPayment.textContent();
  await options.getByRole('combobox', { name: '상환기간' }).selectOption('5');
  await expect(monthlyPayment).not.toHaveText(tenYearPayment);
  await expect(page.locator('#condition-update-status')).toContainText('다시 계산했습니다');

  options = page.locator('.loan-options');
  await options.getByRole('checkbox', { name: /생활비 대출 포함/ }).uncheck();
  await expect(page.getByRole('radio', { name: /균형안 v1/ })).toHaveAccessibleName(/주당 20시간 · 현재 근로시간 유지/);
  await expect(page.locator('.funding-ledger')).toContainText(/생활비 대출\s*− 0 만 원/);

  options = page.locator('.loan-options');
  await options.getByText('현재 판정에 필요한 자격 조건').click();
  await options.getByRole('combobox', { name: '학부·대학원' }).selectOption('undergraduate');
  await options.getByRole('spinbutton', { name: '현재 만 나이 세' }).fill('24');
  await options.getByRole('spinbutton', { name: '현재 만 나이 세' }).press('Tab');
  await options.getByRole('combobox', { name: '학적 구분' }).selectOption('new');
  await options.getByRole('checkbox', { name: /공통 신청요건을 모두 확인/ }).click();
  await expect(options.getByText('현재 입력으로 추천 구성을 찾았습니다.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('선택 결과는 용도별 대출과 상품별 상환·10년 잔액·정책근거를 함께 보여준다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');
  await page.locator('.input-mode').getByRole('button', { name: '예시 정보로 시작하기' }).click();
  await page.getByRole('button', { name: /추천 결과 확인하기/ }).click();
  if (!(await page.locator('.loan-options').isVisible())) await page.getByText('대출 구성 및 상환 일정', { exact: true }).click();
  await page.locator('.loan-options').getByRole('radio', { name: /일반 상환 등록금 \+ 일반 상환 생활비/ }).check();

  if (!(await page.locator('.loan-options').isVisible())) await page.getByText('대출 구성 및 상환 일정', { exact: true }).click();
  const detail = page.locator('.selected-detail');
  await expect(detail.getByText('상품·용도별 신규 대출')).toBeVisible();
  await expect(detail.getByRole('table', { name: '선택한 신규 대출 구성' })).toContainText('등록금');
  await expect(detail.getByRole('table', { name: '선택한 신규 대출 구성' })).toContainText('생활비');
  await expect(detail.getByText('일반 상환 월 원리금균등 납입액')).toBeVisible();
  await expect(detail.getByText('일반 상환 거치 중 최대 월이자')).toBeVisible();
  await expect(detail.getByText('일반 상환 시작일')).toBeVisible();

  await detail.getByText('학기별 대출 실행과 계산 순서').click();
  await expect(detail.getByText(/예상 실행일/).first()).toBeVisible();
  await page.getByText('계산 가정 및 출처', { exact: true }).click();
  await detail.getByText('이 계산에 사용한 정책 기준').click();
  await expect(detail.getByText(/연 1\.7% · 고정금리/)).toBeVisible();
  await expect(detail.getByRole('link', { name: /일반 상환 학자금대출/ })).toBeVisible();

  if (!(await page.locator('.loan-options').isVisible())) await page.getByText('대출 구성 및 상환 일정', { exact: true }).click();
  await page.locator('.loan-options').getByRole('radio', { name: /취업 후 상환 등록금 \+ 취업 후 상환 생활비/ }).check();
  await expect(detail.getByText('취업 후 상환 연간 예상 의무상환액')).toBeVisible();
  await expect(detail.getByText('취업 후 상환 월평균 환산액(참고)')).toBeVisible();
  expect(errors).toEqual([]);
});

test('추천 설명은 근로감소 효과와 현재가치·잔액·변동금리·자격 주의를 구체화한다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');
  await page.locator('.input-mode').getByRole('button', { name: '예시 정보로 시작하기' }).click();
  await page.getByRole('button', { name: /추천 결과 확인하기/ }).click();

  if (!(await page.locator('.loan-options').isVisible())) await page.getByText('대출 구성 및 상환 일정', { exact: true }).click();
  const detail = page.locator('.selected-detail');
  await expect(detail.getByRole('heading', { name: '조건 확인 후 추천을 확정할 수 있어요' })).toBeVisible();
  await expect(detail.getByText(/변동금리 상품입니다/)).toBeVisible();
  await expect(detail.getByText(/공통 신청요건/)).toBeVisible();

  await page.getByRole('combobox', { name: '비교할 시나리오 B', exact: true }).selectOption('maximum-use');
  await page.getByRole('radio', { name: /최대활용안/ }).check();
  await expect(detail.getByText(/생활비 대출은 총 .*현재보다 주당 .* 덜 일할 때/)).toBeVisible();
  await expect(detail.getByText(/10년 뒤에도 취업 후 상환 잔액이 남을 수 있습니다/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('결과 설명은 실제 상품·0원·근로 유지 상태에 맞고 좁은 화면에서도 읽을 수 있다', async ({ page }, testInfo) => {
  const errors = trackPageErrors(page);
  await page.goto('/');
  await page.locator('.input-mode').getByRole('button', { name: '예시 정보로 시작하기' }).click();
  await page.getByRole('spinbutton', { name: '대학 시절 희망 월 생활비 만 원' }).fill('130');
  await page.getByRole('button', { name: /추천 결과 확인하기/ }).click();
  await page.getByRole('radio', { name: /최소대출안/ }).check();
  if (!(await page.locator('.loan-options').isVisible())) await page.getByText('대출 구성 및 상환 일정', { exact: true }).click();
  const detail = page.locator('.selected-detail');
  const options = page.locator('.loan-options');
  await options.getByRole('radio', { name: /일반 상환 등록금 \+ 취업 후 상환 생활비/ }).check();
  await expect(detail.locator('.recommendation-explanation')).toContainText('현재 근로시간을 유지해도 부족한 생활비');
  await expect(detail.locator('.loan-detail')).toContainText('일반 상환은 약정한 날짜부터 매달');
  await expect(detail.locator('.loan-detail')).toContainText('실제 매달 청구되는 금액은 아닙니다');
  await expect(detail.locator('.loan-detail')).toContainText('가장 많이 내는 달의 금액');
  await expect(detail.locator('.recommendation-explanation')).not.toContainText('같은 규칙 등급');

  for (const width of [1440, 720, 360]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth
      > document.documentElement.clientWidth)).toBe(false);
    const sizes = await detail.locator('.detail-metrics > div').first().evaluate((element) => ({
      label: parseFloat(getComputedStyle(element.querySelector(':scope > span')).fontSize),
      amount: parseFloat(getComputedStyle(element.querySelector('strong .nowrap')).fontSize),
    }));
    expect(sizes.amount).toBeGreaterThan(sizes.label);
    if (width !== 720) await detail.screenshot({ path: testInfo.outputPath(`result-copy-${width}.png`) });
  }

  await options.getByRole('checkbox', { name: /생활비 대출 포함/ }).uncheck();
  await expect(detail.locator('.recommendation-explanation')).not.toContainText('변동금리 상품입니다');
  await expect(detail.locator('.recommendation-explanation')).toContainText('남은 재학기간의 생활비가 총');
  await expect(detail.locator('.loan-detail')).not.toContainText('취업 후 상환 연간 예상 의무상환액');

  await page.getByRole('spinbutton', { name: /학기당 대출 없이 낼 등록금/ }).fill('420');
  await page.getByRole('spinbutton', { name: '대학 시절 희망 월 생활비 만 원' }).fill('80');
  await page.getByRole('button', { name: /추천 결과 확인하기/ }).click();
  await page.getByRole('radio', { name: /최소대출안/ }).check();
  await detail.getByText('학기별 대출 실행과 계산 순서').click();
  await expect(detail.getByText('이번 계획에서 새로 받을 대출은 없습니다.')).toBeVisible();
  await expect(detail).not.toContainText('표시 전 원시값');
  expect(errors).toEqual([]);
});

test('예시 정보로 세 계획을 계산하고 키보드로 선택안을 바꾼다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');
  await page.locator('.input-mode').getByRole('button', { name: '예시 정보로 시작하기' }).click();
  await expect(page.getByRole('textbox', { name: '학교' })).toHaveValue('한빛대학교');

  await page.getByRole('button', { name: /추천 결과 확인하기/ }).click();
  await expect(page.getByRole('heading', { name: '내게 맞는 대학 생활 계획을 비교해 보세요.' })).toBeVisible();
  const results = page.locator('#result-root');
  await expect(results.getByText('지원사업')).toHaveCount(0);
  await expect(results.getByText('확정 생활비성 지원금')).toHaveCount(0);
  await expect(results.getByText('한국장학재단 공식 안내')).toHaveCount(2);

  const balance = page.getByRole('radio', { name: /균형안 v1/ });
  await expect(balance).toBeChecked();
  await expect(balance).toHaveAccessibleName(/주당 15시간 · 현재보다 5시간 감소/);
  await expect(page.locator('.scenario-line')).toHaveCount(2);
  await expect(page.locator('.selected-detail')).toContainText('현재보다 주당 5시간 덜 일할 수 있어요');
  await balance.focus();
  await balance.press('ArrowLeft');

  const minimum = page.getByRole('radio', { name: /최소대출안/ });
  await expect(minimum).toBeChecked();
  await expect(page.locator('.selected-detail').getByRole('heading', { name: '최소대출안' })).toBeVisible();
  await expect(page.locator('.selected-detail')).toContainText('현재 근로시간 유지');
  await page.getByText('자금 계산 내역', { exact: true }).click();
  await expect(page.locator('.funding-ledger')).toContainText('예상 실수령 근로소득');
  await expect(page.locator('.funding-ledger')).toContainText('등록금 대출');
  await expect(page.locator('.funding-ledger')).toContainText('생활비 대출');

  await page.getByText('추가 조건', { exact: true }).click();
  await page.getByRole('checkbox', { name: /졸업 1년 지연/ }).click();
  await expect(page.getByRole('button', { name: '조건 초기화', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('첫 화면의 다섯 설명과 공식 등록금 요건 팝업을 확인한다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');
  await expect(page.locator('.slow-topic h2')).toHaveCount(5);
  await expect(page.locator('.slow-intro details')).toHaveCount(0);
  await expect(page.locator('.slow-topic-copy p')).toHaveCount(5);
  await expect(page.locator('.brand')).toHaveText('SLOW');
  const trigger = page.getByRole('button', { name: '실제 학자금 대출 상세 요건 알아보기' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: '등록금 대출 상세 요건', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', {name: '일반 상환 등록금 대출', exact: true})).toBeVisible();
  await expect(dialog.getByRole('link', {name: '취업 후 상환 신청 자격 원문'})).toHaveAttribute('href', /kosaf\.go\.kr/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  expect(await dialog.locator('.smoothing-dialog-body').evaluate(element => element.scrollTop)).toBe(0);
  await dialog.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(errors).toEqual([]);
});

test('결과에서 취업 후 상환을 선택하고 좁은 화면에서 가로 넘침이 없다', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await page.locator('.input-mode').getByRole('button', { name: '예시 정보로 시작하기' }).click();
  await page.getByRole('button', { name: /추천 결과 확인하기/ }).click();
  if (!(await page.locator('.loan-options').isVisible())) await page.getByText('대출 구성 및 상환 일정', { exact: true }).click();
  await page.locator('.loan-options').getByRole('radio', { name: /취업 후 상환 등록금 \+ 취업 후 상환 생활비/ }).check();

  await expect(page.getByText('취업 후 상환 연간 예상 의무상환액').first()).toBeVisible();
  await expect(page.getByText('취업 후 상환 월평균 환산액(참고)').first()).toBeVisible();
  await expect(page.getByText('월평균 납입액')).toHaveCount(0);

  const shortTouchTargets = await page.locator(
    '.loan-candidate-copy, .loan-options .condition-check, .loan-options summary',
  ).evaluateAll((elements) => elements
    .filter((element) => element.getClientRects().length > 0)
    .map((element) => element.getBoundingClientRect().height)
    .filter((height) => height < 44));
  expect(shortTouchTargets).toEqual([]);

  const skipLinkBottom = await page.locator('.skip-link').evaluate(
    (element) => element.getBoundingClientRect().bottom,
  );
  expect(skipLinkBottom).toBeLessThanOrEqual(0);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(errors).toEqual([]);
});
