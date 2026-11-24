import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Text, ContactShadows } from '@react-three/drei';
import { RailwayTrack } from './RailwayTrack';
import { InspectionTrolley } from './InspectionTrolley';
import { Camera, Eye, Layers, Maximize2 } from 'lucide-react';

/**
 * Interactive 3D Simulation Canvas
 * Camera presets:
 * - Isometric / Overview
 * - Trolley Follow (chase cam)
 * - Side Elevation View
 * - Top-Down (Orthographic feel)
 */

export function SceneCanvas({
  positionM,
  speedMs,
  activeFault,
  severity,
  showLabels,
  setShowLabels,
  explodedView,
  setExplodedView,
  cameraView,
  setCameraView,
}) {
  const controlsRef = useRef();

  // Adjust camera based on selected cameraView
  useEffect(() => {
    if (!controlsRef.current) return;

    if (cameraView === 'isometric') {
      controlsRef.current.target.set(0, 0.05, 0);
      controlsRef.current.object.position.set(0.65, 0.45, 0.85);
    } else if (cameraView === 'side') {
      controlsRef.current.target.set(0, 0.04, -1.0 + positionM);
      controlsRef.current.object.position.set(0.65, 0.08, -1.0 + positionM);
    } else if (cameraView === 'top') {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(0.001, 1.2, 0);
    } else if (cameraView === 'chase') {
      const z = -1.0 + positionM;
      controlsRef.current.target.set(0, 0.05, z + 0.1);
      controlsRef.current.object.position.set(0, 0.18, z - 0.28);
    }
    controlsRef.current.update();
  }, [cameraView, positionM]);

  return (
    <div className="relative w-full h-full bg-slate-950 select-none overflow-hidden">
      {/* 3D Canvas */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0.7, 0.5, 0.9]} fov={40} />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={0.15}
          maxDistance={3.0}
          maxPolarAngle={Math.PI / 2 + 0.02} // Prevent camera going underneath the lab table
        />

        {/* Realistic Studio & Testing Lab Lighting */}
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[1.5, 3.0, 1.5]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <pointLight position={[-1.2, 0.8, -0.5]} intensity={0.8} color="#38bdf8" />
        <pointLight position={[1.2, 0.8, 0.5]} intensity={0.6} color="#fbbf24" />

        {/* 3D Testing Bed Grid */}
        <Grid
          position={[0, -0.085, 0]}
          args={[4, 4]}
          cellSize={0.1}
          cellThickness={0.6}
          cellColor="#334155"
          sectionSize={0.5}
          sectionThickness={1.2}
          sectionColor="#475569"
          fadeDistance={3}
        />

        {/* 2-Metre Miniature Track Model */}
        <RailwayTrack activeFault={activeFault} severity={severity} highlightedModule={2} />

        {/* 4-Wheel Inspection Trolley with Electronics */}
        <InspectionTrolley
          positionM={positionM}
          speedMs={speedMs}
          activeFault={activeFault}
          severity={severity}
          showLabels={showLabels}
          explodedView={explodedView}
        />

        {/* Soft Drop Shadows on lab floor */}
        <ContactShadows
          position={[0, -0.084, 0]}
          opacity={0.7}
          scale={2.5}
          blur={1.5}
          far={0.5}
        />
      </Canvas>

      {/* Floating 3D Viewport HUD Overlay Bar */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300 mr-1">Views:</span>
          {[
            { id: 'isometric', label: 'Iso' },
            { id: 'chase', label: 'Trolley Cam' },
            { id: 'side', label: 'Side' },
            { id: 'top', label: 'Top' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setCameraView(v.id)}
              className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                cameraView === v.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Engineering Display Toggles */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-2 py-1 rounded-lg flex items-center gap-2 shadow-lg">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 transition-colors ${
              showLabels
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle component callout labels"
          >
            <Eye className="w-3 h-3" />
            Labels
          </button>

          <button
            onClick={() => setExplodedView(!explodedView)}
            className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 transition-colors ${
              explodedView
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle mechanical exploded component assembly view"
          >
            <Layers className="w-3 h-3" />
            Exploded
          </button>
        </div>
      </div>

      {/* Track Scale Badge in bottom left of 3D Canvas */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-lg text-[11px] font-mono text-slate-300 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Scale: <strong>2.00 Metres</strong></span>
        </div>
        <span className="text-slate-600">|</span>
        <div>Gauge: <strong>180 mm</strong></div>
        <span className="text-slate-600">|</span>
        <div>5 Modules (0.4m each)</div>
      </div>

      {/* Interactive Navigation Hint */}
      <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-mono pointer-events-none bg-slate-950/60 px-2 py-1 rounded">
        Left Click + Drag: Rotate | Right Click: Pan | Scroll: Zoom
      </div>
    </div>
  );
}
