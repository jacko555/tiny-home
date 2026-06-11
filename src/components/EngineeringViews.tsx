import type { TinyHomeSpec } from "../types";
import {
  bearingJoistCentersMm,
  concretePierCenterM,
  concretePierRadiusM,
  crossmemberBraceCentersMm,
  infillJoistCentersMm,
  pierPositions,
  roofTiePostCentersM,
  roofHighSideLabel,
  roofLowSideLabel,
} from "../lib/geometry";

interface EngineeringViewsProps {
  spec: TinyHomeSpec;
}

function pierGrid(spec: TinyHomeSpec, width: number, height: number, pad: number) {
  const points: { x: number; y: number; radius: number }[] = [];
  const lengthM = spec.lengthMm / 1000;
  const widthM = spec.widthMm / 1000;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  pierPositions(spec).forEach((pier) => {
    const center = concretePierCenterM(pier);
    const x = pad + innerW * ((center.x + lengthM / 2) / lengthM);
    const y = pad + innerH * ((center.z + widthM / 2) / widthM);
    const radiusM = concretePierRadiusM(pier);
    points.push({ x, y, radius: radiusM === 0.3 ? 7 : 11 });
  });

  return points;
}

function PlanView({ spec }: EngineeringViewsProps) {
  const width = 520;
  const height = 310;
  const pad = 42;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const studCount = Math.ceil(spec.lengthMm / spec.studSpacingMm);
  const highY = spec.roofHighSide === "right" ? pad + innerH : pad;
  const lowY = spec.roofHighSide === "right" ? pad : pad + innerH;
  const xFromMm = (valueMm: number) => pad + innerW * ((valueMm + spec.lengthMm / 2) / spec.lengthMm);
  const yFromMm = (valueMm: number) => pad + innerH * ((valueMm + spec.widthMm / 2) / spec.widthMm);
  const doubleGapX = Math.max(3.5, (innerW * 74) / spec.lengthMm);
  const crossmemberCentersMm = crossmemberBraceCentersMm(spec);
  const doubledCrossmemberX = crossmemberCentersMm.flatMap((centerMm) => {
    const x = xFromMm(centerMm);
    return [x - doubleGapX / 2, x + doubleGapX / 2];
  });
  const infillJoistX = infillJoistCentersMm(spec)
    .filter((valueMm) => crossmemberCentersMm.every((centerMm) => Math.abs(valueMm - centerMm) > 180))
    .map(xFromMm);
  const bearingJoist140X = bearingJoistCentersMm(spec).map(xFromMm);
  const roofTiePosts = roofTiePostCentersM(spec).map((post) => ({
    x: xFromMm(post.x * 1000),
    y: yFromMm(post.z * 1000),
  }));
  const pierSpacingLengthMm = spec.lengthMm / Math.max(1, spec.pierColumns - 1);
  const pierSpacingWidthMm = spec.widthMm / Math.max(1, spec.pierRows - 1);
  const doorX = pad + innerW * 0.16;
  const deckW = innerW * (1900 / spec.lengthMm);
  const deckD = innerH * (1150 / spec.widthMm);
  const deckX = doorX - deckW / 2;
  const deckY = pad + innerH + 9;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Plan view">
      <rect x="0" y="0" width={width} height={height} rx="8" className="drawing-bg" />
      <rect x={pad} y={pad} width={innerW} height={innerH} className="plan-shell" />

      {spec.layers.exterior && <rect x={pad + 5} y={pad + 5} width={innerW - 10} height={innerH - 10} className="plan-cladding" />}

      {spec.layers.floorFrame && (
        <g className="floor-frame-lines">
          <rect x={pad} y={pad} width={innerW} height={innerH} className="frame-190-perimeter" />
          {doubledCrossmemberX.map((x, index) => (
            <line key={`double-190-crossmember-${index}`} x1={x} y1={pad} x2={x} y2={pad + innerH} className="frame-line footing" />
          ))}
          {bearingJoist140X.map((x, index) => (
            <line key={`bearing-140-pier-joist-${index}`} x1={x} y1={pad} x2={x} y2={pad + innerH} className="frame-line bearing140" />
          ))}
          <line x1={pad} y1={pad + innerH / 2} x2={pad + innerW} y2={pad + innerH / 2} className="frame-line bearer140" />
          {infillJoistX.map((x, index) => (
            <line key={`single-infill-joist-${index}`} x1={x} y1={pad} x2={x} y2={pad + innerH} className="frame-line light" />
          ))}
        </g>
      )}

      {spec.layers.wallFrame &&
        Array.from({ length: studCount + 1 }, (_, index) => {
          const x = pad + (innerW * index) / studCount;
          return (
            <g key={`stud-${index}`}>
              <line x1={x} y1={pad - 5} x2={x} y2={pad + 10} className="frame-line" />
              <line x1={x} y1={pad + innerH - 10} x2={x} y2={pad + innerH + 5} className="frame-line" />
            </g>
          );
        })}

      {spec.layers.foundation &&
        pierGrid(spec, width, height, pad).map((point, index) => (
          <circle key={`pier-${index}`} cx={point.x} cy={point.y} r={point.radius} className="pier-dot" />
        ))}
      {spec.layers.wallFrame &&
        roofTiePosts.map((point, index) => (
          <rect
            key={`roof-tie-plan-${index}`}
            x={point.x - 4.5}
            y={point.y - 4.5}
            width="9"
            height="9"
            rx="2"
            className="roof-tie-marker"
          />
        ))}

      {spec.openings.frontDoor && <rect x={pad + innerW * 0.12} y={pad + innerH - 7} width="70" height="14" className="opening-door" />}
      {spec.openings.frontDoor && (
        <g className="plan-deck">
          <rect x={deckX} y={deckY} width={deckW} height={deckD} rx="5" />
          {Array.from({ length: 4 }, (_, index) => (
            <rect key={`plan-step-${index}`} x={doorX - deckW * 0.33} y={deckY + deckD + 5 + index * 12} width={deckW * 0.66} height="8" rx="3" />
          ))}
          <text x={deckX} y={deckY + deckD + 61}>
            timber deck + steps
          </text>
        </g>
      )}
      {spec.openings.sideWindow && <rect x={pad + innerW * 0.58} y={pad - 7} width="80" height="14" className="opening-window" />}
      {spec.openings.rearWindow && <rect x={pad + innerW - 10} y={pad + innerH * 0.58} width="14" height="70" className="opening-window" />}

      {spec.roofFallDirection === "width" && (
        <g className="roof-slope-markers">
          <line x1={pad + innerW * 0.5} y1={highY} x2={pad + innerW * 0.5} y2={lowY} className="slope-arrow" />
          <polygon
            points={`${pad + innerW * 0.5 - 6},${lowY - (spec.roofHighSide === "right" ? -10 : 10)} ${pad + innerW * 0.5 + 6},${lowY - (spec.roofHighSide === "right" ? -10 : 10)} ${pad + innerW * 0.5},${lowY}`}
            className="slope-arrow-head"
          />
          <text x={pad + 12} y={highY + (spec.roofHighSide === "right" ? -12 : 22)} className="high-label">
            HIGH {roofHighSideLabel(spec)}
          </text>
          <text x={pad + innerW - 126} y={lowY + (spec.roofHighSide === "right" ? 22 : -12)} className="low-label">
            LOW {roofLowSideLabel(spec)}
          </text>
        </g>
      )}

      <line x1={pad} y1={height - 22} x2={pad + innerW} y2={height - 22} className="dimension-line" />
      <text x={width / 2} y={height - 27} textAnchor="middle" className="drawing-label">
        {(spec.lengthMm / 1000).toFixed(1)}m length, piers @ {Math.round(pierSpacingLengthMm)}mm
      </text>
      <line x1={width - 22} y1={pad} x2={width - 22} y2={pad + innerH} className="dimension-line" />
      <text x={width - 28} y={height / 2} textAnchor="middle" transform={`rotate(-90 ${width - 28} ${height / 2})`} className="drawing-label">
        {(spec.widthMm / 1000).toFixed(1)}m width, piers @ {Math.round(pierSpacingWidthMm)}mm
      </text>
      <text x={pad} y="25" className="drawing-title">
        Plan: {spec.pierColumns} x {spec.pierRows} piers, joist line over every pier column
      </text>
      <g className="floor-callout">
        <rect x={pad + 6} y={pad + innerH - 34} width="334" height="24" rx="6" />
        <text x={pad + 16} y={pad + innerH - 18}>
          190 perimeter/braces; 140 over centre pier + infills
        </text>
      </g>
      {spec.layers.floorFrame && (
        <g className="floor-legend">
          <line x1={pad + innerW - 150} y1={pad + 20} x2={pad + innerW - 122} y2={pad + 20} className="frame-line footing" />
          <text x={pad + innerW - 116} y={pad + 24}>
            190 brace
          </text>
          <line x1={pad + innerW - 150} y1={pad + 39} x2={pad + innerW - 122} y2={pad + 39} className="frame-line light" />
          <text x={pad + innerW - 116} y={pad + 43}>
            140 infill
          </text>
          <line x1={pad + innerW - 150} y1={pad + 58} x2={pad + innerW - 122} y2={pad + 58} className="frame-line bearing140" />
          <text x={pad + innerW - 116} y={pad + 62}>
            140 over pier
          </text>
          <rect x={pad + innerW - 154} y={pad + 71} width="9" height="9" rx="2" className="roof-tie-marker" />
          <text x={pad + innerW - 116} y={pad + 81}>
            roof tie post
          </text>
        </g>
      )}
    </svg>
  );
}

