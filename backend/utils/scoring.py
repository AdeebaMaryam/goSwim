def calculate_score(ph, chlorine_ppm, turbidity_ntu, temperature_c):
    score = 0

    # pH score (ideal: 7.2 - 7.6) — 35 points
    if 7.2 <= ph <= 7.6:
        score += 35
    elif 7.0 <= ph < 7.2 or 7.6 < ph <= 7.8:
        score += 20
    elif 6.8 <= ph < 7.0 or 7.8 < ph <= 8.0:
        score += 10
    else:
        score += 0

    # Chlorine score (ideal: 1.0 - 3.0 ppm) — 35 points
    if 1.0 <= chlorine_ppm <= 3.0:
        score += 35
    elif 0.5 <= chlorine_ppm < 1.0 or 3.0 < chlorine_ppm <= 4.0:
        score += 20
    elif 0 <= chlorine_ppm < 0.5 or 4.0 < chlorine_ppm <= 5.0:
        score += 5
    else:
        score += 0

    # Turbidity score (ideal: < 0.5 NTU) — 20 points
    if turbidity_ntu < 0.5:
        score += 20
    elif turbidity_ntu < 1.0:
        score += 12
    elif turbidity_ntu < 2.0:
        score += 5
    else:
        score += 0

    # Temperature score (comfortable: 26-30°C) — 10 points
    if 26 <= temperature_c <= 30:
        score += 10
    elif 24 <= temperature_c < 26 or 30 < temperature_c <= 32:
        score += 6
    else:
        score += 2

    return round(score, 1)