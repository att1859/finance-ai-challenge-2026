import {
  ActionButton,
  Badge,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from "@seed-design/react";
import {
  Building2,
  Flame,
  MonitorCog,
  RotateCcw,
  Snowflake,
  Smartphone,
  Waves,
} from "lucide-react";

function ScenarioIcon({ id }) {
  if (id === "flood") return <Waves size={16} aria-hidden="true" />;
  if (id === "wildfire") return <Flame size={16} aria-hidden="true" />;
  return <Snowflake size={16} aria-hidden="true" />;
}

export default function DemoShell({
  scenarios,
  scenarioId,
  role,
  canOpenCustomer,
  publishedCustomer,
  onScenarioChange,
  onRoleChange,
  onReset,
}) {
  return (
    <aside className="demo-shell" aria-label="데모 컨트롤">
      <div className="demo-shell__main">
        <div className="demo-shell__identity">
          <Badge variant="weak" tone="informative">DEMO</Badge>
          <strong>재난금융 자동매칭</strong>
          <span>모든 고객·대출·피해정보는 합성 데이터입니다.</span>
        </div>

        <div className="demo-shell__scenarios">
          <span>시나리오</span>
          <TabsRoot value={scenarioId} onValueChange={onScenarioChange}>
            <TabsList>
              {scenarios.map((scenario) => (
                <TabsTrigger value={scenario.id} key={scenario.id}>
                  <ScenarioIcon id={scenario.id} /> {scenario.compactLabel}
                </TabsTrigger>
              ))}
            </TabsList>
          </TabsRoot>
        </div>

        <div className="demo-shell__roles" role="group" aria-label="시연 화면 전환">
          <ActionButton
            variant={role === "staff" ? "neutralSolid" : "neutralWeak"}
            size="small"
            onClick={() => onRoleChange("staff")}
            aria-pressed={role === "staff"}
          >
            <MonitorCog size={16} /> 운영자 도구
          </ActionButton>
          <ActionButton
            variant={role === "customer" ? "neutralSolid" : "neutralWeak"}
            size="small"
            onClick={() => onRoleChange("customer")}
            disabled={!canOpenCustomer}
            aria-pressed={role === "customer"}
          >
            <Smartphone size={16} /> 고객 앱
          </ActionButton>
        </div>

        <ActionButton variant="ghost" size="small" onClick={onReset}>
          <RotateCcw size={15} /> 초기화
        </ActionButton>
      </div>

      <div className="demo-shell__status" aria-live="polite">
        <Building2 size={14} aria-hidden="true" />
        {canOpenCustomer
          ? `${publishedCustomer.name} 고객에게 게시된 앱 안내를 시연할 수 있습니다.`
          : "운영자 도구에서 고객을 선택하고 앱 안내를 먼저 게시하세요."}
      </div>
    </aside>
  );
}
