import { Html, OrbitControls, PerspectiveCamera, Sky, useTexture } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { TextureId, TinyHomeSpec } from "../types";
import { generatedTextures } from "../data/textures";
import {
  bearingJoistCentersMm,
  crossmemberBraceCentersMm,
  divisions,
  concretePierCenterM,
  concretePierRadiusM,
  infillJoistCentersMm,
  mmToM,
  pierPositions,
  roofHeightAt,
  roofHighSideLabel,
  roofLowSideLabel,
  roofTiePostCentersM,
} from "../lib/geometry";

type Point3 = [number, number, number];

interface Scene3DProps {
  spec: TinyHomeSpec;
}

interface SceneLayerProps extends Scene3DProps {
  textures: TexturePack;
}

type TexturePack = Record<TextureId, THREE.Texture>;

interface BoxProps {
  position: Point3;
  size: Point3;
  color: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  texture?: THREE.Texture;
}

function Box({ position, size, color, opacity = 1, roughness = 0.72, metalness = 0, texture }: BoxProps) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        map={texture}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  );
}

function BeamBetween({
  start,
  end,
  size,
  color,
  opacity = 1,
  texture,
}: {
  start: Point3;
  end: Point3;
  size: [number, number];
  color: string;
  opacity?: number;
  texture?: THREE.Texture;
}) {
  const beam = useMemo(() => {
    const startVector = new THREE.Vector3(...start);
    const endVector = new THREE.Vector3(...end);
    const direction = endVector.clone().sub(startVector);
    const length = direction.length();
    const midpoint = startVector.clone().add(endVector).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1, 0, 0),
      direction.clone().normalize(),
    );

    return { length, midpoint, quaternion };
  }, [start, end]);

  if (beam.length < 0.001) {
    return null;
  }

  return (
    <mesh position={beam.midpoint} quaternion={beam.quaternion} castShadow receiveShadow>
      <boxGeometry args={[beam.length, size[0], size[1]]} />
      <meshStandardMaterial color={color} map={texture} transparent={opacity < 1} opacity={opacity} roughness={0.7} />
    </mesh>
  );
}

