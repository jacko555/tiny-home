import type { DesignWarning, FoundationCheck, Material, MaterialEstimate, TinyHomeSpec } from "../types";
import {
  bearingJoistCentersMm,
  CENTRE_CONCRETE_PIER_RADIUS_M,
  crossmemberBraceCentersMm,
  OUTER_CONCRETE_PIER_RADIUS_M,
  footingColumnCentersMm,
  footingRowCentersMm,
  infillJoistCentersMm,
  ROOF_END_OVERHANG_MM,
  roofLengthM,
  roofLengthMm,
  roofTiePostCentersM,
  roofRunM,
  roofWidthM,
  roofWidthMm,
} from "./geometry";

const MAX_CONCEPT_PIER_SPACING_MM = 1500;
const DEFAULT_FLOOR_HEIGHT_MM = 520;
const DOOR_DECK_WIDTH_MM = 1900;
const DOOR_DECK_DEPTH_MM = 1150;
const ROOF_TIE_BOLT_SETS_PER_POST = 2;

const round1 = (value: number) => Math.round(value * 10) / 10;
const round2 = (value: number) => Math.round(value * 100) / 100;

function piecesForLength(requiredMm: number, wastePercent: number, stockLengthMm = 1): number {
  return Math.ceil((requiredMm * (1 + wastePercent / 100)) / stockLengthMm);
}

function spacedCount(spanMm: number, spacingMm: number): number {
  return Math.ceil(spanMm / spacingMm) + 1;
}

function packCount(requiredEach: number, packQuantity = 1): number {
  return Math.ceil(requiredEach / Math.max(1, packQuantity));
}

export function calculateFoundationCheck(spec: TinyHomeSpec): FoundationCheck {
  const footingColumnCount = footingColumnCentersMm(spec).length;
  const footingRowCount = footingRowCentersMm(spec).length;
  const pierSpacingLengthMm = spec.lengthMm / Math.max(1, footingColumnCount - 1);
  const pierSpacingWidthMm = spec.widthMm / Math.max(1, footingRowCount - 1);
  const singleInfillJoistCount = infillJoistCentersMm(spec).length;
  const hasCentrePierRow = footingRowCount % 2 === 1;
  const centreConcretePierCount = hasCentrePierRow ? footingColumnCount : 0;
  const doorSideSmallConcretePierCount = Math.max(0, footingColumnCount - 2);
  const outerConcretePierCount =
    footingColumnCount * footingRowCount - centreConcretePierCount - doorSideSmallConcretePierCount;
  const deckStepCount = spec.openings.frontDoor
    ? Math.max(3, Math.ceil((spec.floorHeightMm + 205) / 170))
    : 0;
  const doubledCrossmember190Count = crossmemberBraceCentersMm(spec).length;
  const bearingJoist140Count = bearingJoistCentersMm(spec).length;
  const roofTiePostCount = roofTiePostCentersM(spec).length;
  const externalFrame190LengthMm =
    2 * spec.lengthMm + 2 * spec.widthMm + doubledCrossmember190Count * 2 * spec.widthMm;
  const warnings: DesignWarning[] = [
    {
      severity: "info",
      title: "Engineer review required",
      message:
        "Footing depth, soil bearing, uplift, bracing, tie-down path, termite clearance, and anchor schedules are not certified by this app.",
    },
  ];

  if (spec.pierColumns < 5 || spec.pierRows < 3) {
    warnings.push({
      severity: "danger",
      title: "Reduced pier grid",
      message: "The conservative floor/foundation concept starts at a 5 x 3 pier grid.",
    });
  }

  if (pierSpacingLengthMm > MAX_CONCEPT_PIER_SPACING_MM || pierSpacingWidthMm > MAX_CONCEPT_PIER_SPACING_MM) {
    warnings.push({
      severity: "warning",
      title: "Pier spacing over concept limit",
      message: `Max pier spacing is ${Math.round(Math.max(pierSpacingLengthMm, pierSpacingWidthMm))}mm; the concept limit is ${MAX_CONCEPT_PIER_SPACING_MM}mm before engineering review.`,
    });
  }

  if (spec.joistSpacingMm > 600) {
    warnings.push({
      severity: "warning",
      title: "Wide infill joist spacing",
      message: "Infill joist spacing above 600mm needs review before relying on floor-sheet or floorboard assumptions.",
    });
  }

  if (spec.floorHeightMm > DEFAULT_FLOOR_HEIGHT_MM) {
    warnings.push({
      severity: "warning",
      title: "Raised floor height increased",
      message: `Post/stump height is ${spec.floorHeightMm}mm; the default concept height is ${DEFAULT_FLOOR_HEIGHT_MM}mm.`,
    });
  }

  return {
    pierSpacingLengthMm,
    pierSpacingWidthMm,
    footingColumnCount,
    footingRowCount,
    doubledCrossmember190MemberCount: doubledCrossmember190Count * 2,
    bearingJoist140Count,
    singleInfillJoistCount,
    externalFrame190LengthMm,
    doubledCrossmember190Count,
    roofTiePostCount,
    roofTieBoltSetCount: roofTiePostCount * ROOF_TIE_BOLT_SETS_PER_POST,
    outerConcretePierCount,
    centreConcretePierCount,
    doorSideSmallConcretePierCount,
    outerConcretePierRadiusMm: Math.round(OUTER_CONCRETE_PIER_RADIUS_M * 1000),
    centreConcretePierRadiusMm: Math.round(CENTRE_CONCRETE_PIER_RADIUS_M * 1000),
    deckStepCount,
    deckWidthMm: DOOR_DECK_WIDTH_MM,
    deckDepthMm: DOOR_DECK_DEPTH_MM,
    maxConceptPierSpacingMm: MAX_CONCEPT_PIER_SPACING_MM,
    maxBaySpacingMm: Math.max(pierSpacingLengthMm, pierSpacingWidthMm),
    floorHeightMm: spec.floorHeightMm,
    postHeightMm: spec.floorHeightMm,
    warnings,
  };
}

