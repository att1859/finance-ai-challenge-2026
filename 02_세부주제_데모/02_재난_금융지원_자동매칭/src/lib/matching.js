import { formatNextPayment } from "../domain/dates.js";

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
  const breakdown = [];

  if (scenario.noticeAnalysis.affectedRegions.some((region) => customer.region.includes(region))) {
    score += 50;
    reasons.push("재난 영향지역의 사업장");
    breakdown.push({ id: "region", label: "영향지역 일치", score: 50 });
  }
  if (customer.affected) {
    score += 20;
    reasons.push("피해 가능성 확인 요청 대상");
    breakdown.push({ id: "signal", label: "피해 가능성 신호", score: 20 });
  }
  if (customer.dueDays <= 14) {
    score += 20;
    reasons.push(`원리금 납부 ${customer.dueDays}일 전`);
    breakdown.push({ id: "payment", label: "14일 이내 납부", score: 20 });
  }
  if (customer.loan) {
    score += 10;
    reasons.push("지원 검토 가능한 보유 대출");
    breakdown.push({ id: "loan", label: "검토 가능한 대출", score: 10 });
  }

  return { score, reasons, breakdown };
}

export function createCustomerPool(scenario, count = 100) {
  const primary = {
    ...scenario.primaryCustomer,
    nextPayment: formatNextPayment(scenario.primaryCustomer.dueDays),
    statement: scenario.customerStatement,
    fallbackAnalysis: scenario.customerAnalysis,
    attributes: scenario.primaryCustomer.attributes ?? {
      hasBusinessInsurance: true,
      delinquencyRisk: true,
      usesBusinessCard: true,
    },
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
      nextPayment: formatNextPayment(dueDays),
      dueDays,
      branch: inRegion ? scenario.primaryCustomer.branch : "타지역 금융센터",
      affected,
      verified: false,
      statement: `${scenario.noticeAnalysis.affectedRegions[0]}에서 ${scenario.primaryCustomer.businessType} 사업장을 운영합니다. ${scenario.compactLabel} 피해로 시설과 영업에 어려움이 생겼습니다.`,
      fallbackAnalysis: {
        ...scenario.customerAnalysis,
        location: inRegion ? scenario.noticeAnalysis.affectedRegions[index % scenario.noticeAnalysis.affectedRegions.length] : OTHER_REGIONS[index % OTHER_REGIONS.length],
        businessType: scenario.primaryCustomer.businessType,
      },
      attributes: {
        hasBusinessInsurance: index % 4 === 0,
        delinquencyRisk: dueDays <= 14,
        usesBusinessCard: index % 3 !== 0,
      },
      featured: false,
    };

    return { ...customer, ...scoreCustomer(customer, scenario) };
  });

  return [primary, ...generated].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || b.score - a.score || a.dueDays - b.dueDays || a.id.localeCompare(b.id),
  );
}

export function getEligibleExtraSupports(customer, supports) {
  return supports.filter((support) => {
    if (support.id === "insurance-advance") return customer.attributes.hasBusinessInsurance;
    if (support.id === "fresh-start") return customer.attributes.delinquencyRisk;
    if (support.id === "card-deferral") return customer.attributes.usesBusinessCard;
    return true;
  });
}
