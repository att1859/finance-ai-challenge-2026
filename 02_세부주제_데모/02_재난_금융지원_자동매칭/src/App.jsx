import { useEffect, useMemo, useState } from "react";
import DemoShell from "./app/DemoShell";
import { scenarios } from "./data/scenarios";
import {
  CASE_STATUS,
  NOTICE_STATUS,
  createScenarioState,
  getCaseState,
  getWorkflowIndex,
  transitionCaseState,
  updateCaseState,
} from "./domain/demoState";
import CustomerApp from "./features/customer/CustomerApp";
import StaffApp from "./features/staff/StaffApp";
import { createCustomerPool } from "./lib/matching";

const STORAGE_KEY = "hangeul-disaster-finance-demo-v2";

function createInitialStates(customerPools) {
  return Object.fromEntries(
    scenarios.map((scenario) => [scenario.id, createScenarioState(customerPools[scenario.id])]),
  );
}

function loadSavedStates(customerPools) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.version === 2 && saved.states) {
      const initial = createInitialStates(customerPools);
      return Object.fromEntries(
        scenarios.map((scenario) => [
          scenario.id,
          { ...initial[scenario.id], ...(saved.states[scenario.id] ?? {}) },
        ]),
      );
    }
  } catch {
    // 손상된 데모 저장값은 새 상태로 대체합니다.
  }
  return createInitialStates(customerPools);
}

async function requestAnalysis(type, content, fallback) {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content }),
    });
    if (!response.ok) throw new Error("저장된 분석 사용");
    const result = await response.json();
    return { analysis: result.analysis, source: "openai" };
  } catch {
    return { analysis: fallback, source: "cache" };
  }
}

