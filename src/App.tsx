import { useMemo, useState } from "react";
import { Cuboid, DraftingCompass, Hammer, Rotate3D } from "lucide-react";
import { ControlsPanel } from "./components/ControlsPanel";
import { EngineeringViews } from "./components/EngineeringViews";
import { MaterialsPanel } from "./components/MaterialsPanel";
import { Scene3D } from "./components/Scene3D";
import { WarningsPanel } from "./components/WarningsPanel";
import { TextureLibrary } from "./components/TextureLibrary";
import { AssemblyChecklist } from "./components/AssemblyChecklist";
import { FoundationCheckPanel } from "./components/FoundationCheckPanel";
import { initialMaterials } from "./data/materials";
import { calculateEstimates, calculateFoundationCheck, designWarnings, totalEstimate } from "./lib/estimates";
import { roofHighSideLabel, roofLowSideLabel } from "./lib/geometry";
import { clampSpec, defaultSpec, viewPresets } from "./lib/spec";
import type { LayerKey, Material, TinyHomeSpec, ViewMode } from "./types";

function App() {
  const [spec, setSpec] = useState<TinyHomeSpec>(defaultSpec);
  const [materials, setMaterials] = useState<Record<string, Material>>(initialMaterials);

  const estimates = useMemo(() => calculateEstimates(spec, materials), [spec, materials]);
  const foundationCheck = useMemo(() => calculateFoundationCheck(spec), [spec]);
  const warnings = useMemo(() => designWarnings(spec), [spec]);
  const estimateTotal = useMemo(() => totalEstimate(estimates), [estimates]);
  const floorSummary =
    spec.flooringStack === "structural-and-finish"
      ? "timber boards over structural sheet"
      : spec.flooringStack === "structural-only"
        ? "structural sheet only"
        : "timber boards only";

  const updateSpec = (patch: Partial<TinyHomeSpec>) => {
    setSpec((current) => clampSpec({ ...current, ...patch }));
  };

  const toggleLayer = (layer: LayerKey) => {
    setSpec((current) => ({
      ...current,
      layers: {
        ...current.layers,
        [layer]: !current.layers[layer],
      },
    }));
  };

  const toggleOpening = (opening: keyof TinyHomeSpec["openings"]) => {
    setSpec((current) => ({
      ...current,
      openings: {
        ...current.openings,
        [opening]: !current.openings[opening],
      },
    }));
  };

  const setViewMode = (mode: ViewMode) => {
    setSpec((current) => ({
      ...current,
      viewMode: mode,
      layers: viewPresets[mode],
    }));
  };

  const updatePrice = (materialId: string, unitPrice: number) => {
    setMaterials((current) => ({
      ...current,
      [materialId]: {
        ...current[materialId],
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      },
    }));
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Tiny home concept tool</p>
          <h1>6m x 3m raised frame designer</h1>
        </div>
        <div className="header-stats" aria-label="Design summary">
          <span>
            <Cuboid aria-hidden="true" />
            {(spec.lengthMm / 1000).toFixed(1)}m x {(spec.widthMm / 1000).toFixed(1)}m
          </span>
          <span>
            <Rotate3D aria-hidden="true" />
            {roofHighSideLabel(spec)} high
          </span>
          <span>
            <Hammer aria-hidden="true" />
            AUD{" "}
            {new Intl.NumberFormat("en-AU", {
              style: "currency",
              currency: "AUD",
              maximumFractionDigits: 0,
            }).format(estimateTotal)}
          </span>
        </div>
      </header>

      <div className="workspace-grid">
        <ControlsPanel
          spec={spec}
          onSpecChange={updateSpec}
          onLayerToggle={toggleLayer}
          onOpeningToggle={toggleOpening}
          onViewModeChange={setViewMode}
        />

        <section className="model-column">
          <section className="panel model-panel" aria-label="3D model">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Interactive model</p>
                <h2>Frame, shell, and material views</h2>
              </div>
              <DraftingCompass aria-hidden="true" />
            </div>
            <Scene3D spec={spec} />
            <div className="model-meta">
              <span>Drag to orbit</span>
              <span>Scroll to zoom</span>
              <span>Roof falls to {roofLowSideLabel(spec)}</span>
              <span>Floor: {floorSummary}</span>
            </div>
          </section>

          <WarningsPanel warnings={warnings} />
          <FoundationCheckPanel spec={spec} check={foundationCheck} />
          <EngineeringViews spec={spec} />
          <TextureLibrary />
          <AssemblyChecklist spec={spec} estimates={estimates} />

          <section className="panel reference-panel" aria-label="Uploaded reference sketch">
            <div>
              <p className="eyebrow">Reference sketch</p>
              <h2>Uploaded room concept</h2>
              <p>
                The generated model keeps the sketch intent: concrete pier grid, timber frame, 6m x 3m footprint,
                single-slope roof, and a 3m maximum height target.
              </p>
            </div>
            <img src="/room-reference.png" alt="Uploaded tiny home sketch showing pier grid and sloped roof" />
          </section>
        </section>

        <MaterialsPanel materials={materials} estimates={estimates} onPriceChange={updatePrice} />
      </div>
    </main>
  );
}

export default App;
