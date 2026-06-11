export type LayerKey =
  | "foundation"
  | "floorFrame"
  | "floorFinish"
  | "wallFrame"
  | "roofFrame"
  | "exterior"
  | "interior"
  | "fixings";

export type ViewMode = "mixed" | "frame" | "exterior" | "interior" | "roof" | "floor" | "fixings";

export type RoofFallDirection = "length" | "width";
export type RoofHighSide = "left" | "right" | "front" | "rear";
export type FlooringStack = "structural-and-finish" | "structural-only" | "finish-only";
export type TextureId =
  | "treatedPine"
  | "concretePier"
  | "surfmistColorbond"
  | "structuralPlywood"
  | "timberFloorboards"
  | "whiteWindowGlass"
  | "aluminiumWindow"
  | "frontDoor";

export interface OpeningSpec {
  frontDoor: boolean;
  sideWindow: boolean;
  rearWindow: boolean;
}

export interface TinyHomeSpec {
  lengthMm: number;
  widthMm: number;
  maxHeightMm: number;
  floorHeightMm: number;
  roofRiseMm: number;
  roofFallDirection: RoofFallDirection;
  roofHighSide: RoofHighSide;
  flooringStack: FlooringStack;
  selectedTextureSet: "generated-v2";
  pierColumns: number;
  pierRows: number;
  studSpacingMm: number;
  joistSpacingMm: number;
  rafterSpacingMm: number;
  wastePercent: number;
  viewMode: ViewMode;
  layers: Record<LayerKey, boolean>;
  openings: OpeningSpec;
}

export type MaterialUnit = "length" | "each" | "area" | "allowance";
export type MaterialSourceType = "bunnings" | "generated" | "allowance";
export type MaterialConfidence = "verified-link" | "editable-estimate" | "allowance";

export type MaterialCategory =
  | "foundation"
  | "framing"
  | "roofing"
  | "cladding"
  | "flooring"
  | "openings"
  | "fixings";

export type AssemblyStage =
  | "foundation"
  | "floor"
  | "wall-frame"
  | "roof"
  | "envelope"
  | "openings"
  | "interior-floor";

export interface Material {
  id: string;
  name: string;
  sourceUrl?: string;
  productCode?: string;
  category: MaterialCategory;
  treatmentGrade?: string;
  dimensionsMm?: string;
  stockLengthMm?: number;
  unit: MaterialUnit;
  unitPrice: number;
  pricingLabel: string;
  sourceType: MaterialSourceType;
  confidence: MaterialConfidence;
  coverage?: number;
  packQuantity?: number;
  formulaGroup: AssemblyStage;
  textureId?: TextureId;
  notes: string;
}

export interface MaterialEstimate {
  materialId: string;
  label: string;
  category: MaterialCategory;
  requiredQuantity: number;
  requiredLabel: string;
  purchaseQuantity: number;
  purchaseLabel: string;
  wasteQuantity: number;
  estimatedCost: number;
  formulaExplanation: string;
  breakdown?: string[];
  requiredReview: boolean;
  assemblyStage: AssemblyStage;
  notes: string[];
}

export interface DesignWarning {
  severity: "info" | "warning" | "danger";
  title: string;
  message: string;
}

export interface FoundationCheck {
  pierSpacingLengthMm: number;
  pierSpacingWidthMm: number;
  footingColumnCount: number;
  footingRowCount: number;
  doubledCrossmember190MemberCount: number;
  bearingJoist140Count: number;
  singleInfillJoistCount: number;
  externalFrame190LengthMm: number;
  doubledCrossmember190Count: number;
  roofTiePostCount: number;
  roofTieBoltSetCount: number;
  outerConcretePierCount: number;
  centreConcretePierCount: number;
  doorSideSmallConcretePierCount: number;
  outerConcretePierRadiusMm: number;
  centreConcretePierRadiusMm: number;
  deckStepCount: number;
  deckWidthMm: number;
  deckDepthMm: number;
  maxConceptPierSpacingMm: number;
  maxBaySpacingMm: number;
  floorHeightMm: number;
  postHeightMm: number;
  warnings: DesignWarning[];
}

export interface GeneratedTexture {
  id: TextureId;
  label: string;
  filePath: string;
  intendedUse: string;
  repeatScale: [number, number];
  fallbackColor: string;
}
