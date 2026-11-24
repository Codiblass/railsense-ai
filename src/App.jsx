import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SceneCanvas } from './components/SceneCanvas';
import { DashboardUI } from './components/DashboardUI';
import { SensorCharts } from './components/SensorCharts';
import { FAULT_MODULES, SPEED_PRESETS, TRACK_SPECS } from './constants/trackSpecs';
import { computeSensorTelemetry } from './engine/sensorSimulator';
import { analyzeAnomaly } from './engine/anomalyClassifier';
import { Cpu, HelpCircle, Activity, Layers, Radio } from 'lucide-react';

export default function App() {
  // Simulation State
  const [activeFault, setActiveFault] = useState(FAULT_MODULES[1]); // Default to Uneven Joint
  const [severity, setSeverity] = useState(1.0);
  const [speedKey, setSpeedKey] = useState('normal');
  const [isInspecting, setIsInspecting] = useState(false);
  const [autoInspect, setAutoInspect] = useState(false);
  const [positionM, setPositionM] = useState(0.0);
  
  // 3D View Controls
  const [showLabels, setShowLabels] = useState(true);
  const [explodedView, setExplodedView] = useState(false);
  const [cameraView, setCameraView] = useState('isometric');

  // Diagnostics & History State
  const [detectedFaults, setDetectedFaults] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [inspectionHistory, setInspectionHistory] = useState([
    {
      id: 'RUN-101',
      time: '14:15:20',
      trackCondition: 'Baseline Track',
      faultType: 'Normal Track (Baseline)',
      distanceM: 2.00,
      status: 'NORMAL',
      anomalyScore: 8,
    }
  ]);
  const [showTechModal, setShowTechModal] = useState(false);

  // Active current speed in m/s
  const currentSpeedMs = SPEED_PRESETS[speedKey].speedMs;

  // Real-time telemetry object computed continuously
  const [telemetry, setTelemetry] = useState(() =>
    computeSensorTelemetry(0, 0, false, activeFault, severity)
  );

  // Physics & Animation Loop (Delta timing at ~60fps)
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef(null);

  // Simulation tick
  const tickSimulation = useCallback(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000); // delta in seconds
    lastTimeRef.current = now;

    if (isInspecting) {
      setPositionM((prevPos) => {
        const nextPos = prevPos + currentSpeedMs * dt;
        if (nextPos >= TRACK_SPECS.TOTAL_LENGTH_M) {
          // Reached end of 2-metre track
          setIsInspecting(false);

          // Record run into inspection history
          const finalTelemetry = computeSensorTelemetry(
            TRACK_SPECS.TOTAL_LENGTH_M,
            currentSpeedMs,
            false,
            activeFault,
            severity
          );
          const anomalyInfo = analyzeAnomaly(finalTelemetry, activeFault);

          setInspectionHistory((prev) => [
            {
              id: `RUN-${Date.now().toString().slice(-3)}`,
              time: new Date().toLocaleTimeString(),
              trackCondition: activeFault.name,
              faultType: activeFault.shortName,
              distanceM: TRACK_SPECS.TOTAL_LENGTH_M,
              status: activeFault.id === 'normal' ? 'NORMAL' : 'FAULT DETECTED',
              anomalyScore: activeFault.id === 'normal' ? 12 : Math.min(95, Math.round(75 * severity)),
            },
            ...prev.slice(0, 9), // Keep latest 10 runs
          ]);

          // If auto-inspect is active, reset and loop after 1.5s
          if (autoInspect) {
            setTimeout(() => {
              setPositionM(0);
              setIsInspecting(true);
            }, 1200);
          }

          return TRACK_SPECS.TOTAL_LENGTH_M;
        }
        return nextPos;
      });
    }

    animationFrameRef.current = requestAnimationFrame(tickSimulation);
  }, [isInspecting, currentSpeedMs, activeFault, severity, autoInspect]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(tickSimulation);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [tickSimulation]);

  // Compute telemetry whenever position or state changes
  useEffect(() => {
    const tel = computeSensorTelemetry(
      positionM,
      isInspecting ? currentSpeedMs : 0,
      isInspecting,
      activeFault,
      severity
    );
    setTelemetry(tel);

    // AI Anomaly analysis
    if (tel.status !== 'NORMAL') {
      const anomalyResult = analyzeAnomaly(tel, activeFault);
      setDetectedFaults(anomalyResult);
    }

    // Telemetry buffer for charting (sample every ~30-50ms)
    setTelemetryHistory((prev) => {
      const newPoint = {
        time: new Date().toLocaleTimeString().split(' ')[0],
        distanceM: tel.distanceM,
        accelX: tel.accelX,
        accelY: tel.accelY,
        accelZ: tel.accelZ,
        vibrationMag: tel.vibrationMag,
        gyroX: tel.gyroX,
        gyroY: tel.gyroY,
        gyroZ: tel.gyroZ,
      };
      const updated = [...prev, newPoint];
      if (updated.length > 35) {
        return updated.slice(updated.length - 35);
      }
      return updated;
    });
  }, [positionM, isInspecting, currentSpeedMs, activeFault, severity]);

  // Controls Handlers
  const handleStart = () => {
    if (positionM >= TRACK_SPECS.TOTAL_LENGTH_M) {
      setPositionM(0);
    }
    setIsInspecting(true);
  };

  const handleStop = () => {
    setIsInspecting(false);
  };

  const handleReset = () => {
    setIsInspecting(false);
    setPositionM(0);
    setTelemetryHistory([]);
    setDetectedFaults(null);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Global Navigation Bar */}
      <header className="h-12 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-900/40">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">RailSense AI</span>
              <span className="text-[10px] bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">
                Interactive 3D Simulation
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono -mt-0.5">
              IoT Railway Track Condition Monitoring & Anomaly Detection Prototype
            </div>
          </div>
        </div>

        {/* Global Action Badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTechModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tech Specs</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Layout (Split Screen: 3D Scene + Charts on Left/Top, Industrial Dashboard on Right) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: 3D Miniature Environment & Live Sensor Graphs */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* 3D Simulation Viewport (Takes 65% of left pane) */}
          <div className="h-[60%] lg:h-[65%] w-full relative">
            <SceneCanvas
              positionM={positionM}
              speedMs={isInspecting ? currentSpeedMs : 0}
              activeFault={activeFault}
              severity={severity}
              showLabels={showLabels}
              setShowLabels={setShowLabels}
              explodedView={explodedView}
              setExplodedView={setExplodedView}
              cameraView={cameraView}
              setCameraView={setCameraView}
            />
          </div>

          {/* Bottom Telemetry Graphs (Takes 35% of left pane) */}
          <div className="h-[40%] lg:h-[35%] w-full bg-slate-950 p-2.5 overflow-hidden flex flex-col border-t border-slate-800">
            <div className="flex items-center justify-between pb-1 mb-1">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>ESP32 High-Speed Telemetry Stream (50 Hz I2C DMA)</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Window: 35 samples | Filter: Dynamic Butterworth
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <SensorCharts telemetryHistory={telemetryHistory} />
            </div>
          </div>
        </div>

        {/* Right Column: Industrial IoT Control Dashboard (400px wide on desktop) */}
        <div className="w-full lg:w-[420px] xl:w-[460px] h-[45%] lg:h-full flex-shrink-0">
          <DashboardUI
            activeFault={activeFault}
            setActiveFault={setActiveFault}
            severity={severity}
            setSeverity={setSeverity}
            speedKey={speedKey}
            setSpeedKey={setSpeedKey}
            isInspecting={isInspecting}
            startInspection={handleStart}
            stopInspection={handleStop}
            resetInspection={handleReset}
            telemetry={telemetry}
            detectedFaults={detectedFaults}
            inspectionHistory={inspectionHistory}
            autoInspect={autoInspect}
            setAutoInspect={setAutoInspect}
          />
        </div>
      </div>

      {/* Technical Documentation / College Project Specifications Modal */}
      {showTechModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-5 shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">RailSense AI – Engineering Specifications</h3>
              </div>
              <button
                onClick={() => setShowTechModal(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono text-slate-300 leading-relaxed">
              <div>
                <h4 className="text-cyan-400 font-bold mb-1">1. SYSTEM ARCHITECTURE</h4>
                <p>
                  RailSense AI is an autonomous, IoT-enabled railway track inspection trolley designed for miniature and real-gauge track inspection. It combines low-latency edge processing on an ESP32 microcontroller with a 6-DOF MPU6050 accelerometer/gyroscope and optical wheel encoder to detect track anomalies in real-time.
                </p>
              </div>

              <div>
                <h4 className="text-cyan-400 font-bold mb-1">2. INTERCHANGEABLE FAULT MODULES</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong className="text-emerald-400">Normal Track:</strong> Baseline vibration signature (&lt;1.2 m/s²), straight rail alignment.</li>
                  <li><strong className="text-red-400">Uneven Joint:</strong> 3.5mm vertical step lip and 6mm joint gap generating high vertical impact impulses ($a_z &gt; 9.0$ m/s²).</li>
                  <li><strong className="text-amber-400">Loose Sleeper:</strong> 5mm ballast void depression inducing dynamic sagging and rolling under load.</li>
                  <li><strong className="text-pink-400">Lateral Misalignment:</strong> Sideways track slew resulting in high lateral acceleration ($a_y$) and yaw rate ($\omega_z$).</li>
                  <li><strong className="text-purple-400">Surface Corrugation:</strong> Periodic high-frequency railhead waves causing longitudinal chatter.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-cyan-400 font-bold mb-1">3. EXPLAINABLE AI EDGE ANOMALY DETECTION</h4>
                <p>
                  Rather than black-box models, the ESP32 edge classifier implements an explainable rule-weighted anomaly scoring algorithm that evaluates ISO 10816 mechanical vibration boundaries, dynamic vertical excursions, lateral hunting rates, and distance traveled.
                </p>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setShowTechModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-sans font-semibold text-xs"
                >
                  Close Specifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
