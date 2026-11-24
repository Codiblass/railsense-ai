import React, { useMemo } from 'react';
import * as THREE from 'three';
import { TRACK_SPECS } from '../constants/trackSpecs';

/**
 * 2-Metre Miniature Railway Track Environment
 * Includes:
 * - Steel Basebed & Crushed Stone Ballast
 * - Realistic Wooden/Composite Railway Sleepers with Tie-plates & Hex Lag Screws
 * - 5 Independently Replaceable Track Modules (0.4m each)
 * - Measurement Metric Ruler with 10cm ticks and 2.0-Metre Scale Indicator
 * - Physical Joint Fishplates with Hex Bolts
 * - Dynamic Geometry for Module 3 Fault Insertion (Joint step, Loose sleeper void, Lateral slew, Corrugation)
 */

export function RailwayTrack({ activeFault, severity = 1.0, highlightedModule = 2 }) {
  const { TOTAL_LENGTH_M, MODULE_LENGTH_M, GAUGE_M, SLEEPER_SPACING_M } = TRACK_SPECS;
  const halfGauge = GAUGE_M / 2;
  const sleeperCount = Math.floor(TOTAL_LENGTH_M / SLEEPER_SPACING_M); // 40 sleepers

  // Sleepers configuration across the 2.0m track
  const sleepers = useMemo(() => {
    const list = [];
    for (let i = 0; i <= sleeperCount; i++) {
      const z = (i * SLEEPER_SPACING_M) - (TOTAL_LENGTH_M / 2);
      const posM = i * SLEEPER_SPACING_M;
      
      // Check if sleeper is in the interchangeable fault module (0.8m to 1.2m)
      const isFaultModule = posM >= 0.8 && posM <= 1.2;
      let isLoose = false;
      let yOffset = 0;
      let rotX = 0;

      // Module 3: Loose Sleeper Fault condition
      if (activeFault.id === 'loose_sleeper' && Math.abs(posM - 1.0) < 0.08) {
        isLoose = true;
        yOffset = -0.008 * severity; // 8mm dip under ballast void
        rotX = 0.04 * severity; // slight tilt
      }

      list.push({
        id: i,
        posM,
        z,
        isFaultModule,
        isLoose,
        yOffset,
        rotX,
      });
    }
    return list;
  }, [sleeperCount, SLEEPER_SPACING_M, TOTAL_LENGTH_M, activeFault.id, severity]);

  // Generate rail geometries for 5 modules
  // Module 0: 0.0m - 0.4m  (z: -1.0 to -0.6)
  // Module 1: 0.4m - 0.8m  (z: -0.6 to -0.2)
  // Module 2: 0.8m - 1.2m  (z: -0.2 to +0.2) [FAULT TEST BED]
  // Module 3: 1.2m - 1.6m  (z: +0.2 to +0.6)
  // Module 4: 1.6m - 2.0m  (z: +0.6 to +1.0)

  // Rail cross-section profile (realistic miniature I-beam Vignole rail shape)
  const railShape = useMemo(() => {
    const shape = new THREE.Shape();
    // width: 14mm base, 6mm web, 10mm head, height: 18mm
    const wBase = 0.014;
    const wWeb = 0.005;
    const wHead = 0.010;
    const hTotal = 0.018;
    const hBase = 0.003;
    const hHead = 0.005;

    shape.moveTo(-wBase / 2, 0);
    shape.lineTo(wBase / 2, 0);
    shape.lineTo(wBase / 2, hBase);
    shape.lineTo(wWeb / 2, hBase + 0.002);
    shape.lineTo(wWeb / 2, hTotal - hHead);
    shape.lineTo(wHead / 2, hTotal - hHead + 0.002);
    shape.lineTo(wHead / 2, hTotal);
    shape.lineTo(-wHead / 2, hTotal);
    shape.lineTo(-wHead / 2, hTotal - hHead + 0.002);
    shape.lineTo(-wWeb / 2, hTotal - hHead);
    shape.lineTo(-wWeb / 2, hBase + 0.002);
    shape.lineTo(-wBase / 2, hBase);
    shape.closePath();
    return shape;
  }, []);

  // Normal rail module geometry
  const normalRailGeom = useMemo(() => {
    return new THREE.ExtrudeGeometry(railShape, {
      steps: 4,
      depth: MODULE_LENGTH_M,
      bevelEnabled: false,
    });
  }, [railShape, MODULE_LENGTH_M]);

  // Fault Module 2 (Center: z = -0.2m to +0.2m) Left and Right Rail Geometries
  const { leftFaultRailGeom, rightFaultRailGeom } = useMemo(() => {
    const steps = 60;
    const len = MODULE_LENGTH_M; // 0.40m

    // Left Rail Path
    const leftPoints = [];
    const rightPoints = [];

    for (let i = 0; i <= steps; i++) {
      const frac = i / steps; // 0.0 to 1.0 along the module (corresponds to track pos 0.8m to 1.2m)
      const localZ = frac * len;

      let lY = 0;
      let lX = 0;
      let rY = 0;
      let rX = 0;

      if (activeFault.id === 'joint') {
        // Step height lip at frac = 0.5 (1.0m)
        if (frac >= 0.5) {
          lY = 0.0035 * severity; // 3.5mm vertical step
          rY = 0.0035 * severity;
        }
      } else if (activeFault.id === 'loose_sleeper') {
        // Sag in the middle due to loose ballast
        const dip = Math.sin(frac * Math.PI) * (0.005 * severity);
        lY = -dip;
        rY = -dip;
      } else if (activeFault.id === 'lateral') {
        // Lateral displacement curve on right rail
        const slew = Math.sin(frac * Math.PI * 2) * (0.007 * severity);
        rX = slew; // right rail bends laterally outward
      } else if (activeFault.id === 'corrugation') {
        // Longitudinal ripple waves on both rails
        const ripple = Math.sin(frac * Math.PI * 16) * (0.0025 * severity);
        lY = ripple;
        rY = ripple;
      }

      leftPoints.push(new THREE.Vector3(lX, lY, localZ));
      rightPoints.push(new THREE.Vector3(rX, rY, localZ));
    }

    const leftCurve = new THREE.CatmullRomCurve3(leftPoints);
    const rightCurve = new THREE.CatmullRomCurve3(rightPoints);

    const lGeom = new THREE.ExtrudeGeometry(railShape, {
      extrudePath: leftCurve,
      steps: 60,
      bevelEnabled: false,
    });
    const rGeom = new THREE.ExtrudeGeometry(railShape, {
      extrudePath: rightCurve,
      steps: 60,
      bevelEnabled: false,
    });

    return { leftFaultRailGeom: lGeom, rightFaultRailGeom: rGeom };
  }, [railShape, MODULE_LENGTH_M, activeFault.id, severity]);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Track Concrete Foundation Slab & Laboratory Bench */}
      <mesh position={[0, -0.065, 0]} receiveShadow>
        <boxGeometry args={[0.42, 0.04, 2.30]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* 2. Realistic Ballast Bed (Crushed Dark Granite Aggregate) */}
      <mesh position={[0, -0.035, 0]} receiveShadow>
        <boxGeometry args={[0.34, 0.024, 2.12]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.95}
          metalness={0.15}
          bumpScale={0.05}
        />
      </mesh>

      {/* Ballast Void Visualization when Loose Sleeper Fault is Active */}
      {activeFault.id === 'loose_sleeper' && (
        <group position={[0, -0.024, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.30, 0.015, 0.12]} />
            <meshStandardMaterial color="#0f172a" roughness={1.0} />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <ringGeometry args={[0.08, 0.12, 16]} />
            <meshBasicMaterial color="#f59e0b" wireframe />
          </mesh>
        </group>
      )}

      {/* 3. Sleepers (Ties) with Steel Baseplates and Fasteners */}
      {sleepers.map((s) => (
        <group key={s.id} position={[0, -0.015 + s.yOffset, s.z]} rotation={[s.rotX, 0, 0]}>
          {/* Main Wooden/Composite Sleeper Body */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.28, 0.016, 0.03]} />
            <meshStandardMaterial
              color={s.isLoose ? '#78350f' : s.isFaultModule ? '#475569' : '#3b3a30'}
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>

          {/* Left Tie Plate & Hex Fasteners */}
          <mesh position={[-halfGauge, 0.009, 0]}>
            <boxGeometry args={[0.028, 0.002, 0.024]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[-halfGauge - 0.009, 0.011, 0]}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.003, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-halfGauge + 0.009, 0.011, 0]}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.003, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Right Tie Plate & Hex Fasteners */}
          <mesh position={[halfGauge, 0.009, 0]}>
            <boxGeometry args={[0.028, 0.002, 0.024]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[halfGauge - 0.009, 0.011, 0]}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.003, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[halfGauge + 0.009, 0.011, 0]}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.003, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* 4. Five Replaceable Modules */}
      {[0, 1, 2, 3, 4].map((modIdx) => {
        // Module start Z in world: -1.0 + modIdx * 0.4
        const modStartZ = -1.0 + modIdx * MODULE_LENGTH_M;
        const isFaultModule = modIdx === 2; // Center module is test bed
        const isSelected = highlightedModule === modIdx;

        return (
          <group key={modIdx}>
            {/* Module Base Plate Boundary / Quick-Release Mounting Plate */}
            <mesh position={[0, -0.046, modStartZ + MODULE_LENGTH_M / 2]}>
              <boxGeometry args={[0.36, 0.002, MODULE_LENGTH_M - 0.004]} />
              <meshStandardMaterial
                color={
                  isFaultModule
                    ? activeFault.id === 'normal'
                      ? '#065f46'
                      : '#7f1d1d'
                    : '#1e293b'
                }
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>

            {/* Quick-Release Mechanical Clamping Brackets on Module Edges */}
            <mesh position={[-0.17, -0.04, modStartZ + 0.02]}>
              <boxGeometry args={[0.015, 0.012, 0.02]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.17, -0.04, modStartZ + 0.02]}>
              <boxGeometry args={[0.015, 0.012, 0.02]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[-0.17, -0.04, modStartZ + MODULE_LENGTH_M - 0.02]}>
              <boxGeometry args={[0.015, 0.012, 0.02]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.17, -0.04, modStartZ + MODULE_LENGTH_M - 0.02]}>
              <boxGeometry args={[0.015, 0.012, 0.02]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Fishplate Rail Joint Assemblies at Module Junctions */}
            {modIdx > 0 && (
              <group position={[0, 0, modStartZ]}>
                {/* Left Rail Fishplate Bars & 4 Bolts */}
                <mesh position={[-halfGauge - 0.004, 0.008, 0]}>
                  <boxGeometry args={[0.003, 0.009, 0.05]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
                </mesh>
                <mesh position={[-halfGauge + 0.004, 0.008, 0]}>
                  <boxGeometry args={[0.003, 0.009, 0.05]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
                </mesh>
                {/* 4 Hex bolts */}
                {[-0.018, -0.006, 0.006, 0.018].map((bz, bIndex) => (
                  <mesh key={bIndex} position={[-halfGauge - 0.006, 0.008, bz]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.0018, 0.0018, 0.006, 6]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                  </mesh>
                ))}

                {/* Right Rail Fishplate Bars & 4 Bolts */}
                <mesh position={[halfGauge - 0.004, 0.008, 0]}>
                  <boxGeometry args={[0.003, 0.009, 0.05]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
                </mesh>
                <mesh position={[halfGauge + 0.004, 0.008, 0]}>
                  <boxGeometry args={[0.003, 0.009, 0.05]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
                </mesh>
                {[-0.018, -0.006, 0.006, 0.018].map((bz, bIndex) => (
                  <mesh key={bIndex} position={[halfGauge + 0.006, 0.008, bz]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.0018, 0.0018, 0.006, 6]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                  </mesh>
                ))}
              </group>
            )}

            {/* Actual Steel Rails */}
            {isFaultModule ? (
              // Center fault module with custom parametric geometries
              <group position={[0, -0.005, modStartZ]}>
                {/* Left Fault Rail */}
                <mesh
                  geometry={leftFaultRailGeom}
                  position={[-halfGauge, 0, 0]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial
                    color={activeFault.id === 'joint' || activeFault.id === 'corrugation' ? '#cbd5e1' : '#94a3b8'}
                    metalness={0.92}
                    roughness={0.18}
                  />
                </mesh>

                {/* Right Fault Rail */}
                <mesh
                  geometry={rightFaultRailGeom}
                  position={[halfGauge, 0, 0]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial
                    color={activeFault.id === 'lateral' ? '#f472b6' : '#94a3b8'}
                    metalness={0.92}
                    roughness={0.18}
                  />
                </mesh>

                {/* Special Uneven Joint Highlight Lip Gap at 1.0m (modStartZ + 0.2m) */}
                {activeFault.id === 'joint' && (
                  <group position={[0, 0.008, 0.2]}>
                    {/* Visual gap and height step indicator */}
                    <mesh position={[-halfGauge, 0.004 * severity, 0]}>
                      <boxGeometry args={[0.012, 0.008 * severity, 0.008]} />
                      <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.8} />
                    </mesh>
                    <mesh position={[halfGauge, 0.004 * severity, 0]}>
                      <boxGeometry args={[0.012, 0.008 * severity, 0.008]} />
                      <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.8} />
                    </mesh>
                  </group>
                )}
              </group>
            ) : (
              // Standard Normal Module Straight Steel Rails
              <group position={[0, -0.005, modStartZ]}>
                <mesh
                  geometry={normalRailGeom}
                  position={[-halfGauge, 0, 0]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.18} />
                </mesh>
                <mesh
                  geometry={normalRailGeom}
                  position={[halfGauge, 0, 0]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.18} />
                </mesh>
              </group>
            )}

            {/* Module Identification Badge Label on Ground */}
            <group position={[0.19, -0.044, modStartZ + MODULE_LENGTH_M / 2]} rotation={[-Math.PI / 2, 0, 0]}>
              <mesh>
                <planeGeometry args={[0.05, 0.12]} />
                <meshBasicMaterial
                  color={isFaultModule && activeFault.id !== 'normal' ? '#ef4444' : '#1e3a8a'}
                />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* 5. Precision Engineering Metric Ruler Markings along track edge */}
      <group position={[-0.19, -0.043, -1.0]}>
        {/* Longitudinal metric baseline */}
        <mesh position={[0, 0, 1.0]}>
          <boxGeometry args={[0.012, 0.002, 2.0]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>

        {/* 10cm Metric Ticks (0.0m to 2.0m) */}
        {Array.from({ length: 21 }).map((_, idx) => {
          const tickZ = idx * 0.10;
          const isMajor = idx % 5 === 0; // every 50cm
          const isFaultBoundary = idx === 8 || idx === 12; // 0.8m and 1.2m
          return (
            <group key={idx} position={[0, 0.002, tickZ]}>
              <mesh>
                <boxGeometry
                  args={[
                    isMajor ? 0.024 : 0.014,
                    0.001,
                    isFaultBoundary ? 0.004 : 0.002,
                  ]}
                />
                <meshBasicMaterial
                  color={isFaultBoundary ? '#ef4444' : isMajor ? '#38bdf8' : '#64748b'}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* 6. High-Tech 2.0-Metre Scale Indicator Banner */}
      <group position={[0, -0.05, 1.18]}>
        <mesh>
          <boxGeometry args={[0.32, 0.006, 0.04]} />
          <meshStandardMaterial color="#090d16" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
