import { CheckCircle2, ClipboardList, ShieldAlert } from "lucide-react";
import type { MaterialEstimate, TinyHomeSpec } from "../types";
import { roofHighSideLabel, roofLowSideLabel, roofWidthM } from "../lib/geometry";

interface AssemblyChecklistProps {
  spec: TinyHomeSpec;
  estimates: MaterialEstimate[];
}

function buyLine(estimates: MaterialEstimate[], materialId: string): string {
  return estimates.find((estimate) => estimate.materialId === materialId)?.purchaseLabel ?? "check quantity";
}

export function AssemblyChecklist({ spec, estimates }: AssemblyChecklistProps) {
  const rows = [
    {
      title: "Foundation",
      items: [
        `${spec.pierColumns} x ${spec.pierRows} pier grid, ${buyLine(estimates, "concretePier")}`,
        `${buyLine(estimates, "postAnchorStirrup")} post anchors/stirrups and ${buyLine(estimates, "m10Bolts")} bolt sets`,
        "Engineer to confirm footing size, ground bearing, uplift, termite clearance, and drainage.",
      ],
    },
    {
      title: "Floor structure",
      items: [
        `${buyLine(estimates, "h3Framing190")} 190x45 H3 lengths for the external rectangle and two doubled crossmember brace lines`,
        `${buyLine(estimates, "h3Framing140")} 140x45 H3 lengths for the remaining pier-column joist, infills, centre bearer allowance, walls, roof frame, and deck`,
        "External frame is 190x45; every concrete pier column has a joist/crossmember line, with non-190 floor joists reduced to 140x45.",
        "Door side includes a treated timber landing deck and steps to ground.",
        `${buyLine(estimates, "crossmemberConnector190")} 190x45 crossmember connector allowance`,
        `${buyLine(estimates, "joistHanger140")} 140x45 infill joist hanger allowance`,
        `${buyLine(estimates, "structuralFloorSheet")} structural sheet floor layer`,
      ],
    },
    {
      title: "Wall frame",
      items: [
        `${spec.studSpacingMm}mm nominal stud spacing with openings left as placeholders`,
        `${buyLine(estimates, "framingNails")} framing nail allowance`,
        "Confirm bracing, tie-down path, lintels, moisture barrier, and treated timber compatibility.",
      ],
    },
    {
      title: "Roof",
      items: [
        `Single-slope roof falls from ${roofHighSideLabel(spec)} to ${roofLowSideLabel(spec)} across a ${roofWidthM(spec).toFixed(1)}m roof width`,
        `${spec.roofSideOverhangMm}mm side overhang each long side over the ${(spec.widthMm / 1000).toFixed(1)}m house body`,
        "Six post-to-roof-frame tie points are shown for engineer-confirmed M10 bolt and bracket spacing.",
        `${buyLine(estimates, "colorbondRoof")} Surfmist/white roof sheet allowance`,
        `${buyLine(estimates, "roofingScrews")} roof screw allowance with EPDM seals`,
      ],
    },
    {
      title: "Envelope",
      items: [
        `${buyLine(estimates, "colorbondWall")} exterior wall cladding allowance`,
        `${buyLine(estimates, "flashingTrim")} flashing, sill, corner, and roof-edge allowance`,
        "Confirm wrap, flashing sequence, gutters, condensation control, and cut-edge protection.",
      ],
    },
    {
      title: "Openings",
      items: [
        `${buyLine(estimates, "aluminiumWindow")} white aluminium window allowance`,
        "Front door remains a visual placeholder in V2 until the actual door system is selected.",
        "Check egress, waterproofing, sill trays, and reveals before ordering.",
      ],
    },
    {
      title: "Interior floor",
      items: [
        `${buyLine(estimates, "finishedFloorboards")} finished timber floorboard allowance`,
        `${buyLine(estimates, "treatedPineScrews")} treated pine screw allowance`,
        "Allow acclimatisation, expansion gaps, coatings, and final trim.",
      ],
    },
  ];

  return (
    <section className="panel checklist-panel" aria-label="Assembly checklist">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Build sequence</p>
          <h2>Assembly checklist</h2>
        </div>
        <ClipboardList aria-hidden="true" />
      </div>
      <div className="checklist-grid">
        {rows.map((row) => (
          <article className="checklist-card" key={row.title}>
            <h3>
              <CheckCircle2 aria-hidden="true" />
              {row.title}
            </h3>
            <ul>
              {row.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="engineer-strip">
        <ShieldAlert aria-hidden="true" />
        <span>Concept takeoff only: engineer, manufacturer install guides, local code, waterproofing, and council checks remain required.</span>
      </div>
    </section>
  );
}
