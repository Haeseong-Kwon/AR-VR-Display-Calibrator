import numpy as np
import json
from supabase import create_client, Client
import os
from datetime import datetime
from scipy.spatial import ConvexHull

# --- Supabase Configuration ---
# IMPORTANT: Replace these with your actual Supabase URL and Anon Key.
# It's recommended to load these from environment variables or a secure configuration system.
SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "YOUR_SUPABASE_URL")
SUPABASE_ANON_KEY: str = os.environ.get("SUPABASE_ANON_KEY", "YOUR_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# --- Helper Functions (reused from calibration_engine.py) ---
def rgb_to_xyz(rgb_linear):
    """
    Converts linear sRGB values (0-1) to CIE XYZ values.
    Assumes D65 illuminant.
    """
    M = np.array([
        [0.4124564, 0.3575761, 0.1804375],
        [0.2126729, 0.7151522, 0.0721750],
        [0.0193339, 0.1191920, 0.9503041]
    ])
    
    # Ensure rgb_linear is 2D if single RGB triplet is passed
    if rgb_linear.ndim == 1:
        rgb_linear = rgb_linear.reshape(1, -1)

    xyz = np.dot(rgb_linear, M.T)
    return xyz

def xyz_to_xy(xyz):
    """
    Converts CIE XYZ values to CIE 1931 xy chromaticity coordinates.
    """
    X, Y, Z = xyz[..., 0], xyz[..., 1], xyz[..., 2]
    sum_xyz = X + Y + Z
    
    # Avoid division by zero
    x = np.divide(X, sum_xyz, out=np.zeros_like(X), where=sum_xyz!=0)
    y = np.divide(Y, sum_xyz, out=np.zeros_like(Y), where=sum_xyz!=0)
    
    return np.stack([x, y], axis=-1)

# Standard Gamut Primaries (CIE 1931 xy coordinates for D65 white point)
# R, G, B primaries for sRGB, AdobeRGB, DCI-P3
# Source: Wikipedia, various standards documents
STANDARD_GAMUTS = {
    "sRGB": {
        "R": (0.6400, 0.3300),
        "G": (0.3000, 0.6000),
        "B": (0.1500, 0.0600),
        "W": (0.3127, 0.3290) # D65 White Point
    },
    "AdobeRGB": {
        "R": (0.6400, 0.3300),
        "G": (0.2100, 0.7100),
        "B": (0.1500, 0.0300),
        "W": (0.3127, 0.3290) # D65 White Point
    },
    "DCI-P3": { # DCI-P3 D65 white point variant
        "R": (0.6800, 0.3200),
        "G": (0.2650, 0.6900),
        "B": (0.1500, 0.0600),
        "W": (0.3127, 0.3290) # D65 White Point
    }
}

# --- 1. CIE 1931 Chromaticity Calculator ---
def calculate_gamut_coverage(display_primaries_rgb: np.ndarray):
    """
    Calculates CIE 1931 xy coordinates for display primaries and
    determines color gamut coverage against standard gamuts.

    Args:
        display_primaries_rgb (np.ndarray): A 3x3 array of display's
                                            R, G, B primary RGB values (0-1).
                                            Rows: R, G, B. Columns: R, G, B components.
                                            Example: [[1,0,0], [0,1,0], [0,0,1]] for ideal primaries.

    Returns:
        dict: A dictionary containing:
            - 'display_primaries_xy': xy coordinates of the display's R, G, B primaries.
            - 'coverage': A dict with coverage percentage for sRGB, AdobeRGB, DCI-P3.
    """
    # Convert display primaries from RGB (linear) to XYZ to xy
    display_primaries_xyz = rgb_to_xyz(display_primaries_rgb)
    display_primaries_xy = xyz_to_xy(display_primaries_xyz)

    results = {
        "display_primaries_xy": display_primaries_xy.tolist(),
        "coverage": {}
    }

    # Calculate area of display gamut (triangle formed by primaries)
    # The points for ConvexHull need to be 2D array: [[x1,y1], [x2,y2], ...]
    display_gamut_points = np.array(display_primaries_xy)
    if display_gamut_points.shape[0] < 3:
        # Cannot form a convex hull if less than 3 points
        display_gamut_area = 0.0
    else:
        try:
            display_gamut_area = ConvexHull(display_gamut_points).area
        except Exception:
            display_gamut_area = 0.0 # Handle cases where points are collinear or invalid

    for gamut_name, gamut_data in STANDARD_GAMUTS.items():
        standard_primaries_xy = np.array([gamut_data["R"], gamut_data["G"], gamut_data["B"]])
        
        # Calculate area of standard gamut
        if standard_primaries_xy.shape[0] < 3:
            standard_gamut_area = 0.0
        else:
            try:
                standard_gamut_area = ConvexHull(standard_primaries_xy).area
            except Exception:
                standard_gamut_area = 0.0

        if standard_gamut_area > 0:
            coverage = (display_gamut_area / standard_gamut_area) * 100
        else:
            coverage = 0.0
        
        results["coverage"][gamut_name] = round(coverage, 2)
    
    return results

# --- 2. Trend Analysis Engine ---
def analyze_color_drift(device_id: str, historical_data: list,
                        gamma_threshold: float = 0.1, delta_e_threshold: float = 3.0,
                        gamut_coverage_threshold: float = 5.0):
    """
    Analyzes color drift over time for a specific device and recommends
    the next calibration cycle.

    Args:
        device_id (str): Identifier for the device (e.g., serial number).
        historical_data (list): List of dictionaries, each representing a
                                calibration session for the device,
                                containing 'timestamp', 'gamma_value',
                                'color_correction_matrix', 'awb_gains',
                                'gamut_coverage' (e.g., sRGB coverage from prev step).
        gamma_threshold (float): Max allowed deviation in gamma value.
        delta_e_threshold (float): Max allowed average Delta E drift from ideal.
        gamut_coverage_threshold (float): Max allowed percentage change in gamut coverage.

    Returns:
        dict: Analysis results including drift warnings and calibration recommendation.
    """
    if not historical_data:
        return {"status": "No historical data for trend analysis.", "recommendation": "Calibrate immediately."}

    # Sort data by timestamp
    historical_data.sort(key=lambda x: datetime.fromisoformat(json.loads(x['timestamp'])))

    timestamps = [datetime.fromisoformat(json.loads(d['timestamp'])) for d in historical_data]
    gamma_values = [d['gamma_value'] for d in historical_data]
    
    # Assuming 'gamut_coverage' is a direct field for simplicity or derived from 'color_correction_matrix'
    # For this prototype, we'll assume it's calculated from the 'color_correction_matrix' or a stored field.
    # In a real scenario, you'd parse 'color_correction_matrix' and re-calculate gamut coverage for consistency.
    
    # For now, let's derive some Delta E stats from color_correction_matrix if available
    # This requires target_rgb for comparison, which isn't directly stored.
    # So, we'll focus on simpler metrics like gamma drift and relative changes in AWB gains.

    # Simplified drift analysis: Compare against the first calibration
    initial_session = historical_data[0]
    latest_session = historical_data[-1]

    initial_gamma = initial_session['gamma_value']
    latest_gamma = latest_session['gamma_value']
    gamma_drift = abs(latest_gamma - initial_gamma)

    recommendation = "Calibration cycle is good."
    warnings = []

    if gamma_drift > gamma_threshold:
        warnings.append(f"Significant gamma drift detected: {gamma_drift:.2f} (from {initial_gamma:.2f} to {latest_gamma:.2f}).")
        recommendation = "Recommend calibration soon."

    # More complex drift analysis would involve fitting a model or statistical tests
    # on gamma, AWB gains, and potentially average Delta E if target data were stored.

    # Example: Check AWB gain drift (simplified)
    if 'awb_gains' in initial_session and 'awb_gains' in latest_session:
        initial_awb_gains = np.array(json.loads(initial_session['awb_gains']))
        latest_awb_gains = np.array(json.loads(latest_session['awb_gains']))
        awb_gain_diff = np.linalg.norm(latest_awb_gains - initial_awb_gains) # Euclidean distance
        if awb_gain_diff > 0.1: # Arbitrary threshold
            warnings.append(f"Significant AWB gain drift detected: {awb_gain_diff:.2f}.")
            if "Recommend calibration soon." not in recommendation:
                 recommendation = "Recommend calibration soon."

    # If no warnings, suggest a standard interval
    if not warnings:
        time_since_last_cal = (timestamps[-1] - timestamps[-2]).days if len(timestamps) > 1 else 0
        if time_since_last_cal > 90: # Calibrate every 3 months if stable
             recommendation = "Consider routine calibration."
        elif time_since_last_cal == 0: # First calibration
             recommendation = "Initial calibration completed. Monitor for drift."


    return {
        "device_id": device_id,
        "gamma_drift": round(gamma_drift, 2),
        "warnings": warnings,
        "recommendation": recommendation,
        "last_calibration_date": latest_session['timestamp']
    }

# --- 3. Report Metadata Generator ---
def generate_json_report(device_id: str, latest_session_data: dict,
                         gamut_coverage_results: dict, trend_analysis_results: dict):
    """
    Generates a JSON report summarizing key statistics for a PDF report.

    Args:
        device_id (str): Identifier for the device.
        latest_session_data (dict): Dictionary of the most recent calibration session.
        gamut_coverage_results (dict): Results from calculate_gamut_coverage.
        trend_analysis_results (dict): Results from analyze_color_drift.

    Returns:
        dict: A dictionary containing summarized report metadata.
    """
    report = {
        "report_generated_at": datetime.now().isoformat(),
        "device_id": device_id,
        "session_name": latest_session_data.get('session_name'),
        "last_calibration_timestamp": json.loads(latest_session_data.get('timestamp', 'null')),
        "gamma_statistics": {
            "latest_gamma": latest_session_data.get('gamma_value')
        },
        "display_chromaticity": gamut_coverage_results.get('display_primaries_xy'),
        "gamut_coverage": gamut_coverage_results.get('coverage'),
        "awb_gains": json.loads(latest_session_data.get('awb_gains', '[]')),
        "distortion_matrix": json.loads(latest_session_data.get('camera_matrix', '[]')),
        "trend_analysis": trend_analysis_results
    }
    
    # Add some dummy max/avg error. In a real scenario, this would come from
    # a dedicated Delta E measurement during the calibration process and stored.
    # For now, we'll just put placeholders or derive them if possible.
    report["error_statistics"] = {
        "max_delta_e": "N/A (requires stored target data)",
        "avg_delta_e": "N/A (requires stored target data)"
    }
    # Example for luminance linearity: from gamma_value
    report["luminance_linearity"] = {
        "deviation_from_2_2": round(abs(latest_session_data.get('gamma_value', 0) - 2.2), 3)
    }

    return report

# --- Main Execution ---
if __name__ == "__main__":
    # --- Fetch Data from Supabase ---
    mock_device_id = "DISPLAY_SN_ABC123"

    all_calibration_sessions = []
    try:
        if SUPABASE_URL == "YOUR_SUPABASE_URL" or SUPABASE_ANON_KEY == "YOUR_SUPABASE_ANON_KEY":
            # In production, this would likely be an error or a fallback to local data
            pass
        else:
            response = supabase.table("calibration_sessions").select("*").order("timestamp", desc=False).execute()
            all_calibration_sessions = response.data
    except Exception as e:
        print(f"Error fetching data from Supabase: {e}") # Keep essential error logging

    if not all_calibration_sessions:
        # In a production setup, this might trigger an alert or return an empty report
        pass # No data found to generate reports, exit silently or log

    # --- Process Latest Session Data ---
    latest_session = all_calibration_sessions[-1]
    
    # Let's assume ideal linear sRGB primaries for the display for calculating gamut:
    display_primaries_for_gamut = np.array([
        [1.0, 0.0, 0.0], # Red
        [0.0, 1.0, 0.0], # Green
        [0.0, 0.0, 1.0]  # Blue
    ])

    # 1. CIE 1931 Chromaticity Calculator
    gamut_results = calculate_gamut_coverage(display_primaries_for_gamut)

    # 2. Trend Analysis Engine
    trend_results = analyze_color_drift(mock_device_id, all_calibration_sessions)

    # 3. Report Metadata Generator
    final_report = generate_json_report(mock_device_id, latest_session, gamut_results, trend_results)
    
    report_filename = "calibration_report.json"
    with open(report_filename, "w") as f:
        json.dump(final_report, f, indent=4)
    # print(f"Generated JSON report: {report_filename}") # Keep this print if user wants confirmation of file creation
