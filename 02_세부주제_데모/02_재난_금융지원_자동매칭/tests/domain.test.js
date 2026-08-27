import test from "node:test";
import assert from "node:assert/strict";
import { addDays, buildScenarioDates, formatDday } from "../src/domain/dates.js";
import { scenarios } from "../src/data/scenarios.js";
import {
  CASE_STATUS,
  NOTICE_STATUS,
  canTransitionCase,
  createScenarioState,
  getCaseState,
  getWorkflowIndex,
  transitionCaseState,
  updateCaseState,
} from "../src/domain/demoState.js";

const customerA = { id: "A", statement: "A 고객 피해" };
const customerB = { id: "B", statement: "B 고객 피해" };

test("D-day는 실행일과 신고기한의 차이로 계산한다", () => {
  const now = new Date(2026, 7, 27);
  assert.equal(formatDday(addDays(now, 5), now), "D-5");
  assert.equal(formatDday(now, now), "D-Day");
  assert.equal(formatDday(addDays(now, -1), now), "기한 종료");
});

test("시나리오 날짜는 실행일 기준으로 생성한다", () => {
  const dates = buildScenarioDates(
    { occurredDaysAgo: 3, durationDays: 1, deadlineDaysFromNow: 5, startTime: "03:40" },
    new Date(2026, 7, 27),
  );
  assert.deepEqual(dates, {
    occurredAt: "2026.08.24 03:40",
    endedAt: "2026.08.25",
    reportDeadline: "2026.09.01",
    reportDday: "D-5",
  });
});

test("세 재난 시나리오는 언제 실행해도 신청 가능 기간으로 생성된다", () => {
  assert.equal(scenarios.length, 3);
  scenarios.forEach((scenario) => {
    assert.equal(scenario.current, true);
    assert.match(scenario.reportDday, /^D-(5|7|10)$/);
    assert.notEqual(scenario.reportDday, "기한 종료");
  });
});

test("고객별 케이스 상태는 서로 독립적이다", () => {
  const base = { ...createScenarioState([customerA, customerB]), noticeStatus: NOTICE_STATUS.APPROVED };
  const updated = updateCaseState(base, customerB, {
    status: CASE_STATUS.PUBLISHED,
    statement: "B 고객 수정 진술",
  });

  assert.equal(getCaseState(updated, customerA).status, CASE_STATUS.READY);
  assert.equal(getCaseState(updated, customerA).statement, "A 고객 피해");
  assert.equal(getCaseState(updated, customerB).status, CASE_STATUS.PUBLISHED);
  assert.equal(getCaseState(updated, customerB).statement, "B 고객 수정 진술");
});

test("게시·제출·접수·이관 순서를 건너뛸 수 없다", () => {
  assert.equal(canTransitionCase("ready", "published"), true);
  assert.equal(canTransitionCase("published", "application_submitted"), false);
  assert.equal(canTransitionCase("application_submitted", "bank_received"), true);
  assert.throws(
    () => transitionCaseState({ status: "published", timestamps: {} }, "transferred"),
    /변경할 수 없습니다/,
  );
});

test("심사 이관은 마지막 워크플로 단계다", () => {
  assert.equal(
    getWorkflowIndex(
      { noticeStatus: NOTICE_STATUS.APPROVED },
      { status: CASE_STATUS.TRANSFERRED },
    ),
    6,
  );
});
