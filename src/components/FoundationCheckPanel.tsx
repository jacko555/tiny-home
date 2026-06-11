import { Ruler, ShieldAlert } from "lucide-react";
import type { FoundationCheck, TinyHomeSpec } from "../types";

interface FoundationCheckPanelProps {
  spec: TinyHomeSpec;
  check: FoundationCheck;
}

function mm(value: number): string {
  return `${Math.round(value)}mm`;
}

export function FoundationCheckPanel({ spec, check }: FoundationCheckPanelProps) {
  const severeWarnings = check.warnings.filter((warning) => warning.severity !== "info");

  return (
    <section className="panel foundation-panel" aria-label="Floor and foundation concept check">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Floor/foundation check</p>
          <h2>Supports, spans, and 190 frame</h2>
        </div>
        <Ruler aria-hidden="true" />
      </div>

      <div className="foundation-status">
        <span className={severeWarnings.length > 0 ? "status-badge warning" : "status-badge ok"}>
          {severeWarnings.length > 0 ? `${severeWarnings.length} review flags` : "default concept spacing ok"}
        </span>
        <span>Concept limit {mm(check.maxConceptPierSpacingMm)}</span>
      </div>

      <dl className="foundation-metrics">
        <div>
          <dt>Pier grid</dt>
          <dd>
            {spec.pierColumns} x {spec.pierRows}
          </dd>
        </div>
        <div>
          <dt>Length spacing</dt>
          <dd>{mm(check.pierSpacingLengthMm)}</dd>
        </div>
        <div>
          <dt>Width spacing</dt>
          <dd>{mm(check.pierSpacingWidthMm)}</dd>
        </div>
        <div>
          <dt>Max bay</dt>
          <dd>{mm(check.maxBaySpacingMm)}</dd>
        </div>
        <div>
          <dt>190 rectangle</dt>
          <dd>{(check.externalFrame190LengthMm / 1000).toFixed(1)} lm</dd>
        </div>
        <div>
          <dt>190 cross braces</dt>
          <dd>
            {check.doubledCrossmember190Count} doubled / {check.doubledCrossmember190MemberCount} members
          </dd>
        </div>
        <div>
          <dt>Single infill</dt>
          <dd>{check.singleInfillJoistCount} joists</dd>
        </div>
        <div>
          <dt>140 pier joists</dt>
          <dd>{check.bearingJoist140Count} lines</dd>
        </div>
        <div>
          <dt>Roof tie posts</dt>
          <dd>{check.roofTiePostCount} posts</dd>
        </div>
        <div>
          <dt>Roof bolt sets</dt>
          <dd>{check.roofTieBoltSetCount} sets</dd>
        </div>
        <div>
          <dt>Post height</dt>
          <dd>{mm(check.postHeightMm)}</dd>
        </div>
        <div>
          <dt>Outer pier radius</dt>
          <dd>{mm(check.outerConcretePierRadiusMm)}</dd>
        </div>
        <div>
          <dt>Centre pier radius</dt>
          <dd>{mm(check.centreConcretePierRadiusMm)}</dd>
        </div>
        <div>
          <dt>Door small piers</dt>
          <dd>{check.doorSideSmallConcretePierCount} piers</dd>
        </div>
        <div>
          <dt>Deck/steps</dt>
          <dd>
            {mm(check.deckWidthMm)} x {mm(check.deckDepthMm)}, {check.deckStepCount} treads
          </dd>
        </div>
      </dl>

      <div className="foundation-detail">
        <p>
          Every concrete pier column has a joist/crossmember line above it. The external floor rectangle and two
          doubled brace lines are 190x45 H3; the remaining internal pier-column joist line and infills are 140x45 H3
          at the selected {mm(spec.joistSpacingMm)} nominal spacing.
        </p>
        <p>
          Six 90x90 post-to-roof-frame tie points are modelled on the long walls for bolt spacing and tie-down
          review.
        </p>
        <p>
          Concrete pier radii: {check.outerConcretePierCount} outer/corner piers at{" "}
          {mm(check.outerConcretePierRadiusMm)}, {check.centreConcretePierCount} centre-row piers at{" "}
          {mm(check.centreConcretePierRadiusMm)}, and {check.doorSideSmallConcretePierCount} door-side non-corner
          piers at {mm(check.centreConcretePierRadiusMm)}.
        </p>
        <p>
          Concrete pier centres and posts sit on the original pier grid lines so the foundation aligns directly below
          the floor frame.
        </p>
      </div>

      <div className="foundation-warning-list">
        {check.warnings.map((warning) => (
          <article className={warning.severity} key={`${warning.title}-${warning.message}`}>
            <strong>{warning.title}</strong>
            <span>{warning.message}</span>
          </article>
        ))}
      </div>

      <div className="assumption-box">
        <h3>Assumptions</h3>
        <ul>
          <li>190x45 H3 treated pine external floor rectangle and two doubled crossmember brace lines.</li>
          <li>140x45 H3 treated pine for the remaining pier-column joist, infill joists, centre bearer allowance, walls, roof frame, and deck.</li>
          <li>90x90 H4 post/stump locations over concrete piers.</li>
          <li>Six 90x90 post-to-roof-frame tie points are shown for engineer-confirmed bolting.</li>
          <li>Outer/corner piers use 500mm radius; centre row and door-side non-corner piers use 300mm radius.</li>
          <li>Door side includes a treated timber deck and steps to ground.</li>
          <li>5 x 3 pier grid is the conservative default.</li>
          <li>Concept checker only; not AS-certified engineering.</li>
        </ul>
      </div>

      <div className="foundation-review">
        <ShieldAlert aria-hidden="true" />
        <span>Engineer to confirm soil, footing depth, uplift, bracing, tie-downs, corrosion class, and anchors.</span>
      </div>
    </section>
  );
}
