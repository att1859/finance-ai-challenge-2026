import {test,expect} from '@playwright/test';

test('생활비는 3개 막대·희망선, 상환은 시간축이며 전환 위치와 크기를 유지한다',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'결과 확인하기',exact:true}).click();
 await expect(page.locator('.bar-chart rect')).toHaveCount(3);
 await expect(page.locator('.bar-chart')).toContainText('희망 80.0');
 await expect(page.locator('.no-loan-hours')).toContainText('29시간');
 const rect=()=>page.locator('.bar-chart,.timeline-chart').evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,height:el.getBoundingClientRect().height}));
 const before=await rect();
 await page.getByRole('radio',{name:'상환 부담',exact:true}).click();
 await expect(page.locator('.scenario-line')).toHaveCount(2);
 const after=await rect();
 expect(Math.abs(before.top-after.top)).toBeLessThan(1);
 expect(before.height).toBe(after.height);
 expect(await page.locator('.axis-time').count()).toBeLessThanOrEqual(4);
 await page.locator('.timeline-chart').press('ArrowRight');
 await expect(page.locator('#timeline-readout')).toContainText('6개월 후');
 await page.getByRole('radio',{name:'대출잔액',exact:true}).click();
 await page.getByRole('radio',{name:'6개월',exact:true}).click();
 await page.getByRole('checkbox',{name:'초봉 20% 감소',exact:true}).check();
 const range=await page.locator('.timeline-chart').evaluate(el=>[el.dataset.low,el.dataset.high]);
 await page.getByRole('radio',{name:'기본 조건',exact:true}).click();
 expect(await page.locator('.timeline-chart').evaluate(el=>[el.dataset.low,el.dataset.high])).toEqual(range);
 await page.getByText('표로 보기',{exact:true}).click();
 await expect(page.locator('.timeline-table tbody tr')).toHaveCount(169);
 for(const width of [1440,720,360]) {
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
 }
});

test('내 시나리오에는 근로시간 없이 이번 학기 생활비 대출을 저장한다',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'결과 확인하기',exact:true}).click();
 await page.getByRole('button',{name:'+ 내 시나리오 추가',exact:true}).click();
 await expect(page.locator('[name="custom-hours"]')).toHaveCount(0);
 await page.getByRole('spinbutton',{name:'이번 학기 생활비 대출액',exact:true}).fill('123');
 await page.getByRole('button',{name:'시나리오 추가',exact:true}).click();
 await expect(page.locator('#custom-error')).toContainText('125만 원');
 await page.getByRole('spinbutton',{name:'이번 학기 생활비 대출액',exact:true}).fill('125');
 await page.getByRole('button',{name:'시나리오 추가',exact:true}).click();
 await expect(page.locator('#detail-title')).toHaveText('내 시나리오 1');
 await page.getByRole('button',{name:'내 시나리오 수정',exact:true}).click();
 await expect(page.getByRole('spinbutton',{name:'이번 학기 생활비 대출액',exact:true})).toHaveValue('125');
 await page.getByRole('button',{name:'취소',exact:true}).click();
 await page.getByRole('button',{name:'삭제',exact:true}).click();
 await expect(page.locator('[name="comparison-1"] option[value="custom-1"]')).toHaveCount(0);
});
