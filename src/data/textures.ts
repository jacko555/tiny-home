import type { GeneratedTexture, TextureId } from "../types";
import { publicAsset } from "../lib/assets";

export const generatedTextures: Record<TextureId, GeneratedTexture> = {
  treatedPine: {
    id: "treatedPine",
    label: "Generated treated pine",
    filePath: publicAsset("textures/treated-pine.svg"),
    intendedUse: "H3/H4 timber posts, bearers, joists, studs, rafters",
    repeatScale: [2.5, 2.5],
    fallbackColor: "#b98148",
  },
  concretePier: {
    id: "concretePier",
    label: "Generated concrete pier",
    filePath: publicAsset("textures/concrete-pier.svg"),
    intendedUse: "Concrete pier cylinders and footing allowances",
    repeatScale: [2, 2],
    fallbackColor: "#b8b2a4",
  },
  surfmistColorbond: {
    id: "surfmistColorbond",
    label: "Generated Surfmist metal",
    filePath: publicAsset("textures/surfmist-colorbond.svg"),
    intendedUse: "White/Sufmist Colorbond-style roof and wall cladding",
    repeatScale: [3, 5],
    fallbackColor: "#f3f5f2",
  },
  structuralPlywood: {
    id: "structuralPlywood",
    label: "Generated structural sheet floor",
    filePath: publicAsset("textures/structural-plywood.svg"),
    intendedUse: "19mm structural tongue-and-groove sheet flooring layer",
    repeatScale: [2, 3],
    fallbackColor: "#d9c7a5",
  },
  timberFloorboards: {
    id: "timberFloorboards",
    label: "Generated timber floorboards",
    filePath: publicAsset("textures/timber-floorboards.svg"),
    intendedUse: "Finished timber floorboard layer inside the tiny home",
    repeatScale: [2, 7],
    fallbackColor: "#c79a5d",
  },
  whiteWindowGlass: {
    id: "whiteWindowGlass",
    label: "Generated white window/glass",
    filePath: publicAsset("textures/white-window-glass.svg"),
    intendedUse: "White aluminium frame and blue-grey glass placeholder openings",
    repeatScale: [1.5, 1.5],
    fallbackColor: "#dcebf0",
  },
  aluminiumWindow: {
    id: "aluminiumWindow",
    label: "Generated aluminium window",
    filePath: publicAsset("textures/aluminium-window.svg"),
    intendedUse: "Detailed white aluminium window openings in the 3D model",
    repeatScale: [1, 1],
    fallbackColor: "#dcebf0",
  },
  frontDoor: {
    id: "frontDoor",
    label: "Generated white front door",
    filePath: publicAsset("textures/front-door.svg"),
    intendedUse: "Detailed white panel front door opening in the 3D model",
    repeatScale: [1, 1],
    fallbackColor: "#f2f2ee",
  },
};