export function calculateEstimates(
  spec: TinyHomeSpec,
  materials: Record<string, Material>,
): MaterialEstimate[] {
  const foundationCheck = calculateFoundationCheck(spec);
  const pierCount = spec.pierColumns * spec.pierRows;
  const wasteFactor = 1 + spec.wastePercent / 100;
  const averageWallHeightMm = spec.maxHeightMm - spec.floorHeightMm - spec.roofRiseMm / 2;
  const wallPerimeterMm = 2 * spec.lengthMm + 2 * spec.widthMm;

  const h4PostRequiredMm = pierCount * spec.floorHeightMm;
  const h4PostPieces = piecesForLength(
    h4PostRequiredMm,
    spec.wastePercent,
    materials.h4Post90.stockLengthMm,
  );

  const footingRowCount = foundationCheck.footingRowCount;
  const bearingJoist140Count = foundationCheck.bearingJoist140Count;
  const singleInfillJoistCount = foundationCheck.singleInfillJoistCount;
  const doubled190CrossmemberMembers = foundationCheck.doubledCrossmember190MemberCount;
  const widthwiseJoistMembers = doubled190CrossmemberMembers + bearingJoist140Count + singleInfillJoistCount;
  const bearingJoist140Mm = bearingJoist140Count * spec.widthMm;
  const singleInfillJoistMm = singleInfillJoistCount * spec.widthMm;
  const centreBearer140Mm = Math.max(0, footingRowCount - 2) * spec.lengthMm;
  const floorFrame190Mm = foundationCheck.externalFrame190LengthMm;
  const h3Framing190Pieces = piecesForLength(
    floorFrame190Mm,
    spec.wastePercent,
    materials.h3Framing190.stockLengthMm,
  );
  const doorDeckFrameMm = spec.openings.frontDoor
    ? 2 * DOOR_DECK_WIDTH_MM +
      4 * DOOR_DECK_DEPTH_MM +
      foundationCheck.deckStepCount * 1350 +
      2 * 1700 +
      2 * spec.floorHeightMm
    : 0;
  const floorFrame140Mm = centreBearer140Mm + bearingJoist140Mm + singleInfillJoistMm + doorDeckFrameMm;

  const longWallStuds = spacedCount(spec.lengthMm, spec.studSpacingMm) * 2;
  const endWallStuds = spacedCount(spec.widthMm, spec.studSpacingMm) * 2;
  const studMm = (longWallStuds + endWallStuds) * averageWallHeightMm;
  const plateMm = wallPerimeterMm * 3;

  const rafterCount =
    spec.roofFallDirection === "length"
      ? spacedCount(roofWidthMm(spec), spec.rafterSpacingMm)
      : spacedCount(roofLengthMm(spec), spec.rafterSpacingMm);
  const roofRafterMm = rafterCount * roofRunM(spec) * 1000;
  const roofEdgeMm = 2 * roofLengthMm(spec) + 2 * roofWidthMm(spec);
  const roofBattenMm =
    spec.roofFallDirection === "length"
      ? 4 * roofWidthMm(spec)
      : Math.ceil(roofWidthMm(spec) / 900) * roofLengthMm(spec);

  const totalH3FrameMm = floorFrame140Mm + studMm + plateMm + roofRafterMm + roofEdgeMm + roofBattenMm;
  const h3Pieces = piecesForLength(
    totalH3FrameMm,
    spec.wastePercent,
    materials.h3Framing140.stockLengthMm,
  );

  const lengthM = spec.lengthMm / 1000;
  const widthM = spec.widthMm / 1000;
  const roofAreaSqM = roofRunM(spec) * (spec.roofFallDirection === "length" ? roofWidthM(spec) : roofLengthM(spec));
  const wallAreaSqM = (wallPerimeterMm / 1000) * (averageWallHeightMm / 1000);
  const openingCreditSqM =
    (spec.openings.frontDoor ? 1.8 : 0) +
    (spec.openings.sideWindow ? 1.1 : 0) +
    (spec.openings.rearWindow ? 0.9 : 0);
  const claddingSqM = Math.max(0, wallAreaSqM - openingCreditSqM);
  const floorAreaSqM = lengthM * widthM;
  const structuralFloorSheets =
    spec.flooringStack === "finish-only"
      ? 0
      : Math.ceil((floorAreaSqM * wasteFactor) / Math.max(1, materials.structuralFloorSheet.coverage ?? 2.88));
  const finishedFloorSqM =
    spec.flooringStack === "structural-only" ? 0 : floorAreaSqM * wasteFactor;
  const windowCount =
    (spec.openings.sideWindow ? 1 : 0) + (spec.openings.rearWindow ? 1 : 0);
  const postAnchorCount = pierCount;
  const roofTieBoltSetCount = foundationCheck.roofTieBoltSetCount;
  const m10BoltCount = postAnchorCount + roofTieBoltSetCount;
  const joistHanger140Count = (bearingJoist140Count + singleInfillJoistCount) * 2;
  const crossmemberConnector190Count = doubled190CrossmemberMembers * 2;
  const rafterConnectorPairs = rafterCount * 2;
  const connectorScrewEach =
    joistHanger140Count * 6 +
    crossmemberConnector190Count * 8 +
    postAnchorCount * 4 +
    rafterConnectorPairs * 4 +
    foundationCheck.roofTiePostCount * 8;
  const connectorScrewPacks = packCount(connectorScrewEach, materials.connectorScrews.packQuantity);
  const framingNailEach = Math.ceil(
    (longWallStuds + endWallStuds) * 8 +
      widthwiseJoistMembers * 8 +
      foundationCheck.doubledCrossmember190Count * 24 +
      rafterCount * 8 +
      260,
  );
  const framingNailBoxes = packCount(framingNailEach, materials.framingNails.packQuantity);
  const treatedScrewEach =
    Math.ceil(
      structuralFloorSheets * 42 +
        floorAreaSqM * 18 +
        windowCount * 20 +
        foundationCheck.deckStepCount * 18 +
        (spec.openings.frontDoor ? 120 : 80),
    );
  const treatedScrewBoxes = packCount(treatedScrewEach, materials.treatedPineScrews.packQuantity);
  const roofAndWallFastenerEach = Math.ceil((roofAreaSqM + claddingSqM) * 7 + 80);
  const roofingScrewBoxes = packCount(roofAndWallFastenerEach, materials.roofingScrews.packQuantity);
  const flashingAllowanceMultiplier =
    1 + Math.max(0, spec.roofRiseMm - 350) / 2500 + windowCount * 0.08;

  return [
    {
      materialId: "h4Post90",
      label: materials.h4Post90.name,
      category: materials.h4Post90.category,
      requiredQuantity: h4PostRequiredMm,
      requiredLabel: `${round1(h4PostRequiredMm / 1000)} lm`,
      purchaseQuantity: h4PostPieces,
      purchaseLabel: `${h4PostPieces} x 3.0m`,
      wasteQuantity: h4PostPieces * materials.h4Post90.stockLengthMm! - h4PostRequiredMm,
      estimatedCost: round2(h4PostPieces * materials.h4Post90.unitPrice),
      formulaExplanation: `${pierCount} pier posts x ${spec.floorHeightMm}mm exposed height, plus ${spec.wastePercent}% waste.`,
      requiredReview: true,
      assemblyStage: "foundation",
      notes: [
        "Models 90x90 H4 stumps/posts at each pier location.",
        "If concrete piers carry full height, reduce this line item.",
      ],
    },
    {
      materialId: "h3Framing190",
      label: materials.h3Framing190.name,
      category: materials.h3Framing190.category,
      requiredQuantity: floorFrame190Mm,
      requiredLabel: `${round1(floorFrame190Mm / 1000)} lm`,
      purchaseQuantity: h3Framing190Pieces,
      purchaseLabel: `${h3Framing190Pieces} x 6.0m`,
      wasteQuantity: h3Framing190Pieces * materials.h3Framing190.stockLengthMm! - floorFrame190Mm,
      estimatedCost: round2(h3Framing190Pieces * materials.h3Framing190.unitPrice),
      formulaExplanation:
        "190x45 H3 takeoff for the external floor rectangle plus two doubled crossmember brace lines across the 3m width.",
      breakdown: [
        `External rectangle: ${round1((2 * spec.lengthMm + 2 * spec.widthMm) / 1000)} lm around the 6m x 3m floor frame.`,
        `Crossmember braces: ${foundationCheck.doubledCrossmember190Count} doubled lines = ${foundationCheck.doubledCrossmember190MemberCount} x 3m 190x45 members.`,
      ],
      requiredReview: true,
      assemblyStage: "floor",
      notes: [
        "Use this heavier 190x45 member for the perimeter frame and the two doubled brace lines only.",
        `${crossmemberConnector190Count} dedicated 190x45 crossmember connector allowances are counted separately from the 140x45 joist hangers.`,
        "Confirm span, bearing, bolt edge distances, corrosion class, and connection schedule with an engineer.",
      ],
    },
    {
      materialId: "h3Framing140",
      label: materials.h3Framing140.name,
      category: materials.h3Framing140.category,
      requiredQuantity: totalH3FrameMm,
      requiredLabel: `${round1(totalH3FrameMm / 1000)} lm`,
      purchaseQuantity: h3Pieces,
      purchaseLabel: `${h3Pieces} x 6.0m`,
      wasteQuantity: h3Pieces * materials.h3Framing140.stockLengthMm! - totalH3FrameMm,
      estimatedCost: round2(h3Pieces * materials.h3Framing140.unitPrice),
      formulaExplanation:
        "Remaining 140x45 H3 takeoff covers 140 floor/deck members, wall studs, plates, rafters, roof edges, and battens.",
      breakdown: [
        `140 floor/deck frame: ${round1(floorFrame140Mm / 1000)} lm from the centre bearer row, ${bearingJoist140Count} pier-column joist line, ${singleInfillJoistCount} single infill joists, and door deck/steps allowance.`,
        `Door deck/steps: ${round1(doorDeckFrameMm / 1000)} lm timber allowance for a ${foundationCheck.deckWidthMm} x ${foundationCheck.deckDepthMm}mm deck, posts, stringers, and ${foundationCheck.deckStepCount} treads.`,
        `Wall frame: ${round1((studMm + plateMm) / 1000)} lm from studs and triple plate allowance around the shell.`,
        `Roof frame: ${round1((roofRafterMm + roofEdgeMm + roofBattenMm) / 1000)} lm from rafters, perimeter edges, and battens.`,
      ],
      requiredReview: true,
      assemblyStage: "floor",
      notes: [
        "Everything in the timber frame that is not the 190x45 perimeter/crossmember package or the 90x90 H4 stump/post package is costed here as 140x45 H3.",
        `${bearingJoist140Count} internal pier-column joist line is costed as 140x45 H3 so every concrete pier column has timber directly over it.`,
        `${singleInfillJoistCount} single 140x45 infill joists remain between the 190x45 external frame and doubled crossmember braces.`,
        `${Math.max(0, footingRowCount - 2)} internal 140x45 bearer row allowance is included between the two 190x45 long perimeter members.`,
        `${foundationCheck.roofTiePostCount} post-to-roof-frame tie points add ${foundationCheck.roofTieBoltSetCount} M10 bolt-set allowances.`,
        `${longWallStuds + endWallStuds} wall studs and ${rafterCount} roof rafters are included in the same H3 timber package.`,
        "Confirm actual member layout, blocking, lateral restraint, and tie-down path with an engineer.",
      ],
    },
    {
      materialId: "concretePier",
      label: materials.concretePier.name,
      category: materials.concretePier.category,
      requiredQuantity: pierCount,
      requiredLabel: `${pierCount} piers`,
      purchaseQuantity: pierCount,
      purchaseLabel: `${pierCount} allowances`,
      wasteQuantity: 0,
      estimatedCost: round2(pierCount * materials.concretePier.unitPrice),
      formulaExplanation: `${spec.pierColumns} columns x ${spec.pierRows} rows = ${pierCount} concrete pier allowances: ${foundationCheck.outerConcretePierCount} outer/corner piers at ${foundationCheck.outerConcretePierRadiusMm}mm radius, ${foundationCheck.centreConcretePierCount} centre-row piers at ${foundationCheck.centreConcretePierRadiusMm}mm radius, and ${foundationCheck.doorSideSmallConcretePierCount} door-side non-corner piers at ${foundationCheck.centreConcretePierRadiusMm}mm radius.`,
      requiredReview: true,
      assemblyStage: "foundation",
      notes: [
        "Pier diameter, depth, reinforcement, concrete volume, and ground bearing are not engineered in this app.",
        "Concrete pier centres and posts are shown on the original pier grid lines so the foundation aligns directly below the floor frame.",
        "The concrete cost line remains a flat allowance until pier depth and mix are confirmed.",
      ],
    },
    {
      materialId: "postAnchorStirrup",
      label: materials.postAnchorStirrup.name,
      category: materials.postAnchorStirrup.category,
      requiredQuantity: postAnchorCount,
      requiredLabel: `${postAnchorCount} stirrups`,
      purchaseQuantity: postAnchorCount,
      purchaseLabel: `${postAnchorCount} each`,
      wasteQuantity: 0,
      estimatedCost: round2(postAnchorCount * materials.postAnchorStirrup.unitPrice),
      formulaExplanation: "One 90mm stirrup/post anchor allowance per concrete pier/post location.",
      requiredReview: true,
      assemblyStage: "foundation",
      notes: ["Confirm embedment, uplift resistance, and whether the final design uses full concrete piers or timber posts on brackets."],
    },
    {
      materialId: "m10Bolts",
      label: materials.m10Bolts.name,
      category: materials.m10Bolts.category,
      requiredQuantity: m10BoltCount,
      requiredLabel: `${m10BoltCount} bolt sets`,
      purchaseQuantity: m10BoltCount,
      purchaseLabel: `${m10BoltCount} sets`,
      wasteQuantity: 0,
      estimatedCost: round2(m10BoltCount * materials.m10Bolts.unitPrice),
      formulaExplanation: `${postAnchorCount} post-anchor bolt sets plus ${roofTieBoltSetCount} roof tie-post bolt sets across ${foundationCheck.roofTiePostCount} roof tie posts.`,
      requiredReview: true,
      assemblyStage: "foundation",
      notes: [
        "Replace with the exact bracket and roof tie-down fastening schedule once the engineer confirms the six post-to-roof frame tie points.",
      ],
    },
    {
      materialId: "joistHanger140",
      label: materials.joistHanger140.name,
      category: materials.joistHanger140.category,
      requiredQuantity: joistHanger140Count,
      requiredLabel: `${joistHanger140Count} hangers`,
      purchaseQuantity: joistHanger140Count,
      purchaseLabel: `${joistHanger140Count} each`,
      wasteQuantity: 0,
      estimatedCost: round2(joistHanger140Count * materials.joistHanger140.unitPrice),
      formulaExplanation: `${bearingJoist140Count} 140x45 pier-column joist line plus ${singleInfillJoistCount} single 140x45 infill joists x 2 ends = ${joistHanger140Count} 140x45 joist hanger allowances.`,
      requiredReview: true,
      assemblyStage: "floor",
      notes: [
        "Concept floor connection count only; this line is for the 140x45 pier-column joist and infill joists.",
      ],
    },
    {
      materialId: "crossmemberConnector190",
      label: materials.crossmemberConnector190.name,
      category: materials.crossmemberConnector190.category,
      requiredQuantity: crossmemberConnector190Count,
      requiredLabel: `${crossmemberConnector190Count} connectors`,
      purchaseQuantity: crossmemberConnector190Count,
      purchaseLabel: `${crossmemberConnector190Count} each`,
      wasteQuantity: 0,
      estimatedCost: round2(crossmemberConnector190Count * materials.crossmemberConnector190.unitPrice),
      formulaExplanation: `${doubled190CrossmemberMembers} 190x45 doubled crossmember brace members x 2 ends = ${crossmemberConnector190Count} 190x45 connector allowances.`,
      requiredReview: true,
      assemblyStage: "floor",
      notes: [
        "Allowance only: replace with exact 190x45 rated hangers, straps, brackets, through-bolts, or blocking detail after engineering review.",
      ],
    },
    {
      materialId: "connectorScrews",
      label: materials.connectorScrews.name,
      category: materials.connectorScrews.category,
      requiredQuantity: connectorScrewEach,
      requiredLabel: `${connectorScrewEach} screws`,
      purchaseQuantity: connectorScrewPacks,
      purchaseLabel: `${connectorScrewPacks} x ${materials.connectorScrews.packQuantity} pack`,
      wasteQuantity: connectorScrewPacks * (materials.connectorScrews.packQuantity ?? 1) - connectorScrewEach,
      estimatedCost: round2(connectorScrewPacks * materials.connectorScrews.unitPrice),
      formulaExplanation: "140 joist hangers, 190 crossmember connectors, post anchors, rafter connector pairs, and six roof tie posts use a concept screw schedule.",
      requiredReview: true,
      assemblyStage: "floor",
      notes: ["Use manufacturer-approved connector fasteners only; ordinary screws are not a substitute for rated connectors."],
    },
    {
      materialId: "framingNails",
      label: materials.framingNails.name,
      category: materials.framingNails.category,
      requiredQuantity: framingNailEach,
      requiredLabel: `${framingNailEach} nails`,
      purchaseQuantity: framingNailBoxes,
      purchaseLabel: `${framingNailBoxes} x ${materials.framingNails.packQuantity} box`,
      wasteQuantity: framingNailBoxes * (materials.framingNails.packQuantity ?? 1) - framingNailEach,
      estimatedCost: round2(framingNailBoxes * materials.framingNails.unitPrice),
      formulaExplanation: "Framing nail allowance scales from stud, joist, rafter, plate, and blocking counts.",
      requiredReview: true,
      assemblyStage: "wall-frame",
      notes: ["Nail size, coating, and pattern must match treated timber and structural requirements."],
    },
    {
      materialId: "treatedPineScrews",
      label: materials.treatedPineScrews.name,
      category: materials.treatedPineScrews.category,
      requiredQuantity: treatedScrewEach,
      requiredLabel: `${treatedScrewEach} screws`,
      purchaseQuantity: treatedScrewBoxes,
      purchaseLabel: `${treatedScrewBoxes} x ${materials.treatedPineScrews.packQuantity} box`,
      wasteQuantity: treatedScrewBoxes * (materials.treatedPineScrews.packQuantity ?? 1) - treatedScrewEach,
      estimatedCost: round2(treatedScrewBoxes * materials.treatedPineScrews.unitPrice),
      formulaExplanation: "Floor sheet, timber finish, opening trim, and general treated pine screw allowance.",
      requiredReview: false,
      assemblyStage: "floor",
      notes: ["Confirm screw length and coating for each specific substrate."],
    },
    {
      materialId: "structuralFloorSheet",
      label: materials.structuralFloorSheet.name,
      category: materials.structuralFloorSheet.category,
      requiredQuantity: floorAreaSqM,
      requiredLabel: `${round1(floorAreaSqM)} sq m`,
      purchaseQuantity: structuralFloorSheets,
      purchaseLabel: `${structuralFloorSheets} sheets`,
      wasteQuantity: Math.max(0, structuralFloorSheets * (materials.structuralFloorSheet.coverage ?? 2.88) - floorAreaSqM),
      estimatedCost: round2(structuralFloorSheets * materials.structuralFloorSheet.unitPrice),
      formulaExplanation: `${round1(floorAreaSqM)} sq m floor area divided by 2400 x 1200 sheet coverage, plus waste.`,
      requiredReview: true,
      assemblyStage: "floor",
      notes: ["Includes the structural floor layer under the finished timber boards."],
    },
    {
      materialId: "finishedFloorboards",
      label: materials.finishedFloorboards.name,
      category: materials.finishedFloorboards.category,
      requiredQuantity: finishedFloorSqM,
      requiredLabel: `${round1(finishedFloorSqM)} sq m`,
      purchaseQuantity: round1(finishedFloorSqM),
      purchaseLabel: `${round1(finishedFloorSqM)} sq m allowance`,
      wasteQuantity: finishedFloorSqM - floorAreaSqM,
      estimatedCost: round2(finishedFloorSqM * materials.finishedFloorboards.unitPrice),
      formulaExplanation: "Visible timber floorboard finish across the internal footprint with waste allowance.",
      requiredReview: false,
      assemblyStage: "interior-floor",
      notes: ["Acclimatise, seal, and finish boards according to the flooring supplier's instructions."],
    },
    {
      materialId: "colorbondRoof",
      label: materials.colorbondRoof.name,
      category: materials.colorbondRoof.category,
      requiredQuantity: roofAreaSqM,
      requiredLabel: `${round1(roofAreaSqM)} sq m`,
      purchaseQuantity: round1(roofAreaSqM * wasteFactor),
      purchaseLabel: `${round1(roofAreaSqM * wasteFactor)} sq m allowance`,
      wasteQuantity: roofAreaSqM * (wasteFactor - 1),
      estimatedCost: round2(roofAreaSqM * wasteFactor * materials.colorbondRoof.unitPrice),
      formulaExplanation: `Sloped roof area using ${(roofWidthMm(spec) / 1000).toFixed(1)}m roof width, ${spec.roofSideOverhangMm}mm side eaves, and ${Math.round(ROOF_END_OVERHANG_MM)}mm end eaves.`,
      requiredReview: true,
      assemblyStage: "roof",
      notes: ["Roof overhang affects uplift, fascia, gutters, flashings, and sheet layout; engineer/manufacturer review required."],
    },
    {
      materialId: "roofingScrews",
      label: materials.roofingScrews.name,
      category: materials.roofingScrews.category,
      requiredQuantity: roofAndWallFastenerEach,
      requiredLabel: `${roofAndWallFastenerEach} screws`,
      purchaseQuantity: roofingScrewBoxes,
      purchaseLabel: `${roofingScrewBoxes} x ${materials.roofingScrews.packQuantity} box`,
      wasteQuantity: roofingScrewBoxes * (materials.roofingScrews.packQuantity ?? 1) - roofAndWallFastenerEach,
      estimatedCost: round2(roofingScrewBoxes * materials.roofingScrews.unitPrice),
      formulaExplanation: "Roof and wall cladding screw allowance at 7 fixings per sq m plus perimeter/detail allowance.",
      requiredReview: true,
      assemblyStage: "roof",
      notes: ["Final fixing pattern depends on sheet profile, wind region, edge zones, and battens."],
    },
    {
      materialId: "colorbondWall",
      label: materials.colorbondWall.name,
      category: materials.colorbondWall.category,
      requiredQuantity: claddingSqM,
      requiredLabel: `${round1(claddingSqM)} sq m`,
      purchaseQuantity: round1(claddingSqM * wasteFactor),
      purchaseLabel: `${round1(claddingSqM * wasteFactor)} sq m allowance`,
      wasteQuantity: claddingSqM * (wasteFactor - 1),
      estimatedCost: round2(claddingSqM * wasteFactor * materials.colorbondWall.unitPrice),
      formulaExplanation: "Wall perimeter x average wall height, minus rough opening credits, plus waste.",
      requiredReview: true,
      assemblyStage: "envelope",
      notes: ["Opening areas are roughly credited; final sheet layout will change waste."],
    },
    {
      materialId: "flashingTrim",
      label: materials.flashingTrim.name,
      category: materials.flashingTrim.category,
      requiredQuantity: 1,
      requiredLabel: "1 project allowance",
      purchaseQuantity: round1(flashingAllowanceMultiplier),
      purchaseLabel: `${round1(flashingAllowanceMultiplier)} allowance factor`,
      wasteQuantity: 0,
      estimatedCost: round2(flashingAllowanceMultiplier * materials.flashingTrim.unitPrice),
      formulaExplanation: "Base flashing/trim allowance adjusted for roof rise and opening count.",
      requiredReview: true,
      assemblyStage: "envelope",
      notes: ["Includes roof edges, corners, sill trays, jamb trim, cut-edge cover, and weathering details as a concept allowance."],
    },
    {
      materialId: "aluminiumWindow",
      label: materials.aluminiumWindow.name,
      category: materials.aluminiumWindow.category,
      requiredQuantity: windowCount,
      requiredLabel: `${windowCount} windows`,
      purchaseQuantity: windowCount,
      purchaseLabel: `${windowCount} each`,
      wasteQuantity: 0,
      estimatedCost: round2(windowCount * materials.aluminiumWindow.unitPrice),
      formulaExplanation: "One white aluminium window allowance for each enabled side/rear window placeholder.",
      requiredReview: true,
      assemblyStage: "openings",
      notes: ["Door placeholder remains visual-only in V2; choose the actual door system later."],
    },
    {
      materialId: "anchorsFixings",
      label: materials.anchorsFixings.name,
      category: materials.anchorsFixings.category,
      requiredQuantity: 1,
      requiredLabel: "1 project allowance",
      purchaseQuantity: 1,
      purchaseLabel: "1 allowance",
      wasteQuantity: 0,
      estimatedCost: round2(materials.anchorsFixings.unitPrice),
      formulaExplanation: "Residual tie-down, strap, sealant, adhesive, bracing hardware, and miscellaneous fastening allowance.",
      requiredReview: true,
      assemblyStage: "foundation",
      notes: ["Tie-down path and corrosion class require local code and engineer review."],
    },
  ];
}

