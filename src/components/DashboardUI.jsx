import React from 'react';
import {
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Cpu,
  Radio,
  FileText,
  Info,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { FAULT_MODULES, SPEED_PRESETS } from '../constants/trackSpecs';

export function DashboardUI({
  activeFault,
  setActiveFault,
  severity,
  setSeverity,
  speedKey,
  setSpeedKey,
  isInspecting,
  startInspection,
  stopInspection,
  resetInspection,
  telemetry,
  detectedFaults,
  inspectionHistory,
  autoInspect,
  setAutoInspect,
}) {
  const isNormal = telemetry.status === 'NORMAL';
  const isWarning = telemetry.status === 'WARNING';
  const isFault = telemetry.status === 'FAULT DETECTED';

  // Status badge styling
  const statusColorClass = isNormal
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    : isWarning
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
    : 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';

  return (
    <div className="flex flex-col h-full bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 text-slate-100 overflow-y-auto">
      {/* 1. TOP HEADER & SYSTEM STATUS */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-sm text-white">RailSense AI</span>
              <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/50 px-1.5 py-0.2 rounded font-mono">
                v2.4 IoT
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>ESP32 MCU: <strong className="text-emerald-400">ONLINE (115200 bps)</strong></span>
              <span>•</span>
              <span>MPU6050: <strong className="text-emerald-400">CALIBRATED</strong></span>
            </div>
          </div>
        </div>

        {/* Real-time Health Status Pill */}
        <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide border flex items-center gap-2 ${statusColorClass}`}>
          {isNormal && <CheckCircle2 className="w-3.5 h-3.5" />}
          {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          {isFault && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
          <span>{telemetry.status}</span>
        </div>
      </div>

      {/* 2. INSPECTION CONTROL PANEL */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Inspection Trolley Controls</span>
          <span className="text-cyan-400 font-semibold">{telemetry.distanceM.toFixed(2)}m / 2.00m</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-100 ${
              isFault ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${(telemetry.distanceM / 2.0) * 100}%` }}
          />
        </div>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          {!isInspecting ? (
            <button
              onClick={startInspection}
              disabled={telemetry.distanceM >= 2.0}
              className={`col-span-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-xs transition-all shadow ${
                telemetry.distanceM >= 2.0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              START
            </button>
          ) : (
            <button
              onClick={stopInspection}
              className="col-span-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              PAUSE
            </button>
          )}

          <button
            onClick={resetInspection}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET
          </button>

          {/* Auto Loop Toggle */}
          <button
            onClick={() => setAutoInspect(!autoInspect)}
            className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-mono text-xs border transition-all ${
              autoInspect
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Auto-Scan: {autoInspect ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center justify-between gap-1.5 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 px-1.5">Speed:</span>
          {Object.entries(SPEED_PRESETS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setSpeedKey(key)}
              className={`flex-1 py-1 text-[11px] font-mono rounded transition-colors ${
                speedKey === key
                  ? 'bg-blue-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 3. INTERCHANGEABLE FAULT MODULE SELECTOR (5 MODULES) */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan-400" />
            Select Track Condition (Module 3: 0.8m - 1.2m)
          </span>
          <span className="text-[10px] font-mono text-slate-500">Bolt-mounted</span>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {FAULT_MODULES.map((fault) => {
            const isSelected = activeFault.id === fault.id;
            return (
              <button
                key={fault.id}
                onClick={() => setActiveFault(fault)}
                className={`p-2 rounded-lg text-left transition-all border flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: fault.color }}
                    />
                    <span className="text-xs font-semibold text-slate-200">{fault.shortName}</span>
                    {fault.id === 'normal' ? (
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-1 rounded border border-emerald-800/50">
                        Baseline
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-mono bg-amber-950/80 px-1 rounded border border-amber-800/50">
                        Fault Test
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {fault.description}
                  </div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>

        {/* Fault Severity Slider */}
        {activeFault.id !== 'normal' && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
              Severity: <strong>{(severity * 100).toFixed(0)}%</strong>
            </span>
            <input
              type="range"
              min="0.3"
              max="2.0"
              step="0.1"
              value={severity}
              onChange={(e) => setSeverity(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 4. LIVE TELEMETRY CARDS */}
      <div className="p-3 border-b border-slate-800 grid grid-cols-2 gap-2 bg-slate-950/40">
        <div className="bg-slate-900 border border-slate-800/90 rounded-lg p-2">
          <div className="text-[10px] font-mono text-slate-400">VIBRATION MAG</div>
          <div className={`text-lg font-bold font-mono ${
            telemetry.vibrationMag > 5.0 ? 'text-red-400' : telemetry.vibrationMag > 2.5 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {telemetry.vibrationMag.toFixed(2)} <span className="text-xs font-normal text-slate-500">m/s²</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 rounded-lg p-2">
          <div className="text-[10px] font-mono text-slate-400">WHEEL ENCODER</div>
          <div className="text-lg font-bold font-mono text-cyan-300">
            {telemetry.pulses} <span className="text-xs font-normal text-slate-500">pulses</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 rounded-lg p-2">
          <div className="text-[10px] font-mono text-slate-400">ANOMALY SCORE</div>
          <div className={`text-lg font-bold font-mono ${
            telemetry.anomalyScore > 60 ? 'text-red-400' : telemetry.anomalyScore > 30 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {telemetry.anomalyScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 rounded-lg p-2">
          <div className="text-[10px] font-mono text-slate-400">TROLLEY SPEED</div>
          <div className="text-lg font-bold font-mono text-purple-300">
            {telemetry.speedMs.toFixed(2)} <span className="text-xs font-normal text-slate-500">m/s</span>
          </div>
        </div>
      </div>

      {/* 5. AI FAULT DETECTION & DIAGNOSTICS ALERT PANEL */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-cyan-400" />
            ESP32 Edge Classifier Output
          </span>
          {isFault && (
            <span className="text-[10px] font-mono bg-red-600/30 text-red-300 border border-red-500/50 px-1 rounded animate-pulse">
              ALERT TRIGGERED
            </span>
          )}
        </div>

        <div className={`p-2.5 rounded-lg border text-xs font-mono leading-relaxed ${
          isFault
            ? 'bg-red-950/40 border-red-500/50 text-red-200'
            : isWarning
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
            : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between font-bold mb-1">
            <span>{isFault ? '⚠️ FAULT DETECTED' : isWarning ? '⚡ WARNING' : '✓ TRACK NOMINAL'}</span>
            <span>Loc: {telemetry.distanceM.toFixed(3)}m</span>
          </div>
          <div className="text-[11px] text-slate-300 mb-1.5">{telemetry.diagnostics}</div>
          {isFault && (
            <div className="text-[10px] bg-red-900/40 p-1.5 rounded border border-red-800/60 text-red-100">
              <strong>Action:</strong> {detectedFaults?.recommendedAction || 'Schedule track inspection crew.'}
            </div>
          )}
        </div>
      </div>

      {/* 6. INSPECTION HISTORY LOG */}
      <div className="p-3 flex-1 flex flex-col min-h-[160px]">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-cyan-400" />
            Inspection Event History ({inspectionHistory.length})
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[220px]">
          {inspectionHistory.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-mono">
              No inspection runs recorded yet. Start trolley to log data.
            </div>
          ) : (
            inspectionHistory.map((run) => (
              <div
                key={run.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded p-2 text-[11px] font-mono flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-300">{run.id}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{run.time}</span>
                  </div>
                  <div className="text-slate-400 mt-0.5">
                    {run.faultType} @ <strong className="text-cyan-400">{run.distanceM.toFixed(2)}m</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      run.status === 'FAULT DETECTED'
                        ? 'bg-red-950 text-red-400 border border-red-800/60'
                        : run.status === 'WARNING'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                    }`}
                  >
                    {run.status}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Score: {run.anomalyScore}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
