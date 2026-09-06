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


async function finishEligibility(page) {
 await page.getByRole('button',{name:'추가 정보 입력',exact:true}).click();
 await page.locator('summary[name="studentStatus"]').click();
 await page.locator('[data-choice="studentStatus"] [data-choice-value="new"]').click();
 await page.locator('summary[name="supportBracket"]').click();
 await page.locator('[data-choice="supportBracket"] [data-choice-value="3"]').click();
 await page.locator('[data-confirm-all]').check();
 await page.locator('[name="eligibilityReviewed"]').check();
 await page.getByRole('button',{name:'입력 완료 · 상품 확인',exact:true}).click();
}
test('preview remains during draft; completion collapses input and reveals four cards',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'결과 확인하기',exact:true}).click();
 await expect(page.locator('.eligibility-graph-status')).toContainText('자격 확인 전');
 await expect(page.locator('[name="loanCandidate"]')).toHaveCount(0);
 await finishEligibility(page);
 await expect(page.locator('#eligibility-content')).toBeHidden();
 await expect(page.locator('[name="loanCandidate"]')).toHaveCount(4);
 await expect(page.locator('#loan-options-title')).toBeFocused();
 await page.locator('[name="loanCandidate"][value="income-contingent:income-contingent"]').check();
 const before=await page.locator('.compared-products').textContent();
 await page.getByRole('button',{name:'정보 수정',exact:true}).click();
 await page.locator('summary[name="supportBracket"]').click();
 await page.locator('[data-choice="supportBracket"] [data-choice-value="10"]').click();
 await expect(page.locator('.compared-products')).toHaveText(before);
 await expect(page.locator('.eligibility-pending')).toContainText('수정 중');
 await page.locator('[name="eligibilityReviewed"]').check();
 await page.getByRole('button',{name:'입력 완료 · 상품 확인',exact:true}).click();
 await expect(page.locator('[name="loanCandidate"]:disabled')).toHaveCount(2);
});
test('incomplete submission focuses missing field rather than rejecting unmet eligibility',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'결과 확인하기',exact:true}).click();
 await page.getByRole('button',{name:'추가 정보 입력',exact:true}).click();
 await page.getByRole('button',{name:'입력 완료 · 상품 확인',exact:true}).click();
 await expect(page.locator('summary[name="studentStatus"]')).toBeFocused();
 await expect(page.locator('#error-studentStatus')).toHaveText('학적을 선택해 주세요.');
 await expect(page.locator('[name="loanCandidate"]')).toHaveCount(0);
});
test('all graph metrics keep product labels and update after product selection',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'결과 확인하기',exact:true}).click();
 await finishEligibility(page);
 for(const metric of ['living','careerLiving','repayment','balance']) {
  await page.locator(`[role="radio"][value="${metric}"]`).click();
  await expect(page.locator('.compared-products')).toContainText('등록금: 일반 상환 · 고정금리');
 }
 await page.locator('[name="loanCandidate"][value="income-contingent:income-contingent"]').check();
 await expect(page.locator('.compared-products')).toContainText('생활비'+': 취업 후 상환(ICL) · 변동금리');
});
