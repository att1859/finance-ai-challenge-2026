const OTHER_REGIONS = [
  "서울특별시 마포구",
  "부산광역시 수영구",
  "대전광역시 유성구",
  "경기도 수원시",
  "전북특별자치도 전주시",
];

export function scoreCustomer(customer, scenario) {
  let score = 0;
  const reasons = [];

  if (scenario.noticeAnalysis.affectedRegions.some((region) => customer.region.includes(region))) {
    score += 50;
    reasons.push("재난 영향지역의 사업장");
  }
  if (customer.affected) {
    score += 20;
    reasons.push("피해 가능성 확인 요청 대상");
  }
  if (customer.dueDays <= 14) {
    score += 20;
    reasons.push(`원리금 납부 ${customer.dueDays}일 전`);
  }
  if (customer.loan) {
    score += 10;
    reasons.push("지원 검토 가능한 보유 대출");
  }

  return { score, reasons };
}

export function createCustomerPool(scenario, count = 100) {
  const primary = {
    ...scenario.primaryCustomer,
    featured: true,
    ...scoreCustomer(scenario.primaryCustomer, scenario),
  };

  const generated = Array.from({ length: Math.max(0, count - 1) }, (_, index) => {
    const inRegion = index < 22;
    const affected = inRegion && index % 3 !== 0;
    const dueDays = 4 + ((index * 7) % 52);
    const customer = {
      id: `S-${String(index + 1).padStart(4, "0")}`,
      name: `합성고객 ${String(index + 1).padStart(3, "0")}`,
      business: `${scenario.compactLabel} 시나리오 사업장 ${index + 1}`,
      businessType: scenario.primaryCustomer.businessType,
      region: inRegion
        ? scenario.noticeAnalysis.affectedRegions[index % scenario.noticeAnalysis.affectedRegions.length]
        : OTHER_REGIONS[index % OTHER_REGIONS.length],
      loan: index % 4 === 0 ? "소상공인 시설자금대출" : "소상공인 운영자금대출",
      balance: `${2_000 + ((index * 370) % 9_000)}만원`,
      nextPayment: "기관 시스템 조회",
      dueDays,
      branch: inRegion ? scenario.primaryCustomer.branch : "타지역 금융센터",
      affected,
      verified: false,
      featured: false,
    };

    return { ...customer, ...scoreCustomer(customer, scenario) };
  });

  return [primary, ...generated].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || b.score - a.score || a.dueDays - b.dueDays,
  );
}

export function getWorkflowIndex(state) {
  if (state.applicationStatus === "transferred") return 6;
  if (state.applicationStatus === "submitted") return 5;
  if (state.appVisible) return 4;
  if (state.caseCreated) return 3;
  if (state.noticeApproved) return 2;
  if (state.noticeAnalyzed) return 1;
  return 0;
}
