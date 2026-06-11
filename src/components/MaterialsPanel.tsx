import { Calculator, ExternalLink } from "lucide-react";
import type { AssemblyStage, Material, MaterialEstimate } from "../types";
import { totalEstimate } from "../lib/estimates";

interface MaterialsPanelProps {
  materials: Record<string, Material>;
  estimates: MaterialEstimate[];
  onPriceChange: (materialId: string, unitPrice: number) => void;
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

const stageLabels: Record<AssemblyStage, string> = {
  foundation: "Foundation and piers",
  floor: "Floor structure",
  "wall-frame": "Wall frame",
  roof: "Roof and fixings",
  envelope: "Exterior envelope",
  openings: "Openings",
  "interior-floor": "Interior floor",
};

const stageOrder: AssemblyStage[] = [
  "foundation",
  "floor",
  "wall-frame",
  "roof",
  "envelope",
  "openings",
  "interior-floor",
];

export function MaterialsPanel({ materials, estimates, onPriceChange }: MaterialsPanelProps) {
  const total = totalEstimate(estimates);
  const grouped = stageOrder
    .map((stage) => ({
      stage,
      estimates: estimates.filter((estimate) => estimate.assemblyStage === stage),
    }))
    .filter((group) => group.estimates.length > 0);

  return (
    <aside className="panel materials-panel" aria-label="Bill of materials">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Bunnings seeded AUD</p>
          <h2>Materials and cost</h2>
        </div>
        <Calculator aria-hidden="true" />
      </div>

      <div className="cost-total">
        <span>Concept total (AUD)</span>
        <strong>{currency(total)}</strong>
      </div>
      <p className="pricing-caveat">
        Editable estimate only. Bunnings prices and availability can change by store, and allowances are not live
        checkout pricing.
      </p>

      <div className="estimate-list">
        {grouped.map((group) => (
          <section className="estimate-stage" key={group.stage}>
            <h3>{stageLabels[group.stage]}</h3>
            {group.estimates.map((estimate) => {
              const material = materials[estimate.materialId];
              return (
                <article className="estimate-card" key={estimate.materialId}>
                  <div className="estimate-head">
                    <div>
                      <p className="category-label">{estimate.category}</p>
                      <h4>{estimate.label}</h4>
                      <div className="material-badges">
                        {material.productCode && <span>{material.productCode}</span>}
                        <span>{material.confidence.replace("-", " ")}</span>
                        {estimate.requiredReview && <span className="review-badge">review</span>}
                      </div>
                    </div>
                    {material.sourceUrl && (
                      <a href={material.sourceUrl} target="_blank" rel="noreferrer" title="Open Bunnings product">
                        <ExternalLink aria-hidden="true" />
                      </a>
                    )}
                  </div>

                  <dl className="estimate-metrics">
                    <div>
                      <dt>Need</dt>
                      <dd>{estimate.requiredLabel}</dd>
                    </div>
                    <div>
                      <dt>Buy</dt>
                      <dd>{estimate.purchaseLabel}</dd>
                    </div>
                    <div>
                      <dt>Cost</dt>
                      <dd>{currency(estimate.estimatedCost)}</dd>
                    </div>
                  </dl>

                  <label className="price-input">
                    <span>{material.pricingLabel} AUD</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={material.unitPrice}
                      onChange={(event) => onPriceChange(material.id, Number(event.currentTarget.value))}
                    />
                  </label>

                  <p className="formula-note">{estimate.formulaExplanation}</p>
                  {estimate.breakdown && (
                    <ul className="estimate-breakdown">
                      {estimate.breakdown.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  )}
                  <p className="material-note">{material.notes}</p>
                  {estimate.notes.map((note) => (
                    <p className="estimate-note" key={note}>
                      {note}
                    </p>
                  ))}
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </aside>
  );
}