function QuadPanel({
  points,
  color,
  opacity,
  metalness = 0,
  texture,
}: {
  points: [Point3, Point3, Point3, Point3];
  color: string;
  opacity: number;
  metalness?: number;
  texture?: THREE.Texture;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array(points.flat());
    const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.computeVertexNormals();
    return geo;
  }, [points]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color={color}
        map={texture}
        transparent
        opacity={opacity}
        roughness={0.45}
        metalness={metalness}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Label({ position, children }: { position: Point3; children: string }) {
  return (
    <Html position={position} center distanceFactor={6.5}>
      <span className="scene-label">{children}</span>
    </Html>
  );
}

function useTexturePack(): TexturePack {
  const textureEntries = Object.values(generatedTextures);
  const loaded = useTexture(textureEntries.map((texture) => texture.filePath)) as THREE.Texture[];

  return useMemo(() => {
    return textureEntries.reduce((pack, textureMeta, index) => {
      const texture = loaded[index];
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(textureMeta.repeatScale[0], textureMeta.repeatScale[1]);
      texture.colorSpace = THREE.SRGBColorSpace;
      pack[textureMeta.id] = texture;
      return pack;
    }, {} as TexturePack);
  }, [loaded, textureEntries]);
}

function Foundation({ spec, textures }: SceneLayerProps) {
  const floorHeightM = mmToM(spec.floorHeightMm);
  const concreteHeight = Math.min(0.24, floorHeightM * 0.58);
  const timberHeight = Math.max(0.08, floorHeightM - concreteHeight);

  return (
    <>
      {pierPositions(spec).map((pier, index) => {
        const concreteCenter = concretePierCenterM(pier);
        const concreteRadius = concretePierRadiusM(pier);

        return (
          <group key={`${pier.x}-${pier.z}-${index}`}>
            <mesh position={[concreteCenter.x, concreteHeight / 2, concreteCenter.z]} receiveShadow castShadow>
              <cylinderGeometry args={[concreteRadius, concreteRadius, concreteHeight, 36]} />
              <meshStandardMaterial color="#b8b2a4" map={textures.concretePier} roughness={0.86} />
            </mesh>
          <Box
            position={[concreteCenter.x, concreteHeight + timberHeight / 2, concreteCenter.z]}
            size={[0.09, timberHeight, 0.09]}
            color="#8a6b3d"
            texture={textures.treatedPine}
          />
          <Box position={[concreteCenter.x, floorHeightM + 0.018, concreteCenter.z]} size={[0.22, 0.035, 0.22]} color="#5b6770" />
          </group>
        );
      })}
    </>
  );
}

function FloorFrame({ spec, textures }: SceneLayerProps) {
  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const floorY = mmToM(spec.floorHeightMm) + 0.08;
  const timber140 = "#bd8144";
  const timber190 = "#8f5524";
  const section190Tall = 0.19;
  const section140Tall = 0.14;
  const sectionNarrow = 0.045;
  const doubleGapM = 0.074;
  const joist140CenterY = floorY + (section190Tall - section140Tall) / 2;
  const crossmemberCenters = crossmemberBraceCentersMm(spec).map(mmToM);
  const doubledCrossmemberX = crossmemberCenters.flatMap((center) => [center - doubleGapM / 2, center + doubleGapM / 2]);
  const bearingJoist140X = bearingJoistCentersMm(spec).map(mmToM);
  const infillJoistX = infillJoistCentersMm(spec)
    .map(mmToM)
    .filter((x) => crossmemberCenters.every((center) => Math.abs(x - center) > 0.18))
    .filter((x) => bearingJoist140X.every((center) => Math.abs(x - center) > 0.18));

  return (
    <>
      <Box position={[0, floorY, -widthM / 2]} size={[lengthM, section190Tall, sectionNarrow]} color={timber190} texture={textures.treatedPine} />
      <Box position={[0, floorY, widthM / 2]} size={[lengthM, section190Tall, sectionNarrow]} color={timber190} texture={textures.treatedPine} />
      <Box position={[-lengthM / 2, floorY, 0]} size={[sectionNarrow, section190Tall, widthM]} color={timber190} texture={textures.treatedPine} />
      <Box position={[lengthM / 2, floorY, 0]} size={[sectionNarrow, section190Tall, widthM]} color={timber190} texture={textures.treatedPine} />

      {doubledCrossmemberX.map((x, index) => (
        <Box
          key={`double-190-crossmember-${index}-${x}`}
          position={[x, floorY, 0]}
          size={[sectionNarrow, section190Tall, widthM]}
          color="#7c471f"
          texture={textures.treatedPine}
        />
      ))}

      <Box position={[0, joist140CenterY, 0]} size={[lengthM, section140Tall, sectionNarrow]} color="#a66c34" texture={textures.treatedPine} />

      {bearingJoist140X.map((x, index) => (
        <Box
          key={`bearing-140-pier-joist-${index}-${x}`}
          position={[x, joist140CenterY, 0]}
          size={[sectionNarrow, section140Tall, widthM]}
          color="#9e6330"
          texture={textures.treatedPine}
        />
      ))}

      {infillJoistX.map((x, index) => (
        <Box
          key={`single-infill-joist-${index}-${x}`}
          position={[x, joist140CenterY, 0]}
          size={[sectionNarrow, section140Tall, widthM]}
          color={timber140}
          texture={textures.treatedPine}
        />
      ))}
    </>
  );
}

function WallFrame({ spec, textures }: SceneLayerProps) {
  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const floorTopY = mmToM(spec.floorHeightMm) + 0.18;
  const studSpacingM = mmToM(spec.studSpacingMm);
  const xPositions = divisions(-lengthM / 2, lengthM / 2, studSpacingM);
  const zPositions = divisions(-widthM / 2, widthM / 2, studSpacingM);
  const timber = "#c28a52";
  const studWidth = 0.045;
  const studDepth = 0.14;
  const roofTiePosts = roofTiePostCentersM(spec);

  const studAt = (x: number, z: number, key: string, depthAxis: "x" | "z") => {
    const topY = roofHeightAt(spec, x, z) - 0.08;
    const height = Math.max(0.3, topY - floorTopY);
    const size: Point3 = depthAxis === "z" ? [studWidth, height, studDepth] : [studDepth, height, studWidth];
    return <Box key={key} position={[x, floorTopY + height / 2, z]} size={size} color={timber} texture={textures.treatedPine} />;
  };

  return (
    <>
      {xPositions.map((x) => studAt(x, -widthM / 2, `north-${x}`, "z"))}
      {xPositions.map((x) => studAt(x, widthM / 2, `south-${x}`, "z"))}
      {zPositions.map((z) => studAt(-lengthM / 2, z, `west-${z}`, "x"))}
      {zPositions.map((z) => studAt(lengthM / 2, z, `east-${z}`, "x"))}

      {roofTiePosts.map((post, index) => {
        const topY = roofHeightAt(spec, post.x, post.z) - 0.08;
        const height = Math.max(0.3, topY - floorTopY);

        return (
          <Box
            key={`roof-tie-post-${index}`}
            position={[post.x, floorTopY + height / 2, post.z]}
            size={[0.09, height, 0.09]}
            color="#7c5530"
            texture={textures.treatedPine}
          />
        );
      })}

      <Box position={[0, floorTopY + 0.02, -widthM / 2]} size={[lengthM, 0.045, 0.14]} color="#a86f37" texture={textures.treatedPine} />
      <Box position={[0, floorTopY + 0.02, widthM / 2]} size={[lengthM, 0.045, 0.14]} color="#a86f37" texture={textures.treatedPine} />
      <Box position={[-lengthM / 2, floorTopY + 0.02, 0]} size={[0.14, 0.045, widthM]} color="#a86f37" texture={textures.treatedPine} />
      <Box position={[lengthM / 2, floorTopY + 0.02, 0]} size={[0.14, 0.045, widthM]} color="#a86f37" texture={textures.treatedPine} />

      <BeamBetween
        start={[-lengthM / 2, roofHeightAt(spec, -lengthM / 2, -widthM / 2), -widthM / 2]}
        end={[lengthM / 2, roofHeightAt(spec, lengthM / 2, -widthM / 2), -widthM / 2]}
        size={[0.045, 0.14]}
        color="#9b642f"
        texture={textures.treatedPine}
      />
      <BeamBetween
        start={[-lengthM / 2, roofHeightAt(spec, -lengthM / 2, widthM / 2), widthM / 2]}
        end={[lengthM / 2, roofHeightAt(spec, lengthM / 2, widthM / 2), widthM / 2]}
        size={[0.045, 0.14]}
        color="#9b642f"
        texture={textures.treatedPine}
      />
      <BeamBetween
        start={[-lengthM / 2, roofHeightAt(spec, -lengthM / 2, -widthM / 2), -widthM / 2]}
        end={[-lengthM / 2, roofHeightAt(spec, -lengthM / 2, widthM / 2), widthM / 2]}
        size={[0.045, 0.14]}
        color="#9b642f"
        texture={textures.treatedPine}
      />
      <BeamBetween
        start={[lengthM / 2, roofHeightAt(spec, lengthM / 2, -widthM / 2), -widthM / 2]}
        end={[lengthM / 2, roofHeightAt(spec, lengthM / 2, widthM / 2), widthM / 2]}
        size={[0.045, 0.14]}
        color="#9b642f"
        texture={textures.treatedPine}
      />
    </>
  );
}

function RoofFrame({ spec, textures }: SceneLayerProps) {
  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const overhang = 0.22;
  const timber = "#b4773c";
  const spacingM = mmToM(spec.rafterSpacingMm);

  const roofPoint = (x: number, z: number): Point3 => [x, roofHeightAt(spec, x, z) + 0.02, z];

  const rafterLines =
    spec.roofFallDirection === "length"
      ? divisions(-widthM / 2 - overhang, widthM / 2 + overhang, spacingM).map((z) => ({
          start: roofPoint(-lengthM / 2 - overhang, z),
          end: roofPoint(lengthM / 2 + overhang, z),
        }))
      : divisions(-lengthM / 2 - overhang, lengthM / 2 + overhang, spacingM).map((x) => ({
          start: roofPoint(x, -widthM / 2 - overhang),
          end: roofPoint(x, widthM / 2 + overhang),
        }));

  return (
    <>
      {rafterLines.map((beam, index) => (
        <BeamBetween key={`rafter-${index}`} start={beam.start} end={beam.end} size={[0.045, 0.14]} color={timber} texture={textures.treatedPine} />
      ))}
      <BeamBetween
        start={roofPoint(-lengthM / 2 - overhang, -widthM / 2 - overhang)}
        end={roofPoint(lengthM / 2 + overhang, -widthM / 2 - overhang)}
        size={[0.045, 0.14]}
        color="#8f5f32"
        texture={textures.treatedPine}
      />
      <BeamBetween
        start={roofPoint(-lengthM / 2 - overhang, widthM / 2 + overhang)}
        end={roofPoint(lengthM / 2 + overhang, widthM / 2 + overhang)}
        size={[0.045, 0.14]}
        color="#8f5f32"
        texture={textures.treatedPine}
      />
      <BeamBetween
        start={roofPoint(-lengthM / 2 - overhang, -widthM / 2 - overhang)}
        end={roofPoint(-lengthM / 2 - overhang, widthM / 2 + overhang)}
        size={[0.045, 0.14]}
        color="#8f5f32"
        texture={textures.treatedPine}
      />
      <BeamBetween
        start={roofPoint(lengthM / 2 + overhang, -widthM / 2 - overhang)}
        end={roofPoint(lengthM / 2 + overhang, widthM / 2 + overhang)}
        size={[0.045, 0.14]}
        color="#8f5f32"
        texture={textures.treatedPine}
      />
    </>
  );
}

function ExteriorShell({ spec, textures }: SceneLayerProps) {
  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const floorY = mmToM(spec.floorHeightMm) + 0.18;
  const overhang = 0.22;
  const wallColor = "#f1f4ef";
  const roofColor = "#f7faf7";
  const offset = 0.032;

  const top = (x: number, z: number): Point3 => [x, roofHeightAt(spec, x, z) - 0.03, z];
  const roof = (x: number, z: number): Point3 => [x, roofHeightAt(spec, x, z) + 0.075, z];
  const roofRibRuns =
    spec.roofFallDirection === "width"
      ? divisions(-lengthM / 2 - overhang, lengthM / 2 + overhang, 0.28).map((x) => ({
          start: roof(x, -widthM / 2 - overhang),
          end: roof(x, widthM / 2 + overhang),
        }))
      : divisions(-widthM / 2 - overhang, widthM / 2 + overhang, 0.28).map((z) => ({
          start: roof(-lengthM / 2 - overhang, z),
          end: roof(lengthM / 2 + overhang, z),
        }));
  const wallRibXs = divisions(-lengthM / 2 + 0.2, lengthM / 2 - 0.2, 0.32);
  const highWallZ = spec.roofHighSide === "right" ? widthM / 2 + offset * 1.35 : -widthM / 2 - offset * 1.35;
  const lowWallZ = spec.roofHighSide === "right" ? -widthM / 2 - offset * 1.35 : widthM / 2 + offset * 1.35;
  const highWallHeight = Math.max(0.4, roofHeightAt(spec, 0, highWallZ) - floorY - 0.05);
  const lowWallHeight = Math.max(0.4, roofHeightAt(spec, 0, lowWallZ) - floorY - 0.05);

  return (
    <>
      <QuadPanel
        color={wallColor}
        texture={textures.surfmistColorbond}
        opacity={0.68}
        points={[
          [-lengthM / 2, floorY, -widthM / 2 - offset],
          [lengthM / 2, floorY, -widthM / 2 - offset],
          top(lengthM / 2, -widthM / 2 - offset),
          top(-lengthM / 2, -widthM / 2 - offset),
        ]}
      />
      <QuadPanel
        color={wallColor}
        texture={textures.surfmistColorbond}
        opacity={0.68}
        points={[
          [-lengthM / 2, floorY, widthM / 2 + offset],
          [lengthM / 2, floorY, widthM / 2 + offset],
          top(lengthM / 2, widthM / 2 + offset),
          top(-lengthM / 2, widthM / 2 + offset),
        ]}
      />
      <QuadPanel
        color={wallColor}
        texture={textures.surfmistColorbond}
        opacity={0.58}
        points={[
          [-lengthM / 2 - offset, floorY, -widthM / 2],
          [-lengthM / 2 - offset, floorY, widthM / 2],
          top(-lengthM / 2 - offset, widthM / 2),
          top(-lengthM / 2 - offset, -widthM / 2),
        ]}
      />
      <QuadPanel
        color={wallColor}
        texture={textures.surfmistColorbond}
        opacity={0.58}
        points={[
          [lengthM / 2 + offset, floorY, -widthM / 2],
          [lengthM / 2 + offset, floorY, widthM / 2],
          top(lengthM / 2 + offset, widthM / 2),
          top(lengthM / 2 + offset, -widthM / 2),
        ]}
      />
      <QuadPanel
        color={roofColor}
        texture={textures.surfmistColorbond}
        opacity={0.96}
        metalness={0.18}
        points={[
          roof(-lengthM / 2 - overhang, -widthM / 2 - overhang),
          roof(lengthM / 2 + overhang, -widthM / 2 - overhang),
          roof(lengthM / 2 + overhang, widthM / 2 + overhang),
          roof(-lengthM / 2 - overhang, widthM / 2 + overhang),
        ]}
      />
      {roofRibRuns.map((rib, index) => (
        <BeamBetween
          key={`colorbond-roof-rib-${index}`}
          start={rib.start}
          end={rib.end}
          size={[0.012, 0.026]}
          color="#b9c0bd"
          opacity={0.85}
        />
      ))}
      {wallRibXs.map((x, index) => (
        <group key={`colorbond-wall-rib-${index}`}>
          <Box
            position={[x, floorY + highWallHeight / 2, highWallZ]}
            size={[0.018, highWallHeight, 0.018]}
            color="#c4cbc7"
            opacity={0.74}
            metalness={0.14}
          />
          <Box
            position={[x, floorY + lowWallHeight / 2, lowWallZ]}
            size={[0.018, lowWallHeight, 0.018]}
            color="#c4cbc7"
            opacity={0.74}
            metalness={0.14}
          />
        </group>
      ))}
    </>
  );
}

function FloorFinish({ spec, textures }: SceneLayerProps) {
  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const floorY = mmToM(spec.floorHeightMm) + 0.19;

  return (
    <>
      {spec.flooringStack !== "finish-only" && (
        <Box
          position={[0, floorY + 0.018, 0]}
          size={[lengthM, 0.035, widthM]}
          color="#d9c7a5"
          opacity={0.9}
          texture={textures.structuralPlywood}
        />
      )}
      {spec.flooringStack !== "structural-only" && (
        <Box
          position={[0, floorY + 0.045, 0]}
          size={[lengthM, 0.026, widthM]}
          color="#c79a5d"
          opacity={0.95}
          texture={textures.timberFloorboards}
        />
      )}
    </>
  );
}

function DoorDeckAndSteps({ spec, textures }: SceneLayerProps) {
  if (!spec.openings.frontDoor) {
    return null;
  }

  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const doorX = -lengthM * 0.34;
  const doorSideZ = widthM / 2;
  const deckWidth = 1.9;
  const deckDepth = 1.15;
  const deckSurfaceY = mmToM(spec.floorHeightMm) + 0.205;
  const deckCenterZ = doorSideZ + deckDepth / 2 + 0.05;
  const timber = "#a96e37";
  const frame = "#8e5a2d";
  const stepCount = Math.max(3, Math.ceil(deckSurfaceY / 0.17));
  const treadWidth = 1.35;
  const treadDepth = 0.34;
  const treadRise = deckSurfaceY / (stepCount + 1);
  const stairStartZ = deckCenterZ + deckDepth / 2 + 0.12;
  const stringerStart: Point3 = [doorX - 0.54, deckSurfaceY - 0.08, deckCenterZ + deckDepth / 2 - 0.08];
  const stringerEnd: Point3 = [doorX - 0.54, treadRise, stairStartZ + stepCount * treadDepth];

  return (
    <group>
      <Box
        position={[doorX, deckSurfaceY, deckCenterZ]}
        size={[deckWidth, 0.055, deckDepth]}
        color="#b98248"
        texture={textures.treatedPine}
      />
      <Box position={[doorX, deckSurfaceY - 0.095, deckCenterZ - deckDepth / 2]} size={[deckWidth, 0.14, 0.045]} color={frame} texture={textures.treatedPine} />
      <Box position={[doorX, deckSurfaceY - 0.095, deckCenterZ + deckDepth / 2]} size={[deckWidth, 0.14, 0.045]} color={frame} texture={textures.treatedPine} />
      <Box position={[doorX - deckWidth / 2, deckSurfaceY - 0.095, deckCenterZ]} size={[0.045, 0.14, deckDepth]} color={frame} texture={textures.treatedPine} />
      <Box position={[doorX + deckWidth / 2, deckSurfaceY - 0.095, deckCenterZ]} size={[0.045, 0.14, deckDepth]} color={frame} texture={textures.treatedPine} />
      {[-1, 1].map((side) => (
        <group key={`deck-post-${side}`}>
          <mesh position={[doorX + side * (deckWidth / 2 - 0.12), 0.045, deckCenterZ + deckDepth / 2 - 0.1]} receiveShadow>
            <cylinderGeometry args={[0.16, 0.19, 0.09, 24]} />
            <meshStandardMaterial color="#b8b2a4" map={textures.concretePier} roughness={0.86} />
          </mesh>
          <Box
            position={[doorX + side * (deckWidth / 2 - 0.12), deckSurfaceY / 2, deckCenterZ + deckDepth / 2 - 0.1]}
            size={[0.09, deckSurfaceY, 0.09]}
            color="#8a6b3d"
            texture={textures.treatedPine}
          />
        </group>
      ))}
      <BeamBetween start={stringerStart} end={stringerEnd} size={[0.045, 0.14]} color={frame} texture={textures.treatedPine} />
      <BeamBetween
        start={[doorX + 0.54, stringerStart[1], stringerStart[2]]}
        end={[doorX + 0.54, stringerEnd[1], stringerEnd[2]]}
        size={[0.045, 0.14]}
        color={frame}
        texture={textures.treatedPine}
      />
      {Array.from({ length: stepCount }, (_, index) => (
        <Box
          key={`deck-step-${index}`}
          position={[doorX, deckSurfaceY - treadRise * (index + 1), stairStartZ + index * treadDepth]}
          size={[treadWidth, 0.055, treadDepth]}
          color={timber}
          texture={textures.treatedPine}
        />
      ))}
    </group>
  );
}

function FixingsLayer({ spec }: Scene3DProps) {
  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const floorY = mmToM(spec.floorHeightMm) + 0.15;
  const metal = "#6f7b7f";
  const roofScrewRows = divisions(-lengthM / 2, lengthM / 2, 0.8);
  const roofTiePosts = roofTiePostCentersM(spec);

  return (
    <>
      {pierPositions(spec).map((pier, index) => {
        const concreteCenter = concretePierCenterM(pier);

        return (
          <group key={`fixing-${index}`}>
            <Box position={[concreteCenter.x, floorY - 0.035, concreteCenter.z]} size={[0.24, 0.035, 0.24]} color={metal} metalness={0.4} />
            <Box position={[concreteCenter.x, floorY + 0.045, concreteCenter.z]} size={[0.16, 0.035, 0.16]} color="#394348" metalness={0.45} />
          </group>
        );
      })}
      {roofScrewRows.map((x, index) => (
        <group key={`roof-screw-${index}`}>
          <mesh position={[x, roofHeightAt(spec, x, -widthM / 2) + 0.11, -widthM / 2 - 0.09]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.018, 16]} />
            <meshStandardMaterial color="#56646b" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[x, roofHeightAt(spec, x, widthM / 2) + 0.11, widthM / 2 + 0.09]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.018, 16]} />
            <meshStandardMaterial color="#56646b" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
      ))}
      {roofTiePosts.map((post, index) => {
        const side = post.z > 0 ? 1 : -1;
        const plateY = roofHeightAt(spec, post.x, post.z) - 0.16;
        const plateZ = post.z + side * 0.078;

        return (
          <group key={`roof-tie-bolt-${index}`}>
            <Box position={[post.x, plateY, plateZ]} size={[0.22, 0.075, 0.032]} color="#46525a" metalness={0.48} />
            <Box position={[post.x - 0.058, plateY + 0.002, plateZ + side * 0.022]} size={[0.03, 0.03, 0.03]} color="#232b30" metalness={0.65} />
            <Box position={[post.x + 0.058, plateY + 0.002, plateZ + side * 0.022]} size={[0.03, 0.03, 0.03]} color="#232b30" metalness={0.65} />
          </group>
        );
      })}
    </>
  );
}

