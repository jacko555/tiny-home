import type { TinyHomeSpec } from "../types";

export const mmToM = (valueMm: number) => valueMm / 1000;

export interface PierPosition {
  x: number;
  z: number;
  column: number;
  columnCount: number;
  row: number;
  rowCount: number;
}

export const OUTER_CONCRETE_PIER_RADIUS_M = 0.5;
export const CENTRE_CONCRETE_PIER_RADIUS_M = 0.3;
export const ROOF_END_OVERHANG_M = 0.22;
export const ROOF_END_OVERHANG_MM = ROOF_END_OVERHANG_M * 1000;

export function divisions(start: number, end: number, targetSpacing: number): number[] {
  const span = Math.abs(end - start);
  const steps = Math.max(1, Math.ceil(span / targetSpacing));
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    return start + (end - start) * t;
  });
}

export function pierPositions(spec: TinyHomeSpec): PierPosition[] {
  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const columns = Math.max(2, spec.pierColumns);
  const rows = Math.max(2, spec.pierRows);
  const positions: PierPosition[] = [];

  for (let column = 0; column < columns; column += 1) {
    const x = -lengthM / 2 + (lengthM * column) / (columns - 1);
    for (let row = 0; row < rows; row += 1) {
      const z = -widthM / 2 + (widthM * row) / (rows - 1);
      positions.push({ x, z, column, columnCount: columns, row, rowCount: rows });
    }
  }

  return positions;
}

export function isCentrePierRow(pier: Pick<PierPosition, "row" | "rowCount">): boolean {
  return pier.rowCount % 2 === 1 && pier.row === Math.floor(pier.rowCount / 2);
}

export function isDoorSideSmallPier(
  pier: Pick<PierPosition, "column" | "columnCount" | "row" | "rowCount">,
): boolean {
  return pier.row === pier.rowCount - 1 && pier.column > 0 && pier.column < pier.columnCount - 1;
}

export function concretePierRadiusM(
  pier: Pick<PierPosition, "column" | "columnCount" | "row" | "rowCount">,
): number {
  return isCentrePierRow(pier) || isDoorSideSmallPier(pier)
    ? CENTRE_CONCRETE_PIER_RADIUS_M
    : OUTER_CONCRETE_PIER_RADIUS_M;
}

export function concretePierCenterM(pier: PierPosition): { x: number; z: number } {
  return { x: pier.x, z: pier.z };
}

export function footingColumnCentersMm(spec: TinyHomeSpec): number[] {
  const columns = Math.max(2, Math.round(spec.pierColumns));
  return Array.from({ length: columns }, (_, column) => {
    return -spec.lengthMm / 2 + (spec.lengthMm * column) / (columns - 1);
  });
}

export function footingRowCentersMm(spec: TinyHomeSpec): number[] {
  const rows = Math.max(2, Math.round(spec.pierRows));
  return Array.from({ length: rows }, (_, row) => {
    return -spec.widthMm / 2 + (spec.widthMm * row) / (rows - 1);
  });
}

export function infillJoistCentersMm(spec: TinyHomeSpec): number[] {
  const footingCenters = footingColumnCentersMm(spec);
  const centers: number[] = [];

  for (let index = 0; index < footingCenters.length - 1; index += 1) {
    const start = footingCenters[index];
    const end = footingCenters[index + 1];
    const bayLength = Math.abs(end - start);
    const intervals = Math.max(1, Math.ceil(bayLength / spec.joistSpacingMm));

    for (let interval = 1; interval < intervals; interval += 1) {
      centers.push(start + ((end - start) * interval) / intervals);
    }
  }

  return centers;
}

export function crossmemberBraceCentersMm(spec: TinyHomeSpec): number[] {
  const internalPierColumns = footingColumnCentersMm(spec).slice(1, -1);

  if (internalPierColumns.length <= 2) {
    return internalPierColumns;
  }

  const targetCenters = [-spec.lengthMm / 4, spec.lengthMm / 4];
  const selected = targetCenters.reduce<number[]>((centers, target) => {
    const next = internalPierColumns
      .filter((center) => !centers.includes(center))
      .reduce((closest, center) => (Math.abs(center - target) < Math.abs(closest - target) ? center : closest));
    return [...centers, next];
  }, []);

  return selected.sort((a, b) => a - b);
}

