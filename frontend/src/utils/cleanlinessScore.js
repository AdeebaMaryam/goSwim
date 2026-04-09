export const calculateScore = (ph, chlorine_ppm, turbidity_ntu, temperature_c) => {
  let score = 0;

  // pH score (ideal: 7.2 - 7.6) — 35 points
  if (ph >= 7.2 && ph <= 7.6) {
    score += 35;
  } else if ((ph >= 7.0 && ph < 7.2) || (ph > 7.6 && ph <= 7.8)) {
    score += 20;
  } else if ((ph >= 6.8 && ph < 7.0) || (ph > 7.8 && ph <= 8.0)) {
    score += 10;
  }

  // Chlorine score (ideal: 1.0 - 3.0 ppm) — 35 points
  if (chlorine_ppm >= 1.0 && chlorine_ppm <= 3.0) {
    score += 35;
  } else if ((chlorine_ppm >= 0.5 && chlorine_ppm < 1.0) || (chlorine_ppm > 3.0 && chlorine_ppm <= 4.0)) {
    score += 20;
  } else if ((chlorine_ppm >= 0 && chlorine_ppm < 0.5) || (chlorine_ppm > 4.0 && chlorine_ppm <= 5.0)) {
    score += 5;
  }

  // Turbidity score (ideal: < 0.5 NTU) — 20 points
  if (turbidity_ntu < 0.5) {
    score += 20;
  } else if (turbidity_ntu < 1.0) {
    score += 12;
  } else if (turbidity_ntu < 2.0) {
    score += 5;
  }

  // Temperature score (comfortable: 26-30°C) — 10 points
  if (temperature_c >= 26 && temperature_c <= 30) {
    score += 10;
  } else if ((temperature_c >= 24 && temperature_c < 26) || (temperature_c > 30 && temperature_c <= 32)) {
    score += 6;
  } else {
    score += 2;
  }

  return Math.round(score * 10) / 10;
};

export const getScoreLabel = (score) => {
  if (score >= 85) return { label: 'Safe to swim', color: 'green' };
  if (score >= 65) return { label: 'Acceptable', color: 'yellow' };
  if (score >= 40) return { label: 'Check parameters', color: 'orange' };
  return { label: 'Unsafe', color: 'red' };
};