function InteriorShell({ spec, textures }: SceneLayerProps) {
  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const floorY = mmToM(spec.floorHeightMm) + 0.19;

  return (
    <>
      <Box position={[-lengthM / 6, floorY + 0.045, 0]} size={[0.035, 0.05, widthM]} color="#6e8f93" opacity={0.68} />
      <Box position={[lengthM / 6, floorY + 0.045, 0]} size={[0.035, 0.05, widthM]} color="#6e8f93" opacity={0.68} />
      <Box position={[0, floorY + 0.045, 0]} size={[lengthM, 0.04, 0.025]} color="#6e8f93" opacity={0.55} />
    </>
  );
}

function OpeningsLayer({ spec, textures }: SceneLayerProps) {
  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const floorY = mmToM(spec.floorHeightMm) + 0.19;

  return (
    <>
      {spec.openings.frontDoor && (
        <>
          <Box
            position={[-lengthM * 0.34, floorY + 1.02, widthM / 2 + 0.058]}
            size={[0.9, 2.08, 0.052]}
            color="#f2f2ee"
            opacity={0.98}
            texture={textures.frontDoor}
          />
        </>
      )}
      {spec.openings.sideWindow && (
        <>
          <Box
            position={[lengthM * 0.2, floorY + 1.45, -widthM / 2 - 0.058]}
            size={[1.18, 0.92, 0.052]}
            color="#f4f7f8"
            opacity={0.94}
            texture={textures.aluminiumWindow}
          />
        </>
      )}
      {spec.openings.rearWindow && (
        <>
          <Box
            position={[lengthM / 2 + 0.058, floorY + 1.42, 0.58]}
            size={[0.052, 0.84, 1.1]}
            color="#f4f7f8"
            opacity={0.94}
            texture={textures.aluminiumWindow}
          />
        </>
      )}
    </>
  );
}

