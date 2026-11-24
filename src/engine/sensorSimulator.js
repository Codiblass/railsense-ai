import { TRACK_SPECS, ANOMALY_THRESHOLDS } from '../constants/trackSpecs';

/**
 * Deterministic physics & IoT sensor simulation model.
 * Computes instantaneous 6-DOF inertial measurements and wheel encoder telemetry
 * conditioned on trolley track position (x in meters), velocity, and active fault.
 */

// Gaussian-ish random noise helper
function randomGaussian(mean = 0, stdev = 1) {
  let u = 1 - Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdev;
}

export function computeSensorTelemetry(positionM, speedMs, isMoving, activeFault, severity = 1.0) {
  // If stationary
  if (!isMoving || speedMs <= 0) {
    const idleNoise = 0.05;
    return {
      accelX: randomGaussian(0, idleNoise),
      accelY: randomGaussian(0, idleNoise),
      accelZ: 9.81 + randomGaussian(0, idleNoise), // 1G static gravity
      gyroX: randomGaussian(0, 0.01),
      gyroY: randomGaussian(0, 0.01),
      gyroZ: randomGaussian(0, 0.01),
      vibrationMag: 0.08,
      speedMs: 0,
      pulses: Math.floor((positionM / (Math.PI * TRACK_SPECS.WHEEL_DIAMETER_M)) * TRACK_SPECS.ENCODER_PPR),
      distanceM: positionM,
      anomalyScore: 0,
      status: 'NORMAL',
      diagnostics: 'Stationary - Baseline gravitational reference calibrated.',
    };
  }

  // Baseline moving vibrations (mechanical rail contact + motor gear whine)
  const baseNoise = 0.35 * (speedMs / 0.25);
  let ax = randomGaussian(0, baseNoise * 0.4);
  let ay = randomGaussian(0, baseNoise * 0.5); // Lateral sway
  let az = 9.81 + randomGaussian(0, baseNoise * 0.8); // Vertical bounce
  let gx = randomGaussian(0, 0.05); // Roll (rad/s)
  let gy = randomGaussian(0, 0.05); // Pitch (rad/s)
  let gz = randomGaussian(0, 0.06); // Yaw (rad/s)

  // Fault active region is Module 3: center module from 0.80m to 1.20m
  const faultStart = 0.80;
  const faultEnd = 1.20;
  const faultCenter = 1.00;

  const inFaultZone = positionM >= faultStart && positionM <= faultEnd;
  let faultSignatureActive = false;
  let anomalyReason = '';

  if (inFaultZone && activeFault && activeFault.id !== 'normal') {
    const sev = Math.max(0.1, severity);
    const speedFactor = speedMs / 0.25;

    switch (activeFault.id) {
      case 'joint': {
        // Uneven joint is located precisely at 0.98m - 1.02m (gap + step)
        const distFromJoint = Math.abs(positionM - 1.00);
        if (distFromJoint < 0.045) {
          // Sharp impulse impact
          const impactProfile = Math.cos((distFromJoint / 0.045) * (Math.PI / 2));
          const shockZ = 9.5 * sev * speedFactor * impactProfile;
          const shockX = 3.2 * sev * speedFactor * impactProfile;
          az += shockZ;
          ax -= shockX; // Deceleration jolt
          gy += 2.2 * sev * impactProfile; // Pitch jolt
          faultSignatureActive = true;
          anomalyReason = 'Vertical impact shock at rail joint gap';
        }
        break;
      }

      case 'loose_sleeper': {
        // Ballast void depression from 0.90m to 1.10m
        const distFromSleeper = Math.abs(positionM - 1.00);
        if (distFromSleeper < 0.10) {
          // Low-frequency dynamic heave/dip and rebound
          const dipProfile = Math.sin((positionM - 0.90) / 0.20 * Math.PI);
          const reboundAccel = 6.2 * sev * (speedFactor * speedFactor) * dipProfile;
          az += reboundAccel + randomGaussian(0, 1.8 * sev);
          gx += 1.4 * sev * Math.sin(positionM * 40); // Sleeper rocking
          faultSignatureActive = true;
          anomalyReason = 'Subgrade depression & dynamic sleeper rocking';
        }
        break;
      }

      case 'lateral': {
        // S-curve sideways rail slew between 0.85m and 1.15m
        if (positionM >= 0.85 && positionM <= 1.15) {
          const slewPhase = (positionM - 0.85) / 0.30;
          // Sinusoidal lateral displacement slope produces lateral acceleration
          const lateralPush = Math.sin(slewPhase * Math.PI * 2) * 5.8 * sev * speedFactor;
          ay += lateralPush + randomGaussian(0, 1.2 * sev);
          gz += Math.cos(slewPhase * Math.PI * 2) * 1.9 * sev * speedFactor; // High yaw angular rate
          gx += 0.8 * sev * Math.sin(slewPhase * Math.PI * 2); // Roll sway
          faultSignatureActive = true;
          anomalyReason = 'Severe lateral track slew & flange hunting';
        }
        break;
      }

      case 'corrugation': {
        // Continuous high-frequency periodic waviness along 0.80m to 1.20m
        const waveFreq = 40; // 40 cycles/meter -> 2.5cm pitch
        const wave = Math.sin(2 * Math.PI * waveFreq * positionM);
        const waveAccel = 7.4 * sev * speedFactor * wave;
        az += waveAccel;
        ax += 1.5 * sev * Math.cos(2 * Math.PI * waveFreq * positionM);
        gy += 1.6 * sev * wave;
        faultSignatureActive = true;
        anomalyReason = 'High-frequency periodic railhead corrugation ripple';
        break;
      }

      default:
        break;
    }
  }

  // Calculate dynamic vibration magnitude (subtracting 1G static gravity)
  const dynAz = az - 9.81;
  const vibrationMag = Math.sqrt(ax * ax + ay * ay + dynAz * dynAz);

  // Wheel encoder computation
  const wheelCircumference = Math.PI * TRACK_SPECS.WHEEL_DIAMETER_M;
  const wheelRevs = positionM / wheelCircumference;
  const pulses = Math.floor(wheelRevs * TRACK_SPECS.ENCODER_PPR);

  // Anomaly scoring & state machine (Explainable AI detection)
  let anomalyScore = 0;
  let status = 'NORMAL';

  // Compute normalized anomaly score [0 to 100]
  const vibScore = Math.min(60, (vibrationMag / ANOMALY_THRESHOLDS.VIBRATION_FAULT_MS2) * 60);
  const latScore = Math.min(25, (Math.abs(ay) / ANOMALY_THRESHOLDS.ACCEL_Y_LATERAL_MS2) * 25);
  const gyroScore = Math.min(15, (Math.abs(gz) / ANOMALY_THRESHOLDS.GYRO_Z_RAD_S) * 15);
  anomalyScore = Math.round(vibScore + latScore + gyroScore);

  if (anomalyScore >= 65 || vibrationMag >= ANOMALY_THRESHOLDS.VIBRATION_FAULT_MS2 || Math.abs(ay) >= ANOMALY_THRESHOLDS.ACCEL_Y_LATERAL_MS2) {
    status = 'FAULT DETECTED';
  } else if (anomalyScore >= 35 || vibrationMag >= ANOMALY_THRESHOLDS.VIBRATION_WARNING_MS2) {
    status = 'WARNING';
  }

  let diagnostics = 'Nominal vibration signature within ISO 10816 baseline thresholds.';
  if (status === 'FAULT DETECTED') {
    diagnostics = anomalyReason || 'Severe vibration exceedance threshold triggered!';
  } else if (status === 'WARNING') {
    diagnostics = 'Elevated vibration envelope detected near track transition.';
  }

  return {
    accelX: parseFloat(ax.toFixed(3)),
    accelY: parseFloat(ay.toFixed(3)),
    accelZ: parseFloat(az.toFixed(3)),
    gyroX: parseFloat(gx.toFixed(3)),
    gyroY: parseFloat(gy.toFixed(3)),
    gyroZ: parseFloat(gz.toFixed(3)),
    vibrationMag: parseFloat(vibrationMag.toFixed(3)),
    speedMs: parseFloat(speedMs.toFixed(2)),
    pulses,
    distanceM: parseFloat(positionM.toFixed(3)),
    anomalyScore: Math.min(100, Math.max(0, anomalyScore)),
    status,
    diagnostics,
    inFaultZone,
    faultSignatureActive,
  };
}
