import {
  Box,
  Building,
  Construction,
  DoorOpen,
  Eye,
  Grid3X3,
  Home,
  Layers,
  PanelTop,
  Ruler,
  SquareDashed,
  Wrench,
} from "lucide-react";
import type { FlooringStack, LayerKey, RoofFallDirection, RoofHighSide, TinyHomeSpec, ViewMode } from "../types";
import { layerLabels, viewPresets } from "../lib/spec";
import { roofHighSideLabel, roofLowSideLabel, roofWidthM } from "../lib/geometry";

interface ControlsPanelProps {
  spec: TinyHomeSpec;
  onSpecChange: (patch: Partial<TinyHomeSpec>) => void;
  onLayerToggle: (layer: LayerKey) => void;
  onOpeningToggle: (opening: keyof TinyHomeSpec["openings"]) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

const layerIcons: Record<LayerKey, typeof Box> = {
  foundation: Building,
  floorFrame: SquareDashed,
  floorFinish: Construction,
  wallFrame: Grid3X3,
  roofFrame: PanelTop,
  exterior: Home,
  interior: DoorOpen,
  fixings: Wrench,
};

function NumberField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
        <strong>
          {value}
          {unit}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      <input
        className="number-input"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

export function ControlsPanel({
  spec,
  onSpecChange,
  onLayerToggle,
  onOpeningToggle,
  onViewModeChange,
}: ControlsPanelProps) {
  return (
    <aside className="panel controls-panel" aria-label="Design controls">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Inspector</p>
          <h2>Design controls</h2>
        </div>
        <Ruler aria-hidden="true" />
      </div>

      <div className="control-section">
        <h3>View mode</h3>
        <div className="segmented-control">
          {(["mixed", "frame", "floor", "roof", "exterior", "interior", "fixings"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={spec.viewMode === mode ? "is-active" : ""}
              onClick={() => onViewModeChange(mode)}
              title={`Show ${mode} preset`}
              type="button"
            >
              <Eye aria-hidden="true" />
              <span>{mode}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <h3>Layers</h3>
        <div className="layer-grid">
          {(Object.keys(layerLabels) as LayerKey[]).map((layer) => {
            const Icon = layerIcons[layer];
            return (
              <button
                key={layer}
                className={spec.layers[layer] ? "layer-toggle is-active" : "layer-toggle"}
                onClick={() => onLayerToggle(layer)}
                title={`Toggle ${layerLabels[layer]}`}
                type="button"
              >
                <Icon aria-hidden="true" />
                <span>{layerLabels[layer]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="control-section">
        <h3>Dimensions</h3>
        <NumberField label="Length" value={spec.lengthMm} min={3000} max={8000} step={100} unit="mm" onChange={(lengthMm) => onSpecChange({ lengthMm })} />
        <NumberField label="Width" value={spec.widthMm} min={1800} max={4200} step={100} unit="mm" onChange={(widthMm) => onSpecChange({ widthMm })} />
        <NumberField label="Max finished height" value={spec.maxHeightMm} min={2200} max={3600} step={50} unit="mm" onChange={(maxHeightMm) => onSpecChange({ maxHeightMm })} />
        <NumberField label="Floor above ground" value={spec.floorHeightMm} min={250} max={900} step={25} unit="mm" onChange={(floorHeightMm) => onSpecChange({ floorHeightMm })} />
      </div>

      <div className="control-section">
        <h3>Roof and frame</h3>
        <label className="select-field">
          <span>Roof fall direction</span>
          <select
            value={spec.roofFallDirection}
            onChange={(event) => onSpecChange({ roofFallDirection: event.currentTarget.value as RoofFallDirection })}
          >
            <option value="length">Along 6m length</option>
            <option value="width">Across 3m width</option>
          </select>
        </label>
        <label className="select-field">
          <span>High side</span>
          <select
            value={spec.roofHighSide}
            onChange={(event) => onSpecChange({ roofHighSide: event.currentTarget.value as RoofHighSide })}
          >
            {spec.roofFallDirection === "width" ? (
              <>
                <option value="left">Left 6m wall high</option>
                <option value="right">Right 6m wall high</option>
              </>
            ) : (
              <>
                <option value="front">Front 3m wall high</option>
                <option value="rear">Rear 3m wall high</option>
              </>
            )}
          </select>
        </label>
        <div className="roof-callout">
          <strong>High:</strong> {roofHighSideLabel(spec)}
          <span>
            <strong>Low:</strong> {roofLowSideLabel(spec)}
          </span>
          <span>
            <strong>Roof width:</strong> {roofWidthM(spec).toFixed(1)}m incl. eaves
          </span>
        </div>
        <NumberField label="Roof rise" value={spec.roofRiseMm} min={120} max={900} step={25} unit="mm" onChange={(roofRiseMm) => onSpecChange({ roofRiseMm })} />
        <NumberField
          label="Side roof overhang"
          value={spec.roofSideOverhangMm}
          min={0}
          max={900}
          step={25}
          unit="mm"
          onChange={(roofSideOverhangMm) => onSpecChange({ roofSideOverhangMm })}
        />
        <NumberField label="Stud spacing" value={spec.studSpacingMm} min={300} max={900} step={50} unit="mm" onChange={(studSpacingMm) => onSpecChange({ studSpacingMm })} />
        <NumberField label="Joist spacing" value={spec.joistSpacingMm} min={300} max={900} step={50} unit="mm" onChange={(joistSpacingMm) => onSpecChange({ joistSpacingMm })} />
        <NumberField label="Rafter spacing" value={spec.rafterSpacingMm} min={300} max={900} step={50} unit="mm" onChange={(rafterSpacingMm) => onSpecChange({ rafterSpacingMm })} />
      </div>

      <div className="control-section">
        <h3>Floor stack</h3>
        <label className="select-field">
          <span>Timber flooring</span>
          <select
            value={spec.flooringStack}
            onChange={(event) => onSpecChange({ flooringStack: event.currentTarget.value as FlooringStack })}
          >
            <option value="structural-and-finish">Structural sheet + timber boards</option>
            <option value="structural-only">Structural sheet only</option>
            <option value="finish-only">Timber boards only</option>
          </select>
        </label>
      </div>

      <div className="control-section">
        <h3>Foundation</h3>
        <div className="inline-fields">
          <label>
            Pier columns
            <input type="number" min="2" max="8" value={spec.pierColumns} onChange={(event) => onSpecChange({ pierColumns: Number(event.currentTarget.value) })} />
          </label>
          <label>
            Pier rows
            <input type="number" min="2" max="5" value={spec.pierRows} onChange={(event) => onSpecChange({ pierRows: Number(event.currentTarget.value) })} />
          </label>
        </div>
      </div>

      <div className="control-section">
        <h3>Openings</h3>
        <div className="checkbox-list">
          <label>
            <input type="checkbox" checked={spec.openings.frontDoor} onChange={() => onOpeningToggle("frontDoor")} />
            Front door placeholder
          </label>
          <label>
            <input type="checkbox" checked={spec.openings.sideWindow} onChange={() => onOpeningToggle("sideWindow")} />
            Side window placeholder
          </label>
          <label>
            <input type="checkbox" checked={spec.openings.rearWindow} onChange={() => onOpeningToggle("rearWindow")} />
            Rear window placeholder
          </label>
        </div>
      </div>

      <div className="control-section">
        <h3>Estimate</h3>
        <NumberField label="Waste allowance" value={spec.wastePercent} min={0} max={25} step={1} unit="%" onChange={(wastePercent) => onSpecChange({ wastePercent })} />
      </div>

      <div className="control-footnote">
        <Layers aria-hidden="true" />
        <span>Presets update layers using {Object.keys(viewPresets).length} saved combinations.</span>
      </div>
    </aside>
  );
}
