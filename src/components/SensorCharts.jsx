import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Activity, Gauge, Compass } from 'lucide-react';

export function SensorCharts({ telemetryHistory = [] }) {
  // Format data for chart display
  const chartData = telemetryHistory.map((item, idx) => ({
    time: item.time,
    dist: `${item.distanceM.toFixed(2)}m`,
    ax: item.accelX,
    ay: item.accelY,
    az: item.accelZ,
    vib: item.vibrationMag,
    gx: item.gyroX,
    gy: item.gyroY,
    gz: item.gyroZ,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
      {/* Chart 1: 3-Axis Accelerometer (X, Y, Z) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col min-h-[170px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 mb-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>MPU6050 3-Axis Acceleration (m/s²)</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-blue-400"></span>X</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-pink-400"></span>Y</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-400"></span>Z</span>
          </div>
        </div>

        <div className="flex-1 w-full h-[130px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="dist" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
              <YAxis domain={[-8, 18]} tick={{ fontSize: 9, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  fontSize: '11px',
                  borderRadius: '6px',
                }}
              />
              <Line type="monotone" dataKey="ax" stroke="#38bdf8" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              <Line type="monotone" dataKey="ay" stroke="#f472b6" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              <Line type="monotone" dataKey="az" stroke="#34d399" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Dynamic Vibration Magnitude & Gyroscope-Z (Yaw) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col min-h-[170px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 mb-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>Vibration Magnitude & Flange Yaw Rate (rad/s)</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-amber-400"></span>Vib Mag</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-purple-400"></span>Gyro Z</span>
          </div>
        </div>

        <div className="flex-1 w-full h-[130px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="dist" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
              <YAxis domain={[0, 14]} tick={{ fontSize: 9, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  fontSize: '11px',
                  borderRadius: '6px',
                }}
              />
              <Line type="monotone" dataKey="vib" stroke="#fbbf24" dot={false} strokeWidth={2} isAnimationActive={false} />
              <Line type="monotone" dataKey="gz" stroke="#c084fc" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
