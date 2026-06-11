import type { LayerKey, TinyHomeSpec, ViewMode } from "../types";

export const defaultSpec: TinyHomeSpec = {
  lengthMm: 6000,
  widthMm: 3000,
  maxHeightMm: 3000,
  floorHeightMm: 450,
  roofRiseMm: 350,
  roofSideOverhangMm: 500,
  roofFallDirection: "width",
  roofHighSide: "right",
  flooringStack: "structural-and-finish",
  selectedTextureSet: "generated-v2",
  pierColumns: 5,
  pierRows: 3,
  studSpacingMm: 600,
  joistSpacingMm: 600,
  rafterSpacingMm: 600,
  wastePercent: 12,
  viewMode: "mixed",
  layers: {
    foundation: true,
    floorFrame: true,
    floorFinish: true,
    wallFrame: true,
    roofFrame: true,
    exterior: true,
    interior: true,
    fixings: true,
  },
  openings: {
    frontDoor: true,
    sideWindow: true,
    rearWindow: true,
  },
};

export const layerLabels: Record<LayerKey, string> = {
  foundation: "Foundation",
  floorFrame: "Floor frame",
  floorFinish: "Floor finish",
  wallFrame: "Wall frame",
  roofFrame: "Roof frame",
  exterior: "Exterior",
  interior: "Interior",
  fixings: "Fixings",
};

export const viewPresets: Record<ViewMode, Record<LayerKey, boolean>> = {
  mixed: {
    foundation: true,
    floorFrame: true,
    floorFinish: true,
    wallFrame: true,
    roofFrame: true,
    exterior: true,
    interior: true,
    fixings: true,
  },
  frame: {
    foundation: true,
    floorFrame: true,
    floorFinish: false,
    wallFrame: true,
    roofFrame: true,
    exterior: false,
    interior: false,
    fixings: true,
  },
  exterior: {
    foundation: true,
    floorFrame: false,
    floorFinish: false,
    wallFrame: false,
    roofFrame: false,
    exterior: true,
    interior: false,
    fixings: false,
  },
  interior: {
    foundation: false,
    floorFrame: true,
    floorFinish: true,
    wallFrame: true,
    roofFrame: false,
    exterior: false,
    interior: true,
    fixings: false,
  },
  roof: {
    foundation: false,
    floorFrame: false,
    floorFinish: false,
    wallFrame: true,
    roofFrame: true,
    exterior: true,
    interior: false,
    fixings: true,
  },
  floor: {
    foundation: true,
    floorFrame: true,
    floorFinish: true,
    wallFrame: false,
    roofFrame: false,
    exterior: false,
    interior: true,
    fixings: true,
  },
  fixings: {
    foundation: true,
    floorFrame: true,
    floorFinish: false,
    wallFrame: true,
    roofFrame: true,
    exterior: false,
    interior: false,
    fixings: true,
  },
};

export function clampSpec(spec: TinyHomeSpec): TinyHomeSpec {
  return {
    ...spec,
    lengthMm: clamp(spec.lengthMm, 3000, 8000),
    widthMm: clamp(spec.widthMm, 1800, 4200),
    maxHeightMm: clamp(spec.maxHeightMm, 2200, 3600),
    floorHeightMm: clamp(spec.floorHeightMm, 250, 900),
    roofRiseMm: clamp(spec.roofRiseMm, 120, 900),
    roofSideOverhangMm: clamp(spec.roofSideOverhangMm, 0, 900),
    pierColumns: clamp(Math.round(spec.pierColumns), 2, 8),
    pierRows: clamp(Math.round(spec.pierRows), 2, 5),
    studSpacingMm: clamp(spec.studSpacingMm, 300, 900),
    joistSpacingMm: clamp(spec.joistSpacingMm, 300, 900),
    rafterSpacingMm: clamp(spec.rafterSpacingMm, 300, 900),
    wastePercent: clamp(spec.wastePercent, 0, 25),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
