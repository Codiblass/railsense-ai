/**
 * Anomaly Detection and Diagnostic Classifier
 * Explainable multi-parameter rule engine modeling the edge computing firmware on the ESP32.
 */

export function analyzeAnomaly(telemetry, activeFault) {
  const { vibrationMag, accelX, accelY, accelZ, gyroZ, distanceM, status, anomalyScore } = telemetry;

  if (status === 'NORMAL') {
    return null;
  }

  // Fault classification logic
  let detectedType = 'Unknown Anomaly';
  let severityLevel = status === 'FAULT DETECTED' ? 'CRITICAL' : 'MODERATE';
  let recommendedAction = 'Continue automated monitoring.';
  let confidence = Math.min(98, Math.max(72, anomalyScore + 15));

  const absAy = Math.abs(accelY);
  const absGz = Math.abs(gyroZ);
  const dynAz = Math.abs(accelZ - 9.81);

  if (absAy > 2.8 || absGz > 1.0) {
    detectedType = 'Lateral Track Misalignment / Gauge Slew';
    recommendedAction = 'Dispatch track gang for realignment lining and gauge tie rod tightening.';
  } else if (dynAz > 7.0 && Math.abs(accelX) > 2.0) {
    detectedType = 'Uneven Rail Joint / Fishplate Lip Gap';
    recommendedAction = 'Inspect joint fishplate bolts, measure vertical step height, tamp joint sleepers.';
  } else if (dynAz > 4.0 && absAy < 2.0 && absGz < 0.6 && vibrationMag > 4.5) {
    detectedType = 'Surface Irregularity / Railhead Corrugation';
    recommendedAction = 'Schedule rail grinding / milling maintenance to restore longitudinal profile.';
  } else if (dynAz > 3.0 && absAy < 2.5) {
    detectedType = 'Loose Sleeper / Ballast Void (Pumping Sleeper)';
    recommendedAction = 'Perform stone blowing or localized ballast tamping under sleeper voids.';
  } else {
    detectedType = activeFault.shortName || 'Dynamic Track Anomaly';
    recommendedAction = 'Conduct detailed visual and ultrasonic non-destructive testing (NDT).';
  }

  return {
    id: `FLT-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toLocaleTimeString(),
    distanceM,
    detectedType,
    severityLevel,
    anomalyScore,
    vibrationMag,
    accelPeaks: {
      ax: accelX,
      ay: accelY,
      az: accelZ,
    },
    recommendedAction,
    confidence,
  };
}