export default function App() {
  const customerPools = useMemo(
    () => Object.fromEntries(scenarios.map((scenario) => [scenario.id, createCustomerPool(scenario)])),
    [],
  );
  const [scenarioId, setScenarioId] = useState("flood");
  const [states, setStates] = useState(() => loadSavedStates(customerPools));
  const [role, setRole] = useState("staff");
  const [analyzing, setAnalyzing] = useState(null);

  const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];
  const customers = customerPools[scenario.id];
  const scenarioState = states[scenario.id] ?? createScenarioState(customers);
  const selectedCustomer = customers.find((customer) => customer.id === scenarioState.selectedCustomerId) ?? customers[0];
  const selectedCase = getCaseState(scenarioState, selectedCustomer);
  const publishedCustomer = customers.find((customer) => customer.id === scenarioState.publishedCustomerId) ?? null;
  const publishedCase = publishedCustomer ? getCaseState(scenarioState, publishedCustomer) : null;
  const workflowCase = publishedCase ?? selectedCase;
  const canOpenCustomer = Boolean(publishedCustomer && publishedCase && publishedCase.status !== CASE_STATUS.READY);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, states }));
  }, [states]);

  const updateScenarioById = (targetScenarioId, updater) => {
    setStates((current) => {
      const currentState = current[targetScenarioId];
      const nextState = typeof updater === "function" ? updater(currentState) : { ...currentState, ...updater };
      return { ...current, [targetScenarioId]: nextState };
    });
  };

  const updateCurrentScenario = (updater) => updateScenarioById(scenario.id, updater);

  const analyzeNotice = async () => {
    const targetId = scenario.id;
    setAnalyzing(`notice:${targetId}`);
    updateScenarioById(targetId, (current) => ({ ...current, noticeStatus: NOTICE_STATUS.ANALYZING }));
    const result = await requestAnalysis("notice", scenario.noticeText, scenario.noticeAnalysis);
    updateScenarioById(targetId, (current) => ({
      ...current,
      noticeStatus: NOTICE_STATUS.ANALYZED,
      noticeAnalysis: result.analysis,
      noticeAnalysisSource: result.source,
    }));
    setAnalyzing(null);
  };

  const approveNotice = () => {
    updateCurrentScenario((current) => ({ ...current, noticeStatus: NOTICE_STATUS.APPROVED }));
  };

  const selectCustomer = (customerId) => {
    updateCurrentScenario((current) => ({ ...current, selectedCustomerId: customerId }));
  };

  const publishSelectedCustomer = () => {
    updateCurrentScenario((current) => {
      const currentCase = getCaseState(current, selectedCustomer);
      const published = transitionCaseState(currentCase, CASE_STATUS.PUBLISHED);
      const withCase = updateCaseState(current, selectedCustomer, published);
      return { ...withCase, publishedCustomerId: selectedCustomer.id };
    });
  };

  const unpublishSelectedCustomer = () => {
    updateCurrentScenario((current) => {
      const currentCase = getCaseState(current, selectedCustomer);
      const ready = transitionCaseState(currentCase, CASE_STATUS.READY);
      const withCase = updateCaseState(current, selectedCustomer, ready);
      return {
        ...withCase,
        publishedCustomerId: current.publishedCustomerId === selectedCustomer.id ? null : current.publishedCustomerId,
      };
    });
    setRole("staff");
  };

  const updatePublishedCase = (updater) => {
    if (!publishedCustomer) return;
    updateCurrentScenario((current) => {
      const currentCase = getCaseState(current, publishedCustomer);
      const nextCase = typeof updater === "function" ? updater(currentCase) : { ...currentCase, ...updater };
      return updateCaseState(current, publishedCustomer, nextCase);
    });
  };

  const changeStatement = (statement) => {
    updatePublishedCase((currentCase) => ({
      ...currentCase,
      status: currentCase.status === CASE_STATUS.CUSTOMER_CONFIRMED ? CASE_STATUS.PUBLISHED : currentCase.status,
      statement,
      customerAnalysis: null,
      customerAnalysisSource: null,
    }));
  };

  const analyzeCustomer = async (statement) => {
    if (!publishedCustomer) return;
    const targetScenarioId = scenario.id;
    const targetCustomer = publishedCustomer;
    setAnalyzing(`customer:${targetScenarioId}:${targetCustomer.id}`);
    const result = await requestAnalysis("customer", statement, targetCustomer.fallbackAnalysis);
    updateScenarioById(targetScenarioId, (current) => {
      const currentCase = getCaseState(current, targetCustomer);
      const confirmed = currentCase.status === CASE_STATUS.CUSTOMER_CONFIRMED
        ? currentCase
        : transitionCaseState(currentCase, CASE_STATUS.CUSTOMER_CONFIRMED);
      return updateCaseState(current, targetCustomer, {
        ...confirmed,
        statement,
        customerAnalysis: result.analysis,
        customerAnalysisSource: result.source,
      });
    });
    setAnalyzing(null);
  };

  const updateDocument = (key, checked) => {
    updatePublishedCase((currentCase) => ({
      ...currentCase,
      documents: { ...currentCase.documents, [key]: checked },
    }));
  };

  const submitApplication = () => {
    updatePublishedCase((currentCase) => transitionCaseState(currentCase, CASE_STATUS.APPLICATION_SUBMITTED));
  };

  const cancelApplication = () => {
    updatePublishedCase((currentCase) => transitionCaseState(currentCase, CASE_STATUS.PUBLISHED));
  };

  const receiveApplication = () => {
    updateCurrentScenario((current) => {
      const currentCase = getCaseState(current, selectedCustomer);
      return updateCaseState(current, selectedCustomer, transitionCaseState(currentCase, CASE_STATUS.BANK_RECEIVED));
    });
  };

  const transferApplication = () => {
    updateCurrentScenario((current) => {
      const currentCase = getCaseState(current, selectedCustomer);
      return updateCaseState(current, selectedCustomer, transitionCaseState(currentCase, CASE_STATUS.TRANSFERRED));
    });
  };

  const changeRole = (nextRole) => {
    if (nextRole === "customer" && !canOpenCustomer) return;
    setRole(nextRole);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeScenario = (nextScenarioId) => {
    setScenarioId(nextScenarioId);
    if (!states[nextScenarioId]?.publishedCustomerId) setRole("staff");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetDemo = () => {
    setStates(createInitialStates(customerPools));
    setScenarioId("flood");
    setRole("staff");
    setAnalyzing(null);
    localStorage.removeItem(STORAGE_KEY);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-root">
      <DemoShell
        scenarios={scenarios}
        scenarioId={scenario.id}
        role={role}
        canOpenCustomer={canOpenCustomer}
        publishedCustomer={publishedCustomer}
        onScenarioChange={changeScenario}
        onRoleChange={changeRole}
        onReset={resetDemo}
      />

      {role === "customer" && publishedCustomer && publishedCase ? (
        <CustomerApp
          scenario={scenario}
          customer={publishedCustomer}
          customerCase={publishedCase}
          analyzing={analyzing === `customer:${scenario.id}:${publishedCustomer.id}`}
          onStatementChange={changeStatement}
          onAnalyze={analyzeCustomer}
          onDocumentChange={updateDocument}
          onSubmit={submitApplication}
          onCancelApplication={cancelApplication}
        />
      ) : (
        <StaffApp
          scenario={scenario}
          scenarioState={scenarioState}
          customers={customers}
          selectedCustomer={selectedCustomer}
          selectedCase={selectedCase}
          currentIndex={getWorkflowIndex(scenarioState, workflowCase)}
          analyzingNotice={analyzing === `notice:${scenario.id}`}
          onAnalyzeNotice={analyzeNotice}
          onApproveNotice={approveNotice}
          onSelectCustomer={selectCustomer}
          onPublish={publishSelectedCustomer}
          onUnpublish={unpublishSelectedCustomer}
          onReceive={receiveApplication}
          onTransfer={transferApplication}
        />
      )}
    </div>
  );
}