function TinyHomeModel({ spec }: Scene3DProps) {
  const lengthM = mmToM(spec.lengthMm);
  const widthM = mmToM(spec.widthMm);
  const textures = useTexturePack();
  const highZ = spec.roofHighSide === "right" ? widthM / 2 : -widthM / 2;
  const lowZ = spec.roofHighSide === "right" ? -widthM / 2 : widthM / 2;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]} receiveShadow>
        <planeGeometry args={[Math.max(8, lengthM + 1.8), Math.max(5.5, widthM + 1.8)]} />
        <meshStandardMaterial color="#d7d2c5" roughness={0.9} />
      </mesh>

      {spec.layers.foundation && <Foundation spec={spec} textures={textures} />}
      {spec.layers.floorFrame && <FloorFrame spec={spec} textures={textures} />}
      {spec.layers.floorFinish && <FloorFinish spec={spec} textures={textures} />}
      {(spec.layers.exterior || spec.layers.floorFinish) && <DoorDeckAndSteps spec={spec} textures={textures} />}
      {spec.layers.wallFrame && <WallFrame spec={spec} textures={textures} />}
      {spec.layers.roofFrame && <RoofFrame spec={spec} textures={textures} />}
      {spec.layers.exterior && <ExteriorShell spec={spec} textures={textures} />}
      {spec.layers.interior && <InteriorShell spec={spec} textures={textures} />}
      {(spec.layers.exterior || spec.layers.interior) && <OpeningsLayer spec={spec} textures={textures} />}
      {spec.layers.fixings && <FixingsLayer spec={spec} />}

      <Label position={[0, 0.08, widthM / 2 + 0.58]}>6m long face</Label>
      <Label position={[lengthM / 2 + 0.52, 1.55, 0]}>3m max height</Label>
      {spec.roofFallDirection === "width" && (
        <>
          <Label position={[-lengthM / 2 - 0.18, roofHeightAt(spec, -lengthM / 2, highZ) + 0.3, highZ]}>
            {`HIGH ${roofHighSideLabel(spec)}`}
          </Label>
          <Label position={[lengthM / 2 + 0.18, roofHeightAt(spec, lengthM / 2, lowZ) + 0.3, lowZ]}>
            {`LOW ${roofLowSideLabel(spec)}`}
          </Label>
        </>
      )}
    </group>
  );
}

export function Scene3D({ spec }: Scene3DProps) {
  return (
    <div className="scene-frame" data-testid="scene-frame">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <PerspectiveCamera makeDefault position={[6.8, 4.2, 5.8]} fov={42} />
        <Sky turbidity={8} rayleigh={1.2} mieCoefficient={0.015} mieDirectionalG={0.8} />
        <ambientLight intensity={0.58} />
        <directionalLight position={[4, 6, 3]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
        <TinyHomeModel spec={spec} />
        <gridHelper args={[10, 20, "#a8a095", "#d7d1c5"]} position={[0, 0.004, 0]} />
        <OrbitControls makeDefault target={[0, 1.45, 0]} minDistance={4} maxDistance={12} maxPolarAngle={Math.PI / 2.08} />
      </Canvas>
    </div>
  );
}
