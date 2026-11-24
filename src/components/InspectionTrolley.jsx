import React, { useRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { TRACK_SPECS } from '../constants/trackSpecs';

/**
 * Detailed 4-Wheel Railway Inspection Trolley Model
 * Components:
 * 1. 4 Steel Flanged Railway Wheels (tread + retaining flange)
 * 2. Solid Aluminum / Steel Chassis Platform with mounting slots
 * 3. Two High-Tensile Steel Wheel Axles with pillow-block bearing caps
 * 4. ESP32 NodeMCU development board with micro-USB, SoC chip, WiFi antenna trace & pin headers
 * 5. MPU6050 6-DOF IMU module with decoupling capacitor & solder pads
 * 6. Optical Wheel Rotary Encoder disk with slotted encoder optocoupler bracket
 * 7. Li-ion 18650 2S Rechargeable Battery Pack with wiring harness
 * 8. Brushed DC Gearmotor with brass pinion and drive gear on rear axle
 * 9. Realistic jumper ribbon wiring harness connecting sensors to ESP32
 * 10. Floating 3D engineering component labels
 * 11. Exploded view animation state
 */

export function InspectionTrolley({
  positionM = 0,
  speedMs = 0,
  activeFault,
  severity = 1.0,
  showLabels = true,
  explodedView = false,
}) {
  const { GAUGE_M, WHEEL_DIAMETER_M } = TRACK_SPECS;
  const halfGauge = GAUGE_M / 2;
  const wheelRadius = WHEEL_DIAMETER_M / 2; // 0.025m (25mm)
  const wheelBase = 0.16; // 160mm wheelbase (distance between front and rear axle)

  // Calculate dynamic wheel rotation angle based on travel distance
  const wheelRotationAngle = -(positionM / wheelRadius);

  // Dynamic vertical & lateral bounce of the trolley body depending on track position and active fault
  let dynamicY = 0;
  let dynamicX = 0;
  let dynamicPitch = 0;
  let dynamicRoll = 0;

  if (positionM >= 0.8 && positionM <= 1.2 && activeFault && activeFault.id !== 'normal') {
    const p = (positionM - 0.8) / 0.4;
    if (activeFault.id === 'joint' && Math.abs(positionM - 1.0) < 0.04) {
      const impulse = (1.0 - Math.abs(positionM - 1.0) / 0.04);
      dynamicY = impulse * 0.0035 * severity;
      dynamicPitch = impulse * 0.06 * severity;
    } else if (activeFault.id === 'loose_sleeper' && Math.abs(positionM - 1.0) < 0.1) {
      const dip = Math.sin((positionM - 0.9) / 0.2 * Math.PI);
      dynamicY = -dip * 0.005 * severity;
      dynamicPitch = -Math.cos((positionM - 0.9) / 0.2 * Math.PI) * 0.03 * severity;
    } else if (activeFault.id === 'lateral' && positionM >= 0.85 && positionM <= 1.15) {
      const slew = Math.sin((positionM - 0.85) / 0.3 * Math.PI * 2);
      dynamicX = slew * 0.006 * severity;
      dynamicRoll = slew * 0.04 * severity;
    } else if (activeFault.id === 'corrugation') {
      const ripple = Math.sin(positionM * 40 * 2 * Math.PI);
      dynamicY = ripple * 0.002 * severity;
    }
  }

  // Exploded view offsets
  const explodeOffset = explodedView ? 0.045 : 0;
  const explodeElectronics = explodedView ? 0.09 : 0;
  const explodeWheels = explodedView ? 0.03 : 0;

  // World Z position of trolley center (Track is centered from -1.0m to +1.0m)
  const worldZ = -1.0 + positionM;
  // Rail top surface is at approx y = 0.013m, wheel axle center is at y = 0.013 + wheelRadius
  const baseAxleY = 0.013 + wheelRadius;

  return (
    <group
      position={[dynamicX, baseAxleY + dynamicY, worldZ]}
      rotation={[dynamicPitch, 0, dynamicRoll]}
    >
      {/* ========================================================================= */}
      {/* 1. FRONT AXLE ASSEMBLY & FLANGED WHEELS                                  */}
      {/* ========================================================================= */}
      <group position={[0, 0, wheelBase / 2]}>
        {/* Steel Axle Shaft */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.003, 0.003, GAUGE_M + 0.02 + explodeWheels * 2, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Left Front Wheel (Steel Tread + Flange) */}
        <group
          position={[-halfGauge - explodeWheels, 0, 0]}
          rotation={[wheelRotationAngle, 0, 0]}
        >
          {/* Wheel Tread (Contacts Rail Head) */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[wheelRadius, wheelRadius, 0.012, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Inner Retaining Safety Flange */}
          <mesh position={[0.007, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[wheelRadius + 0.006, wheelRadius + 0.006, 0.0025, 24]} />
            <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Wheel Hub & Hex Center Bolt */}
          <mesh position={[-0.007, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.003, 6]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* Right Front Wheel */}
        <group
          position={[halfGauge + explodeWheels, 0, 0]}
          rotation={[wheelRotationAngle, 0, 0]}
        >
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[wheelRadius, wheelRadius, 0.012, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
          </mesh>
          <mesh position={[-0.007, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[wheelRadius + 0.006, wheelRadius + 0.006, 0.0025, 24]} />
            <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0.007, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.003, 6]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 2. REAR AXLE ASSEMBLY, DRIVE GEAR, & WHEEL ENCODER DISK                   */}
      {/* ========================================================================= */}
      <group position={[0, 0, -wheelBase / 2]}>
        {/* Rear Steel Axle Shaft */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.003, 0.003, GAUGE_M + 0.02 + explodeWheels * 2, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Left Rear Wheel */}
        <group
          position={[-halfGauge - explodeWheels, 0, 0]}
          rotation={[wheelRotationAngle, 0, 0]}
        >
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[wheelRadius, wheelRadius, 0.012, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
          </mesh>
          <mesh position={[0.007, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[wheelRadius + 0.006, wheelRadius + 0.006, 0.0025, 24]} />
            <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[-0.007, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.003, 6]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* Right Rear Wheel */}
        <group
          position={[halfGauge + explodeWheels, 0, 0]}
          rotation={[wheelRotationAngle, 0, 0]}
        >
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[wheelRadius, wheelRadius, 0.012, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
          </mesh>
          <mesh position={[-0.007, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[wheelRadius + 0.006, wheelRadius + 0.006, 0.0025, 24]} />
            <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0.007, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.003, 6]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* Axle Brass Drive Spur Gear (coupled to DC Motor pinion) */}
        <mesh position={[0.015, 0, 0]} rotation={[wheelRotationAngle, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.004, 20]} />
          <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.3} />
        </mesh>

        {/* Optical Rotary Encoder Slotted Code-Wheel (20-slot optical grating) */}
        <group position={[-0.035, 0, 0]} rotation={[wheelRotationAngle, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.0015, 20]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Optical slot cutouts indicator ring */}
          <mesh position={[-0.001, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <ringGeometry args={[0.012, 0.017, 20]} />
            <meshBasicMaterial color="#38bdf8" wireframe />
          </mesh>
        </group>

        {/* Photo-interrupter Encoder Sensor Bracket mounted to chassis */}
        <group position={[-0.035, 0.008, 0]}>
          <mesh>
            <boxGeometry args={[0.01, 0.016, 0.012]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
          {/* Red Optical IR emitter LED indicator */}
          <mesh position={[0, -0.004, 0]}>
            <sphereGeometry args={[0.0015, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 3. MAIN METAL CHASSIS PLATFORM & STRUCTURAL CROSSBEAMS                   */}
      {/* ========================================================================= */}
      <group position={[0, 0.012 + explodeOffset, 0]}>
        {/* Main Baseplate (CNC Anodized Blue/Dark Grey Aluminum Plate) */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.15, 0.004, 0.22]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Weight Reduction / Cable Passthrough Slots */}
        <mesh position={[-0.04, 0.001, 0]}>
          <boxGeometry args={[0.015, 0.005, 0.12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        <mesh position={[0.04, 0.001, 0]}>
          <boxGeometry args={[0.015, 0.005, 0.12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>

        {/* Chassis Side Flanges / Protective Bumpers */}
        <mesh position={[-0.076, 0.008, 0]} castShadow>
          <boxGeometry args={[0.003, 0.018, 0.22]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.076, 0.008, 0]} castShadow>
          <boxGeometry args={[0.003, 0.018, 0.22]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* 4 Pillow-Block Axle Bearing Blocks beneath chassis */}
        {[
          [-halfGauge + 0.015, -0.008, wheelBase / 2],
          [halfGauge - 0.015, -0.008, wheelBase / 2],
          [-halfGauge + 0.015, -0.008, -wheelBase / 2],
          [halfGauge - 0.015, -0.008, -wheelBase / 2],
        ].map((bp, bIndex) => (
          <group key={bIndex} position={bp}>
            <mesh castShadow>
              <boxGeometry args={[0.012, 0.014, 0.016]} />
              <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
            </mesh>
            {/* Securing Hex Bolt */}
            <mesh position={[0, -0.008, 0]}>
              <cylinderGeometry args={[0.0015, 0.0015, 0.004, 6]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* Standoff Studs for PCB Electronics Platform */}
        {[
          [-0.04, 0.005, 0.03],
          [0.04, 0.005, 0.03],
          [-0.04, 0.005, 0.09],
          [0.04, 0.005, 0.09],
        ].map((sp, sIdx) => (
          <mesh key={sIdx} position={sp}>
            <cylinderGeometry args={[0.002, 0.002, 0.008, 8]} />
            <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* ========================================================================= */}
      {/* 4. DC MOTOR & REDUCTION GEARBOX (PROPULSION SYSTEM)                      */}
      {/* ========================================================================= */}
      <group position={[0.02, 0.016 + explodeOffset, -0.055]}>
        {/* Cylindrical DC Motor Can (e.g. 12V 25mm Gearmotor) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.045, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Planetary / Spur Reduction Gearbox Housing */}
        <mesh position={[0, 0, -0.026]} castShadow>
          <boxGeometry args={[0.026, 0.026, 0.018]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* Brass Pinion Shaft */}
        <mesh position={[-0.005, -0.004, -0.036]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.008, 12]} />
          <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Motor Terminals & Power Leads */}
        <mesh position={[0.006, 0.008, 0.024]}>
          <boxGeometry args={[0.002, 0.004, 0.006]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <mesh position={[-0.006, 0.008, 0.024]}>
          <boxGeometry args={[0.002, 0.004, 0.006]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 5. RECHARGEABLE 18650 LI-ION BATTERY ENCLOSURE & POWER SWITCH           */}
      {/* ========================================================================= */}
      <group position={[-0.03, 0.02 + explodeOffset, -0.04]}>
        {/* Battery Cradle Case */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.045, 0.022, 0.075]} />
          <meshStandardMaterial color="#090d16" roughness={0.6} />
        </mesh>
        {/* Two 18650 Cylindrical Cells (Blue shrink-wrap) */}
        <mesh position={[-0.011, 0.004, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.009, 0.009, 0.065, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0.011, 0.004, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.009, 0.009, 0.065, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.3} roughness={0.4} />
        </mesh>
        {/* Toggle Power Rocker Switch */}
        <mesh position={[0, 0.014, 0.025]}>
          <boxGeometry args={[0.008, 0.005, 0.012]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 6. ESP32 MICROCONTROLLER DEVELOPMENT BOARD                               */}
      {/* ========================================================================= */}
      <group position={[0, 0.026 + explodeElectronics, 0.055]}>
        {/* ESP32 Matte Black PCB substrate */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.052, 0.0016, 0.028]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>

        {/* ESP-WROOM-32 Metal RF Shielding Can */}
        <mesh position={[-0.008, 0.002, 0]} castShadow>
          <boxGeometry args={[0.018, 0.003, 0.018]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Printed Inverted-F 2.4GHz WiFi/BLE Trace Antenna (Gold trace on PCB) */}
        <mesh position={[-0.02, 0.001, 0]}>
          <boxGeometry args={[0.006, 0.0005, 0.016]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Micro-USB Programming / Power Port */}
        <mesh position={[0.025, 0.002, 0]}>
          <boxGeometry args={[0.006, 0.003, 0.008]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Dual-in-line 30-Pin Header Pins (Left and Right) */}
        <mesh position={[0, 0.003, -0.012]}>
          <boxGeometry args={[0.046, 0.004, 0.0025]} />
          <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.003, 0.012]}>
          <boxGeometry args={[0.046, 0.004, 0.0025]} />
          <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* On-board Blue Telemetry Indicator LED */}
        <mesh position={[0.012, 0.002, 0.005]}>
          <boxGeometry args={[0.0018, 0.001, 0.0018]} />
          <meshBasicMaterial color={speedMs > 0 ? '#38bdf8' : '#1e3a8a'} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 7. MPU6050 6-DOF INERTIAL MEASUREMENT UNIT (IMU)                          */}
      {/* ========================================================================= */}
      {/* Mounted firmly near the center of gravity for true vibrational coupling */}
      <group position={[0, 0.026 + explodeElectronics, 0.012]}>
        {/* Classic Blue GY-521 Breakout Board */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.022, 0.0016, 0.016]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
        </mesh>

        {/* MPU-6050 QFN MEMS Accelerometer & Gyro IC Chip */}
        <mesh position={[0, 0.0015, 0]} castShadow>
          <boxGeometry args={[0.006, 0.0015, 0.006]} />
          <meshStandardMaterial color="#111827" roughness={0.3} />
        </mesh>

        {/* SMD Filter Capacitors & Power LED */}
        <mesh position={[-0.006, 0.0012, 0.004]}>
          <boxGeometry args={[0.002, 0.001, 0.002]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[-0.006, 0.0012, -0.003]}>
          <boxGeometry args={[0.002, 0.001, 0.002]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.7} />
        </mesh>

        {/* 8-Pin I2C Connection Header (VCC, GND, SCL, SDA, XDA, XCL, AD0, INT) */}
        <mesh position={[0.008, 0.003, 0]}>
          <boxGeometry args={[0.0025, 0.004, 0.014]} />
          <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 8. REALISTIC INTERCONNECTING JUMPER WIRING HARNESS                       */}
      {/* ========================================================================= */}
      {/* Flexible Dupont cables connecting MPU6050 (I2C) & Encoder to ESP32 */}
      <group position={[0, 0.024 + explodeElectronics, 0.028]}>
        {/* Ribbon of 4 wires (Red, Black, Yellow, Green) */}
        {[-0.004, -0.0015, 0.0015, 0.004].map((wX, wIdx) => {
          const colors = ['#dc2626', '#0f172a', '#eab308', '#16a34a'];
          return (
            <mesh key={wIdx} position={[wX, 0.002, 0]}>
              <boxGeometry args={[0.0012, 0.001, 0.024]} />
              <meshStandardMaterial color={colors[wIdx]} roughness={0.7} />
            </mesh>
          );
        })}
      </group>

      {/* ========================================================================= */}
      {/* 9. FLOATING 3D COMPONENT ENGINEERING CALLOUT LABELS                       */}
      {/* ========================================================================= */}
      {showLabels && (
        <group>
          {/* Label 1: ESP32 */}
          <Html position={[0.04, 0.06 + explodeElectronics, 0.055]} center distanceFactor={1.8}>
            <div className="bg-slate-900/90 border border-cyan-400 text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider shadow pointer-events-none whitespace-nowrap flex items-center gap-1 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              ESP32 MCU
            </div>
          </Html>

          {/* Label 2: MPU6050 */}
          <Html position={[-0.04, 0.05 + explodeElectronics, 0.012]} center distanceFactor={1.8}>
            <div className="bg-slate-900/90 border border-blue-400 text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider shadow pointer-events-none whitespace-nowrap flex items-center gap-1 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              MPU6050 IMU
            </div>
          </Html>

          {/* Label 3: Wheel Encoder */}
          <Html position={[-0.07, 0.04, -wheelBase / 2]} center distanceFactor={1.8}>
            <div className="bg-slate-900/90 border border-amber-400 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider shadow pointer-events-none whitespace-nowrap flex items-center gap-1 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Rotary Encoder
            </div>
          </Html>

          {/* Label 4: Battery */}
          <Html position={[-0.06, 0.05 + explodeOffset, -0.04]} center distanceFactor={1.8}>
            <div className="bg-slate-900/90 border border-emerald-400 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider shadow pointer-events-none whitespace-nowrap flex items-center gap-1 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Li-ion Battery
            </div>
          </Html>

          {/* Label 5: DC Motor */}
          <Html position={[0.06, 0.045 + explodeOffset, -0.055]} center distanceFactor={1.8}>
            <div className="bg-slate-900/90 border border-purple-400 text-purple-300 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider shadow pointer-events-none whitespace-nowrap flex items-center gap-1 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              DC Gearmotor
            </div>
          </Html>

          {/* Label 6: Steel Wheels */}
          <Html position={[halfGauge + 0.02, 0.035, wheelBase / 2]} center distanceFactor={1.8}>
            <div className="bg-slate-900/90 border border-slate-300 text-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider shadow pointer-events-none whitespace-nowrap flex items-center gap-1 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
              Flanged Steel Wheel
            </div>
          </Html>

          {/* Label 7: Metal Chassis */}
          <Html position={[0.08, 0.02 + explodeOffset, 0]} center distanceFactor={1.8}>
            <div className="bg-slate-900/90 border border-indigo-400 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider shadow pointer-events-none whitespace-nowrap flex items-center gap-1 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Aluminum Chassis
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