function ElevationView({ spec }: EngineeringViewsProps) {
  const width = 520;
  const height = 310;
  const padX = 42;
  const groundY = 260;
  const drawableH = 210;
  const scaleY = drawableH / 3200;
  const x0 = padX;
  const x1 = width - padX;
  const floorY = groundY - spec.floorHeightMm * scaleY;
  const highY = groundY - spec.maxHeightMm * scaleY;
  const lowY = groundY - (spec.maxHeightMm - spec.roofRiseMm) * scaleY;
  const roofY0 = spec.roofFallDirection === "length" ? highY : highY;
  const roofY1 = spec.roofFallDirection === "length" ? lowY : highY;
  const profileHighX = spec.roofHighSide === "right" ? 100 : 0;
  const profileLowX = spec.roofHighSide === "right" ? 0 : 100;
  const sideLabel =
    spec.roofFallDirection === "length"
      ? `roof falls ${(spec.roofRiseMm / 1000).toFixed(2)}m along length`
      : `roof falls ${(spec.roofRiseMm / 1000).toFixed(2)}m across width`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Side elevation">
      <rect x="0" y="0" width={width} height={height} rx="8" className="drawing-bg" />
      <line x1="24" y1={groundY} x2={width - 20} y2={groundY} className="ground-line" />
      <line x1={x0} y1={floorY} x2={x1} y2={floorY} className="floor-line" />

      {Array.from({ length: spec.pierColumns }, (_, index) => {
        const x = x0 + ((x1 - x0) * index) / Math.max(1, spec.pierColumns - 1);
        return (
          <g key={`elev-pier-${index}`}>
            <rect x={x - 7} y={floorY} width="14" height={groundY - floorY} className="elev-post" />
            <ellipse cx={x} cy={groundY - 5} rx="16" ry="8" className="elev-pier" />
          </g>
        );
      })}

      {spec.layers.exterior && (
        <polygon points={`${x0},${floorY} ${x1},${floorY} ${x1},${roofY1} ${x0},${roofY0}`} className="elev-cladding" />
      )}

      {spec.layers.wallFrame &&
        Array.from({ length: Math.ceil(spec.lengthMm / spec.studSpacingMm) + 1 }, (_, index) => {
          const count = Math.ceil(spec.lengthMm / spec.studSpacingMm);
          const x = x0 + ((x1 - x0) * index) / count;
          const topY = roofY0 + ((roofY1 - roofY0) * index) / count;
          return <line key={`elev-stud-${index}`} x1={x} y1={floorY} x2={x} y2={topY} className="frame-line" />;
        })}

      {spec.layers.roofFrame && <line x1={x0 - 12} y1={roofY0 - 4} x2={x1 + 12} y2={roofY1 - 4} className="roof-line" />}
      <polyline points={`${x0},${floorY} ${x0},${roofY0} ${x1},${roofY1} ${x1},${floorY}`} className="outline-line" />

      <line x1={width - 26} y1={groundY} x2={width - 26} y2={highY} className="dimension-line" />
      <text x={width - 33} y={(groundY + highY) / 2} textAnchor="middle" transform={`rotate(-90 ${width - 33} ${(groundY + highY) / 2})`} className="drawing-label">
        {(spec.maxHeightMm / 1000).toFixed(1)}m max
      </text>
      <text x={padX} y="25" className="drawing-title">
        Elevation: {sideLabel}; high side is {roofHighSideLabel(spec)}
      </text>
      {spec.roofFallDirection === "width" && (
        <g transform="translate(335 62)">
          <text x="0" y="-9" className="micro-label">
            end profile
          </text>
          <polyline
            points={`0,70 0,${profileHighX === 0 ? 10 : 28} 100,${profileHighX === 100 ? 10 : 28} 100,70`}
            className="outline-line"
          />
          <line x1={profileHighX} y1="10" x2={profileLowX} y2="28" className="roof-line" />
          <text x={profileHighX === 0 ? -2 : 72} y="6" className="high-label">
            HIGH
          </text>
          <text x={profileLowX === 0 ? -2 : 78} y="44" className="low-label">
            LOW
          </text>
          <text x="-20" y="91" className="micro-label">
            {roofHighSideLabel(spec)} to {roofLowSideLabel(spec)}
          </text>
        </g>
      )}
    </svg>
  );
}

export function EngineeringViews({ spec }: EngineeringViewsProps) {
  return (
    <section className="panel drawing-panel" aria-label="Engineering views">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">2D drafting</p>
          <h2>Plan and elevation</h2>
        </div>
      </div>
      <div className="drawing-grid">
        <PlanView spec={spec} />
        <ElevationView spec={spec} />
      </div>
    </section>
  );
}