export function bearingJoistCentersMm(spec: TinyHomeSpec): number[] {
  const braceCenters = crossmemberBraceCentersMm(spec);
  return footingColumnCentersMm(spec)
    .slice(1, -1)
    .filter((center) => braceCenters.every((braceCenter) => Math.abs(center - braceCenter) > 1));
}

export function roofTiePostCentersM(spec: TinyHomeSpec): { x: number; z: number }[] {
  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const internalPierColumns = footingColumnCentersMm(spec).slice(1, -1);
  const fallbackCenters = [-lengthM * 0.34, 0, lengthM * 0.34];
  const xCentersMm =
    internalPierColumns.length >= 3
      ? [internalPierColumns[0], internalPierColumns[Math.floor(internalPierColumns.length / 2)], internalPierColumns[internalPierColumns.length - 1]]
      : [];
  const xCenters = xCentersMm.length === 3 ? xCentersMm.map(mmToM) : fallbackCenters;

  return xCenters.flatMap((x) => [
    { x, z: -widthM / 2 },
    { x, z: widthM / 2 },
  ]);
}

export function roofHeightAt(spec: TinyHomeSpec, x: number, z: number): number {
  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const sideOverhangM = roofSideOverhangM(spec);
  const maxHeightM = mmToM(spec.maxHeightMm);
  const riseM = mmToM(spec.roofRiseMm);

  if (spec.roofFallDirection === "length") {
    const roofLengthM = lengthM + ROOF_END_OVERHANG_M * 2;
    const t =
      spec.roofHighSide === "rear"
        ? (lengthM / 2 + ROOF_END_OVERHANG_M - x) / roofLengthM
        : (x + lengthM / 2 + ROOF_END_OVERHANG_M) / roofLengthM;
    return maxHeightM - riseM * t;
  }

  const roofWidthM = widthM + sideOverhangM * 2;
  const t =
    spec.roofHighSide === "right"
      ? (widthM / 2 + sideOverhangM - z) / roofWidthM
      : (z + widthM / 2 + sideOverhangM) / roofWidthM;
  return maxHeightM - riseM * t;
}

export function roofHighSideLabel(spec: TinyHomeSpec): string {
  if (spec.roofFallDirection === "width") {
    return spec.roofHighSide === "right" ? "right 6m wall" : "left 6m wall";
  }

  return spec.roofHighSide === "rear" ? "rear 3m wall" : "front 3m wall";
}

export function roofLowSideLabel(spec: TinyHomeSpec): string {
  if (spec.roofFallDirection === "width") {
    return spec.roofHighSide === "right" ? "left 6m wall" : "right 6m wall";
  }

  return spec.roofHighSide === "rear" ? "front 3m wall" : "rear 3m wall";
}

export function roofRunM(spec: TinyHomeSpec): number {
  const slopeSpanM =
    spec.roofFallDirection === "length" ? roofLengthM(spec) : roofWidthM(spec);
  return Math.hypot(slopeSpanM, mmToM(spec.roofRiseMm));
}

export function roofSideOverhangM(spec: TinyHomeSpec): number {
  return mmToM(spec.roofSideOverhangMm);
}

export function roofWidthM(spec: TinyHomeSpec): number {
  return mmToM(spec.widthMm) + roofSideOverhangM(spec) * 2;
}

export function roofWidthMm(spec: TinyHomeSpec): number {
  return spec.widthMm + spec.roofSideOverhangMm * 2;
}

export function roofLengthM(spec: TinyHomeSpec): number {
  return mmToM(spec.lengthMm) + ROOF_END_OVERHANG_M * 2;
}

export function roofLengthMm(spec: TinyHomeSpec): number {
  return spec.lengthMm + ROOF_END_OVERHANG_MM * 2;
}
