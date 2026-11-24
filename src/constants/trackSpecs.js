export const TRACK_SPECS = {
  TOTAL_LENGTH_M: 2.0,      // 2.0 metres total track
  MODULE_COUNT: 5,          // 5 interchangeable modules
  MODULE_LENGTH_M: 0.4,     // 0.40m each
  GAUGE_M: 0.18,            // 180mm miniature gauge
  WHEEL_DIAMETER_M: 0.05,   // 50mm wheel diameter
  SLEEPER_SPACING_M: 0.05,  // 50mm sleeper pitch (approx 40 sleepers)
  ENCODER_PPR: 20,          // 20 pulses per revolution (e.g. slotted optical disk)
};

export const FAULT_MODULES = [
  {
    id: 'normal',
    name: 'Module 1: Normal Track (Baseline)',
    shortName: 'Normal Track',
    type: 'NORMAL',
    description: 'Perfect alignment, firmly supported sleepers, seamless joint tolerances. Expected vibration below 1.2 m/s².',
    color: '#10b981', // Emerald green
    moduleIndex: 2,   // Center module (0.8m to 1.2m)
    severityDefault: 0.0,
    specs: {
      stepHeightMm: 0,
      gapWidthMm: 1.0,
      lateralDisplacementMm: 0,
      corrugationAmpMm: 0,
      corrugationFreqHz: 0,
      looseSleeperDipMm: 0,
    }
  },
  {
    id: 'joint',
    name: 'Module 2: Uneven Rail Joint (Step & Gap)',
    shortName: 'Uneven Joint',
    type: 'FAULT_JOINT',
    description: 'Vertical height step (lip) and expanded joint gap between rail segments. Induces sharp impulsive impact shock.',
    color: '#ef4444', // Red
    moduleIndex: 2,
    severityDefault: 1.0,
    specs: {
      stepHeightMm: 3.5, // 3.5mm vertical step
      gapWidthMm: 6.0,   // 6mm joint expansion gap
      lateralDisplacementMm: 0,
      corrugationAmpMm: 0,
      looseSleeperDipMm: 0,
    }
  },
  {
    id: 'loose_sleeper',
    name: 'Module 3: Loose Sleeper (Ballast Void / Pumping)',
    shortName: 'Loose Sleeper',
    type: 'FAULT_LOOSE_SLEEPER',
    description: 'De-consolidated ballast void under sleeper #18-20 causing rail dip and dynamic bouncing under wheel load.',
    color: '#f59e0b', // Amber
    moduleIndex: 2,
    severityDefault: 1.0,
    specs: {
      looseSleeperDipMm: 5.0, // 5mm cyclic depression
      gapWidthMm: 1.5,
      stepHeightMm: 0,
      lateralDisplacementMm: 0,
      corrugationAmpMm: 0,
    }
  },
  {
    id: 'lateral',
    name: 'Module 4: Lateral Rail Misalignment (Track Slew)',
    shortName: 'Lateral Misalignment',
    type: 'FAULT_LATERAL',
    description: 'Sideways deviation of right rail causing wheel flange scrub, lateral hunting oscillation, and high Gyro-Z.',
    color: '#ec4899', // Pink
    moduleIndex: 2,
    severityDefault: 1.0,
    specs: {
      lateralDisplacementMm: 6.0, // 6mm sideways bend
      gapWidthMm: 1.0,
      stepHeightMm: 0,
      corrugationAmpMm: 0,
      looseSleeperDipMm: 0,
    }
  },
  {
    id: 'corrugation',
    name: 'Module 5: Surface Irregularity (Rail Corrugation)',
    shortName: 'Surface Corrugation',
    type: 'FAULT_SURFACE',
    description: 'Periodic railhead corrugation wave pattern causing persistent high-frequency chatter in vertical Z-acceleration.',
    color: '#8b5cf6', // Violet
    moduleIndex: 2,
    severityDefault: 1.0,
    specs: {
      corrugationAmpMm: 2.2, // 2.2mm wave amplitude
      corrugationFreqPerM: 40, // 40 waves per meter (wavelength = 2.5cm)
      gapWidthMm: 1.0,
      stepHeightMm: 0,
      lateralDisplacementMm: 0,
      looseSleeperDipMm: 0,
    }
  }
];

export const SPEED_PRESETS = {
  slow: { label: 'Slow (0.10 m/s)', speedMs: 0.10 },
  normal: { label: 'Normal (0.25 m/s)', speedMs: 0.25 },
  fast: { label: 'Fast (0.45 m/s)', speedMs: 0.45 },
};

export const ANOMALY_THRESHOLDS = {
  VIBRATION_WARNING_MS2: 2.5,
  VIBRATION_FAULT_MS2: 5.0,
  ACCEL_Z_PEAK_MS2: 6.5,
  ACCEL_Y_LATERAL_MS2: 3.2,
  GYRO_Z_RAD_S: 1.2,
};
