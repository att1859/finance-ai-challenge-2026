import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { workflowSteps } from "../../data/scenarios";

export default function WorkflowSpine({ currentIndex }) {
  const workflowRef = useRef(null);

  useEffect(() => {
    workflowRef.current
      ?.querySelector('[aria-current="step"]')
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentIndex]);

  return (
    <section className="workflow" aria-label="재난지원 처리 단계" ref={workflowRef}>
      <div className="workflow__rail" aria-hidden="true" />
      {workflowSteps.map((step, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        return (
          <div
            className={`workflow__step${complete ? " is-complete" : ""}${current ? " is-current" : ""}`}
            key={step}
            aria-current={current ? "step" : undefined}
          >
            <span className="workflow__dot">{complete ? <Check size={14} /> : index + 1}</span>
            <span>{step}</span>
          </div>
        );
      })}
    </section>
  );
}
