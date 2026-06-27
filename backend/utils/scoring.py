def calculate_score(ph, tds, temperature):
    score = 100

    # -------------------------
    # pH (Ideal: 7.2 - 7.8)
    # -------------------------
    if 7.2 <= ph <= 7.8:
        pass
    elif 7.0 <= ph < 7.2 or 7.8 < ph <= 8.0:
        score -= 10
    elif 6.5 <= ph < 7.0 or 8.0 < ph <= 8.5:
        score -= 25
    else:
        score -= 40

    # -------------------------
    # TDS (ppm)
    # -------------------------
    if tds <= 500:
        pass
    elif tds <= 1000:
        score -= 10
    elif tds <= 1500:
        score -= 25
    else:
        score -= 40

    # -------------------------
    # Temperature (°C)
    # -------------------------
    if 26 <= temperature <= 30:
        pass
    elif 24 <= temperature < 26 or 30 < temperature <= 32:
        score -= 5
    else:
        score -= 15

    if score < 0:
        score = 0

    return score

def water_quality(score):

    if score >= 90:
        return "Excellent"

    elif score >= 75:
        return "Good"

    elif score >= 60:
        return "Average"

    elif score >= 40:
        return "Poor"

    else:
        return "Unsafe"