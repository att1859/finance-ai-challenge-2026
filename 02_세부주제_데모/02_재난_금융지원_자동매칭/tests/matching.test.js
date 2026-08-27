import test from "node:test";
import assert from "node:assert/strict";
import { scenarios } from "../src/data/scenarios.js";
import { createCustomerPool, getEligibleExtraSupports, scoreCustomer } from "../src/lib/matching.js";

test("각 시나리오는 100명의 합성 고객 풀을 만든다", () => {
  for (const scenario of scenarios) {
    assert.equal(createCustomerPool(scenario).length, 100);
  }
});

test("영향지역에 있고 납부일이 가까운 주 고객이 최우선이다", () => {
  const scenario = scenarios[0];
  const pool = createCustomerPool(scenario);
  assert.equal(pool[0].id, scenario.primaryCustomer.id);
  assert.equal(pool[0].score, 100);
  assert.ok(pool[0].reasons.includes("재난 영향지역의 사업장"));
});

test("비영향지역 고객은 지역 점수를 받지 않는다", () => {
  const scenario = scenarios[0];
  const result = scoreCustomer(
    {
      region: "부산광역시 수영구",
      affected: false,
      dueDays: 30,
      loan: "운영자금대출",
    },
    scenario,
  );
  assert.equal(result.score, 10);
});

test("고객 속성에 맞는 추가 지원만 추천한다", () => {
  const scenario = scenarios[0];
  const customer = {
    attributes: { hasBusinessInsurance: false, delinquencyRisk: true, usesBusinessCard: false },
  };
  assert.deepEqual(
    getEligibleExtraSupports(customer, scenario.extraSupports).map((support) => support.id),
    ["fresh-start"],
  );
});
