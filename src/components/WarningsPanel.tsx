import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { DesignWarning } from "../types";

interface WarningsPanelProps {
  warnings: DesignWarning[];
}

const icons = {
  info: Info,
  warning: AlertTriangle,
  danger: ShieldAlert,
};

export function WarningsPanel({ warnings }: WarningsPanelProps) {
  return (
    <section className="warning-stack" aria-label="Design warnings">
      {warnings.map((warning) => {
        const Icon = icons[warning.severity];
        return (
          <article className={`warning-card ${warning.severity}`} key={`${warning.title}-${warning.message}`}>
            <Icon aria-hidden="true" />
            <div>
              <h3>{warning.title}</h3>
              <p>{warning.message}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
