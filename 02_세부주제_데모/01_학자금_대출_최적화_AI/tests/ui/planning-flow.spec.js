import { expect, test } from '@playwright/test';

test('기본 입력은 단일 폼 6개이며 등록금 도움말과 필수·범위 검증을 제공한다', async ({page}) => {
 await page.goto('/');
 await expect(page.locator('#diagnosis-form input')).toHaveCount(6);
 for(const name of ['school','region','academicYear','supportBracket','hourlyWage','currentWorkHours','workTaxPreset','desiredCareerSpend']) await expect(page.locator(`#diagnosis-form [name="${name}"]`)).toHaveCount(0);
 await page.getByRole('button',{name:'대출 없이 낼 수 있는 등록금 금액 설명',exact:true}).click();
 await expect(page.locator('#tuition-help')).toContainText('이미 저축해 둔 돈');
 await page.locator('#remainingSemesters').fill('1.5');
 await page.getByRole('button',{name:'결과 확인하기',exact:true}).click();
 await expect(page.locator('#remainingSemesters')).toHaveAttribute('aria-invalid','true');
 await page.locator('#remainingSemesters').fill('8');
 await page.locator('#currentMonthlyIncome').fill('');
 await page.getByRole('button',{name:'결과 확인하기',exact:true}).click();
 await expect(page.locator('#currentMonthlyIncome')).toHaveAttribute('aria-invalid','true');
 await page.getByRole('button',{name:'예시 정보로 채우기',exact:true}).click();
 await page.locator('#tuitionContributionPerSemester').fill('421');
 await page.getByRole('button',{name:'결과 확인하기',exact:true}).click();
 await expect(page.locator('#tuitionContributionPerSemester-error')).toHaveText('실제 납부 등록금 이하로 입력해 주세요.');
});

test('지원구간은 취업후상환 추가정보에서 받으며 일반상환에서는 감춘다',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'결과 확인하기',exact:true}).click();
 await expect(page.locator('#repayment-guide')).toBeFocused();
 await expect(page.locator('[name="loanCandidate"][value="general:general"]')).toBeChecked();
 await page.getByRole('radio',{name:/취업 후 상환 등록금 \+ 취업 후 상환 생활비/}).check();
 await page.getByText('기간·생활비 포함·자격 조건 조정',{exact:true}).click();
 await page.getByText('현재 판정에 필요한 자격 조건',{exact:true}).click();
 await page.locator('[name="supportBracket"]').selectOption('3');
 await expect(page.locator('[name="supportBracket"]')).toHaveValue('3');
 await page.getByRole('radio',{name:/일반 상환 등록금 \+ 일반 상환 생활비/}).check();
 await expect(page.locator('[name="supportBracket"]')).toHaveCount(0);
 await page.getByRole('combobox',{name:'상환기간',exact:true}).selectOption('5');
 await expect(page.locator('#condition-update-status')).toContainText('다시 계산했습니다');
});


test('모든 그래프에 상환상품이 보이며 선택 변경 시 갱신된다',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'결과 확인하기',exact:true}).click();
 for(const metric of ['living','careerLiving','repayment','balance']) {
  await page.locator(`[role="radio"][value="${metric}"]`).click();
  await expect(page.locator('.compared-products')).toContainText('등록금: 일반 상환 · 고정금리');
 }
 await page.locator('[name="loanCandidate"][value="income-contingent:income-contingent"]').check();
 await expect(page.locator('.compared-products')).toContainText('생활비: 취업 후 상환(ICL) · 변동금리');
});