export function totalEstimate(estimates: MaterialEstimate[]): number {
  return round2(estimates.reduce((sum, estimate) => sum + estimate.estimatedCost, 0));
}

export function designWarnings(spec: TinyHomeSpec): DesignWarning[] {
  const foundationCheck = calculateFoundationCheck(spec);
  const warnings: DesignWarning[] = [
    {
      severity: "info",
      title: "Concept only",
      message:
        "This is a design and estimating tool. It is not certified structural documentation and does not replace engineering, council, waterproofing, wind, fire, termite, or footing checks.",
    },
  ];

  if (spec.lengthMm > 6000 || spec.widthMm > 3000) {
    warnings.push({
      severity: "warning",
      title: "Envelope exceeds sketch",
      message: "The current footprint is larger than the 6m x 3m sketch envelope.",
    });
  }

  if (spec.maxHeightMm > 3000) {
    warnings.push({
      severity: "danger",
      title: "Height exceeds target",
      message: "Finished height is above the requested 3m maximum from ground level.",
    });
  }

  if (spec.pierColumns < 5 || spec.pierRows < 3) {
    warnings.push({
      severity: "danger",
      title: "Reduced pier grid",
      message: "The conservative starting point is a 5 x 3 pier grid. Fewer supports need engineering review.",
    });
  }

  if (foundationCheck.maxBaySpacingMm > foundationCheck.maxConceptPierSpacingMm) {
    warnings.push({
      severity: "warning",
      title: "Pier spacing over concept limit",
      message: `Foundation bay spacing reaches ${Math.round(foundationCheck.maxBaySpacingMm)}mm; keep the concept at or below ${foundationCheck.maxConceptPierSpacingMm}mm unless an engineer confirms otherwise.`,
    });
  }

  if (spec.studSpacingMm > 600 || spec.rafterSpacingMm > 600 || spec.joistSpacingMm > 600) {
    warnings.push({
      severity: "warning",
      title: "Wide framing spacing",
      message: "Spacing above 600mm is flagged for concept review before relying on quantities.",
    });
  }

  if (spec.roofRiseMm < 180) {
    warnings.push({
      severity: "warning",
      title: "Low roof fall",
      message: "A shallow roof fall may not suit the selected roofing profile, drainage, or local rainfall.",
    });
  }

  if (spec.roofFallDirection === "width" && spec.roofHighSide !== "right") {
    warnings.push({
      severity: "warning",
      title: "Roof high side changed",
      message: "The current default is right 6m wall high, falling across the roof width.",
    });
  }

  if (spec.roofSideOverhangMm > 0) {
    warnings.push({
      severity: "info",
      title: "Roof overhang",
      message: `Roof is ${(roofWidthMm(spec) / 1000).toFixed(1)}m wide over the ${(spec.widthMm / 1000).toFixed(1)}m house body, with ${spec.roofSideOverhangMm}mm side eaves requiring uplift, fascia, gutter, and flashing review.`,
    });
  }

  if (spec.flooringStack !== "structural-and-finish") {
    warnings.push({
      severity: "warning",
      title: "Floor stack changed",
      message: "The V2 design assumes structural sheet flooring plus visible timber floorboards.",
    });
  }

  if (spec.floorHeightMm < 350) {
    warnings.push({
      severity: "warning",
      title: "Low underfloor clearance",
      message: "Check drainage, ventilation, termite inspection access, and ground moisture clearance.",
    });
  }

  if (spec.floorHeightMm > 520) {
    warnings.push({
      severity: "warning",
      title: "Raised floor height increased",
      message: "A taller post/stump height changes bracing, uplift, lateral restraint, and access assumptions.",
    });
  }

  if (spec.wastePercent < 8) {
    warnings.push({
      severity: "warning",
      title: "Low waste allowance",
      message: "Timber selection, offcuts, sheet laps, and mistakes usually need more than a minimal waste allowance.",
    });
  }

  return warnings;
}
