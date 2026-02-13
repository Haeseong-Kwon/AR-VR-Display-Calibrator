import numpy as np
import cv2
from scipy.optimize import curve_fit
from supabase import create_client, Client
import json
import os

# --- Supabase Configuration ---
# IMPORTANT: Replace these with your actual Supabase URL and Anon Key.
# It's recommended to load these from environment variables or a secure configuration system.
SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "YOUR_SUPABASE_URL")
SUPABASE_ANON_KEY: str = os.environ.get("SUPABASE_ANON_KEY", "YOUR_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# --- 1. Color & Gamma Solver ---
def calculate_gamma_and_lut(luminance_data: np.ndarray) -> (float, np.ndarray):
    """
    Calculates the optimal gamma value and generates a Look-Up Table (LUT).

    Args:
        luminance_data: A NumPy array where the first column is input signal (0-1)
                        and the second column is measured luminance.
                        Example: [[0.0, 0.0], [0.1, 0.01], ..., [1.0, 1.0]]

    Returns:
        A tuple containing:
            - gamma_value (float): The calculated optimal gamma value.
            - lut (np.ndarray): A 1D NumPy array representing the LUT (0-255 range).
    """
    if luminance_data.shape[1] != 2:
        raise ValueError("luminance_data must have two columns: input signal and measured luminance.")

    input_signal = luminance_data[:, 0]
    measured_luminance = luminance_data[:, 1]

    # Define the gamma function: Vout = Vin^gamma
    def gamma_func(x, gamma):
        return x**gamma

    # Fit the curve to find the optimal gamma value
    try:
        popt, pcov = curve_fit(gamma_func, input_signal, measured_luminance, p0=[2.2])
        gamma_value = popt[0]
    except RuntimeError:
        print("Warning: Could not fit gamma curve. Using default gamma of 2.2.")
        gamma_value = 2.2

    # Generate LUT (e.g., for 8-bit output 0-255)
    # The LUT maps ideal input (0-1) to the corrected output (0-1) based on inverse gamma.
    # For display calibration, we want to apply the inverse gamma to the input signal
    # so that the output luminance matches the target linear response.
    # Target response: L = k * V_in_ideal
    # Measured response: L = k * V_out^gamma
    # We want V_out^gamma = V_in_ideal => V_out = V_in_ideal^(1/gamma)
    
    # Create input values from 0 to 1 (e.g., 256 steps for 8-bit)
    lut_input_values = np.linspace(0, 1, 256)
    lut = np.round(255 * (lut_input_values**(1/gamma_value))).astype(np.uint8)

    return gamma_value, lut

# --- 2. Distortion Mapping ---
def calibrate_camera(image_path: str, checkerboard_size: tuple, square_size: float) -> (np.ndarray, np.ndarray):
    """
    Calculates the camera matrix and distortion coefficients from a checkerboard image.

    Args:
        image_path (str): Path to the checkerboard image.
        checkerboard_size (tuple): Number of inner corners per a row and column (e.g., (7, 6)).
        square_size (float): The actual size of a checkerboard square in desired units (e.g., mm).

    Returns:
        A tuple containing:
            - camera_matrix (np.ndarray): The camera intrinsic matrix.
            - dist_coeffs (np.ndarray): The distortion coefficients.
    """
    # prepare object points, like (0,0,0), (1,0,0), (2,0,0) ....,(6,5,0)
    objp = np.zeros((checkerboard_size[0] * checkerboard_size[1], 3), np.float32)
    objp[:, :2] = np.mgrid[0:checkerboard_size[0], 0:checkerboard_size[1]].T.reshape(-1, 2) * square_size

    # Arrays to store object points and image points from all the images.
    objpoints = [] # 3d point in real world space
    imgpoints = [] # 2d points in image plane.

    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Image not found at {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Find the checkerboard corners
    ret, corners = cv2.findChessboardCorners(gray, checkerboard_size, None)

    # If found, add object points, image points (after refining them)
    if ret == True:
        objpoints.append(objp)
        
        # Refine corner locations
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)
        corners2 = cv2.cornerSubPix(gray, corners, (11,11), (-1,-1), criteria)
        imgpoints.append(corners2)

        # Draw and display the corners
        # cv2.drawChessboardCorners(img, checkerboard_size, corners2, ret)
        # cv2.imshow('img', img)
        # cv2.waitKey(500)
    else:
        raise ValueError(f"Could not find checkerboard corners in {image_path}")

    # Perform camera calibration
    ret, camera_matrix, dist_coeffs, rvecs, tvecs = cv2.calibrateCamera(
        objpoints, imgpoints, gray.shape[::-1], None, None
    )

    # cv2.destroyAllWindows()
    
    if not ret:
        raise RuntimeError("Camera calibration failed.")

    return camera_matrix, dist_coeffs

# --- 3. Database Integration ---
def upload_calibration_data(session_name: str, gamma_value: float, lut: np.ndarray,
                            camera_matrix: np.ndarray, dist_coeffs: np.ndarray):
    """
    Uploads calibration data to the Supabase 'calibration_sessions' table.

    Args:
        session_name (str): A unique name for this calibration session.
        gamma_value (float): The calculated gamma value.
        lut (np.ndarray): The generated Look-Up Table.
        camera_matrix (np.ndarray): The camera intrinsic matrix.
        dist_coeffs (np.ndarray): The distortion coefficients.
    """
    
    # Convert NumPy arrays to list for JSON serialization
    lut_list = lut.tolist()
    camera_matrix_list = camera_matrix.tolist()
    dist_coeffs_list = dist_coeffs.tolist()

    data = {
        "session_name": session_name,
        "gamma_value": float(gamma_value), # Ensure it's a standard float
        "lut": json.dumps(lut_list), # Store as JSON string
        "camera_matrix": json.dumps(camera_matrix_list), # Store as JSON string
        "dist_coeffs": json.dumps(dist_coeffs_list), # Store as JSON string
        "timestamp": json.dumps(str(np.datetime64('now'))) # Add current timestamp
    }

    try:
        response = supabase.table("calibration_sessions").insert(data).execute()
        if response.data:
            print(f"Calibration data uploaded successfully for session: {session_name}")
            # print(response.data) # Uncomment to see the full response
        else:
            print(f"Failed to upload calibration data for session: {session_name}. Response data was empty.")
            # print(response.error) # Uncomment to see error details
    except Exception as e:
        print(f"An error occurred during Supabase upload: {e}")

# --- Main Execution ---
if __name__ == "__main__":
    print("Starting calibration engine...")

    # --- Mock Data for Testing ---
    # Mock Luminance Data: Input signal (0-1) vs. measured luminance (0-1)
    # This simulates a non-linear display response that needs gamma correction.
    mock_input_signal = np.linspace(0, 1, 100)
    # Simulate a display that is too dark (e.g., gamma 2.5 instead of ideal 2.2)
    mock_measured_luminance = mock_input_signal**2.5 + np.random.normal(0, 0.02, 100)
    mock_measured_luminance = np.clip(mock_measured_luminance, 0, 1) # Ensure values are within 0-1
    mock_luminance_data = np.vstack((mock_input_signal, mock_measured_luminance)).T

    # Create a dummy checkerboard image for testing distortion mapping
    # In a real scenario, you would have a physical image.
    dummy_image_path = "dummy_checkerboard.png"
    checkerboard_pattern_size = (7, 6) # Inner corners
    square_physical_size = 25.0 # mm

    # Generate a simple checkerboard image for testing
    img_width, img_height = 640, 480
    checkerboard_img = np.zeros((img_height, img_width, 3), dtype=np.uint8)
    
    # This is a very basic way to draw a checkerboard.
    # For proper corner detection, a more realistic rendering might be needed or
    # better yet, use an actual checkerboard image.
    for i in range(checkerboard_pattern_size[1] + 2): # rows
        for j in range(checkerboard_pattern_size[0] + 2): # cols
            color = (255, 255, 255) if (i + j) % 2 == 0 else (0, 0, 0)
            y1 = int(i * img_height / (checkerboard_pattern_size[1] + 2))
            y2 = int((i + 1) * img_height / (checkerboard_pattern_size[1] + 2))
            x1 = int(j * img_width / (checkerboard_pattern_size[0] + 2))
            x2 = int((j + 1) * img_width / (checkerboard_pattern_size[0] + 2))
            cv2.rectangle(checkerboard_img, (x1, y1), (x2, y2), color, -1)
    
    # Save the dummy image
    cv2.imwrite(dummy_image_path, checkerboard_img)
    print(f"Generated dummy checkerboard image: {dummy_image_path}")

    # --- Perform Calibration Tasks ---
    session_name = "DisplayCalibration_2026-02-13" # Example session name

    # 1. Color & Gamma Solver
    print("
--- Running Color & Gamma Solver ---")
    gamma_val, lut_result = calculate_gamma_and_lut(mock_luminance_data)
    print(f"Calculated Gamma Value: {gamma_val:.3f}")
    # print(f"Generated LUT (first 10 values): {lut_result[:10]}")

    # 2. Distortion Mapping
    print("
--- Running Distortion Mapping ---")
    try:
        camera_mat, dist_coeff = calibrate_camera(dummy_image_path, checkerboard_pattern_size, square_physical_size)
        print("Camera Matrix:
", camera_mat)
        print("Distortion Coefficients:
", dist_coeff)
    except Exception as e:
        print(f"Error during camera calibration: {e}")
        camera_mat = np.array([])
        dist_coeff = np.array([])

    # 3. Database Integration
    print("
--- Uploading Data to Supabase ---")
    if SUPABASE_URL == "YOUR_SUPABASE_URL" or SUPABASE_ANON_KEY == "YOUR_SUPABASE_ANON_KEY":
        print("Supabase credentials are placeholders. Please update SUPABASE_URL and SUPABASE_ANON_KEY to enable database upload.")
    else:
        upload_calibration_data(session_name, gamma_val, lut_result, camera_mat, dist_coeff)
    
    # Clean up dummy image
    if os.path.exists(dummy_image_path):
        os.remove(dummy_image_path)
        print(f"Removed dummy checkerboard image: {dummy_image_path}")

    print("
Calibration engine finished.")
