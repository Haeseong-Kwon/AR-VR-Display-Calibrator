import numpy as np
import cv2
from scipy.optimize import curve_fit, minimize
from scipy.interpolate import griddata

# --- Helper Functions for Color Science ---
def rgb_to_xyz(rgb):
    """
    Converts sRGB values (0-1) to CIE XYZ values.
    Assumes sRGB color space and D65 illuminant.
    """
    # Inverse sRGB companding
    a = 0.055
    rgb_linear = np.where(rgb > 0.04045, ((rgb + a) / (1 + a))**2.4, rgb / 12.92)

    # sRGB to XYZ conversion matrix (for D65 illuminant)
    # Source: https://www.color.org/srgb.pdf (Table 1)
    M = np.array([
        [0.4124564, 0.3575761, 0.1804375],
        [0.2126729, 0.7151522, 0.0721750],
        [0.0193339, 0.1191920, 0.9503041]
    ])
    
    xyz = np.dot(rgb_linear, M.T) # .T for row-vector RGB input
    return xyz

def xyz_to_lab(xyz):
    """
    Converts CIE XYZ values to CIE Lab values.
    Assumes D65 illuminant (Xn, Yn, Zn).
    """
    Xn, Yn, Zn = 0.95047, 1.00000, 1.08883 # D65 white point

    # Normalize XYZ values by the white point
    x = xyz[..., 0] / Xn
    y = xyz[..., 1] / Yn
    z = xyz[..., 2] / Zn

    # Apply f(t) function
    def f(t):
        delta = 6/29
        return np.where(t > delta**3, t**(1/3), (t / (3 * delta**2)) + (4 / 29))

    fx, fy, fz = f(x), f(y), f(z)

    L = 116 * fy - 16
    a = 500 * (fx - fy)
    b = 200 * (fy - fz)
    
    return np.stack([L, a, b], axis=-1)

def delta_e_cie2000(lab1, lab2):
    """
    Calculates the CIE2000 Delta E between two Lab color arrays.
    Simplified implementation for general use, full spec is complex.
    For this prototype, a simplified perceptual difference is sufficient.
    """
    # For a full CIE2000 implementation, a dedicated library like 'colour-science' is recommended.
    # Here we use a simpler Euclidean distance for demonstration, scaled by L*a*b* components.
    # This is not strictly Delta E 2000 but serves as a reasonable perceptual difference.
    dL = lab1[..., 0] - lab2[..., 0]
    da = lab1[..., 1] - lab2[..., 1]
    db = lab1[..., 2] - lab2[..., 2]
    
    return np.sqrt(dL**2 + da**2 + db**2)

def calculate_color_correction_matrix(measured_rgb: np.ndarray, target_rgb: np.ndarray) -> np.ndarray:
    """
    Calculates a 3x3 color correction matrix (CCM) to minimize the Delta E
    between measured RGB values transformed by the CCM and target RGB values.

    Args:
        measured_rgb (np.ndarray): N x 3 array of measured RGB values (0-1).
        target_rgb (np.ndarray): N x 3 array of target RGB values (0-1).

    Returns:
        np.ndarray: A 3x3 color correction matrix.
    """
    if measured_rgb.shape != target_rgb.shape or measured_rgb.shape[1] != 3:
        raise ValueError("measured_rgb and target_rgb must be N x 3 arrays.")

    # Objective function to minimize: average Delta E
    def objective_function(ccm_flat):
        ccm = ccm_flat.reshape((3, 3))
        
        # Apply CCM to measured RGB
        corrected_rgb = np.dot(measured_rgb, ccm.T) # .T because numpy dot expects (N,3) @ (3,3)
        corrected_rgb = np.clip(corrected_rgb, 0, 1) # Clip to valid RGB range

        # Convert to Lab for Delta E calculation
        corrected_lab = xyz_to_lab(rgb_to_xyz(corrected_rgb))
        target_lab = xyz_to_lab(rgb_to_xyz(target_rgb))
        
        # Calculate average Delta E
        return np.mean(delta_e_cie2000(corrected_lab, target_lab))

    # Initial guess for CCM (identity matrix)
    initial_ccm = np.identity(3).flatten()

    # Perform optimization
    # Using 'L-BFGS-B' for bounded optimization if we want to add bounds later,
    # or 'Nelder-Mead' for a more robust but slower general optimization.
    # For a simple linear transformation, least squares might be more direct.
    # However, since the objective is Delta E (non-linear), `minimize` is appropriate.
    result = minimize(objective_function, initial_ccm, method='Nelder-Mead', tol=1e-4)

    if not result.success:
        print(f"Warning: CCM optimization failed: {result.message}")

    optimal_ccm = result.x.reshape((3, 3))
    return optimal_ccm

def calculate_awb_gains(measured_white_rgb: np.ndarray) -> np.ndarray:
    """
    Calculates RGB gain values to adjust the display's white point to D65 (6500K).

    Args:
        measured_white_rgb (np.ndarray): A 1x3 array of measured RGB values (0-1)
                                         for a white patch.

    Returns:
        np.ndarray: A 1x3 array of RGB gain values.
    """
    if measured_white_rgb.shape != (3,):
        raise ValueError("measured_white_rgb must be a 1x3 array.")

    # Target D65 white point in XYZ (normalized, Y=1)
    # Xn, Yn, Zn = 0.95047, 1.00000, 1.08883 (from sRGB to XYZ conversion)
    # We need to find gains G_R, G_G, G_B such that:
    # (measured_R * G_R, measured_G * G_G, measured_B * G_B) -> D65 white point

    # A simpler approach: adjust each channel relative to a reference
    # or assume linear response for white point adjustment.
    # For a proper AWB, typically you measure the white point's XYZ or chromaticity
    # and then calculate gains to shift it to D65's chromaticity.

    # Let's assume a desired white balance in RGB (e.g., target_white_rgb = [1.0, 1.0, 1.0])
    # And we want the measured_white_rgb to become this target.
    # Gains = target_white_rgb / measured_white_rgb
    
    # Or, if we assume the measured white is (R, G, B) and we want it to be "neutral" white
    # with the same luminance, we can scale individual channels.
    # Let's aim for a neutral white point where R=G=B in the corrected space,
    # and the luminance is preserved (or set to a standard).
    
    # For simplicity in this prototype, let's assume we want to scale each channel
    # so that the measured white RGB becomes [1, 1, 1] relative to its components.
    # A more robust solution involves color temperature calculations using XYZ or Lab.

    # D65 white point in sRGB (linear values) is roughly [1,1,1]
    # So we want to transform measured_white_rgb to a neutral white.
    # The simplest form of AWB gain calculation is to normalize against one channel
    # or to balance against the average.

    # A common approach: scale R and B channels relative to G to match D65.
    # This requires knowing the display's primaries or a more complex conversion.
    
    # For a pragmatic approach: assume we want to achieve target R, G, B values from measured.
    # If the goal is a "neutral" white, then R, G, B should be equal after correction.
    
    # Let's target a neutral white and calculate gains based on the measured R, G, B
    # to achieve the desired relative balance.
    # D65 is roughly (0.95047, 1.00000, 1.08883) in XYZ
    # If measured white RGB (0-1) corresponds to some XYZ, we want to transform it to D65 XYZ.

    # A simple gain calculation for AWB:
    # Assume target white is (1,1,1) (or some specific D65 sRGB equivalent).
    # Then gains = target_channel_value / measured_channel_value
    # However, this can lead to clipping if measured is very low.

    # Let's consider a practical approach for AWB:
    # We want to scale the RGB channels of the display so that a measured white
    # patch appears as D65.
    # Let measured_white_rgb = [R_m, G_m, B_m]
    # We want corrected_white_rgb = [R_c, G_c, B_c] such that its color temperature is D65.
    # This means (R_m * G_R, G_m * G_G, B_m * G_B) should correspond to D65.

    # A common AWB algorithm is Gray World or White Patch.
    # A simplified method for D65 target:
    # 1. Convert measured_white_rgb to XYZ.
    # 2. Compare to D65 XYZ values.
    # 3. Derive gains.

    # D65 White point (XYZ):
    d65_xyz = np.array([0.95047, 1.00000, 1.08883])

    # Convert measured white RGB to XYZ
    measured_white_xyz = rgb_to_xyz(measured_white_rgb)

    # Calculate gains. This is a simplification. A more accurate model would involve
    # the display's primary chromaticities.
    # Here we assume we want to scale the measured XYZ to D65 XYZ.
    # gains_xyz = d65_xyz / measured_white_xyz
    # Then convert gains_xyz back to RGB space. This is non-trivial.

    # Alternative simplified approach:
    # If measured_white_rgb = [R, G, B] and we want a neutral white (R=G=B=X)
    # The simplest way to achieve a "neutral" white in a display is to make the
    # R, G, B channels produce equal output when fed with [1,1,1].
    # But here, we have a measured white [R_m, G_m, B_m] and want to make it D65.

    # Let's use a simpler gain calculation based on the assumption that
    # G (green) is often the most stable, and we adjust R and B relative to G.
    # Or, adjust R, G, B relative to the maximum of the three channels
    # to avoid amplifying noise in dark channels.
    
    # A common simple AWB calculation scales each channel based on its contribution
    # to the overall luminance (Y channel of XYZ), aiming for target Y values.
    # Or, even simpler: target the maximum value of the measured white as a reference.

    # For now, let's target each channel to reach '1.0' if the measured value
    # is less than 1.0, and then normalize the set of gains.
    # This is a basic form of "white patch" algorithm.

    # Let's aim to make the individual RGB channels of the measured white such that
    # they would result in a D65 white when displayed.
    # A simpler form of white balance:
    # Find the maximum component in the measured white to avoid clipping,
    # then scale other components relative to achieve a "neutral" gray/white.
    
    max_val = np.max(measured_white_rgb)
    if max_val == 0: # Avoid division by zero if white is black
        return np.array([1.0, 1.0, 1.0])

    # Simple scaling: normalize to the brightest channel, then adjust for D65.
    # This requires a more complex model (e.g., knowledge of display primaries)
    # to precisely hit D65 from arbitrary RGB.

    # A more direct, but still simplified, approach:
    # If we want the white point to be D65, and we measure current R,G,B for white.
    # We need gains G_R, G_G, G_B such that applying them to measured R,G,B
    # moves the white point towards D65.
    
    # Let's calculate gains directly from the measured white.
    # Assuming the "ideal" white point has R, G, B values that are balanced
    # for D65 (e.g., [1.0, 1.0, 1.0] if the display natively hits D65 for R=G=B=1).
    # Then the gains would be target / measured.

    # Target D65 chromaticity coordinates (x, y) = (0.3127, 0.3290)
    
    # Let's simplify and aim for measured_white_rgb to become [1.0, 1.0, 1.0] after gain.
    # This assumes that [1,1,1] in your display's native space is close to D65.
    # If measured_white_rgb is [0.9, 0.8, 1.0], then gains should be [1/0.9, 1/0.8, 1/1.0]
    # This might push values above 1.0.

    # To avoid clipping and maintain relative luminance:
    # Find a reference channel (e.g., green, as it's often close to peak luminance)
    # Scale R and B channels relative to G to match D65 (requiring knowledge of primaries).

    # For a simple prototype, let's just make the R and B channels equal to the G channel
    # while preserving the overall "brightness" from the brightest component.
    # This will achieve a gray balance but not necessarily D65.
    
    # To get to D65 specifically without knowing primaries:
    # Need to convert measured_white_rgb to a color space where D65 is a known point
    # (e.g., XYZ), then determine the transform to move the measured point to D65.
    
    # A common practical approach:
    # Measure R, G, B output of white (say, 255, 255, 255 input).
    # Target values might be fixed (e.g., what a properly calibrated D65 monitor would output).
    # Gains = Target_XYZ_D65 / Measured_XYZ_White. This results in XYZ gains, which are not RGB gains directly.

    # Let's assume we want to correct the measured white RGB to a target sRGB D65 white,
    # which is effectively [1, 1, 1] in linear sRGB space.
    # If the measured_white_rgb is in linear space already (0-1), then:
    gains = np.array([1.0, 1.0, 1.0]) / measured_white_rgb
    
    # Normalize gains to avoid boosting too much, often by scaling against the green channel
    # or the smallest gain to keep max output at 1.0.
    # Example: If measured_white_rgb = [0.8, 1.0, 0.9], gains = [1.25, 1.0, 1.11]
    # If we apply these, the max output might be >1.0 for other colors.
    
    # A common approach is to set the maximum gain to 1.0 to avoid clipping.
    # Then scale all gains by this factor.
    # This will reduce the overall luminance to prevent clipping.
    if np.max(gains) > 1.0:
        gains = gains / np.max(gains)

    return gains

def generate_mura_compensation_map(spatial_luminance_data: np.ndarray, display_resolution: tuple) -> np.ndarray:
    """
    Generates a spatial luminance compensation map for Mura correction.

    Args:
        spatial_luminance_data (np.ndarray): An N x 3 array where each row is (x, y, luminance).
                                             x, y should be normalized (0-1) or pixel coordinates.
        display_resolution (tuple): (width, height) of the display in pixels.

    Returns:
        np.ndarray: A 2D NumPy array representing the Mura compensation map,
                    with dimensions (height, width). Values typically represent
                    scaling factors to apply to each pixel.
    """
    if spatial_luminance_data.shape[1] != 3:
        raise ValueError("spatial_luminance_data must be an N x 3 array (x, y, luminance).")

    points = spatial_luminance_data[:, :2]  # (x, y) coordinates
    values = spatial_luminance_data[:, 2]   # luminance values

    width, height = display_resolution
    grid_x, grid_y = np.mgrid[0:width, 0:height] # Create a grid for interpolation

    # Normalize grid_x, grid_y if points are normalized
    # Assuming points are already normalized (0-1) or are pixel coordinates directly.
    # If points are pixel coordinates, grid_x and grid_y should also be pixel coordinates.
    # Let's assume points are pixel coordinates for simplicity.

    # Interpolate the luminance values over the entire display grid
    # method can be 'linear', 'nearest', or 'cubic'
    mura_map = griddata(points, values, (grid_x, grid_y), method='linear')

    # Handle NaN values (e.g., if some areas were not measured, fill with average or nearest)
    if np.any(np.isnan(mura_map)):
        print("Warning: Mura map contains NaN values, likely due to unmeasured areas. Filling with nearest neighbors.")
        mura_map = griddata(points, values, (grid_x, grid_y), method='nearest')
    
    # The map values are measured luminance. For compensation, we often want
    # a correction factor relative to a target luminance (e.g., average or peak).
    # For a prototype, let's assume we want to flatten the luminance to the average.
    # If target_luminance is 1.0 (normalized), then correction_factor = target_luminance / measured_luminance
    
    # Let's compute a simple compensation factor based on the average luminance.
    average_luminance = np.nanmean(mura_map) # Use nanmean to ignore NaNs during average calculation
    if average_luminance == 0:
        compensation_map = np.ones_like(mura_map) # No compensation if average is zero
    else:
        compensation_map = average_luminance / mura_map
    
    # Ensure no division by zero or extreme values if mura_map has very low values.
    # Clip compensation factors to a reasonable range (e.g., 0.5 to 2.0)
    compensation_map = np.clip(compensation_map, 0.5, 2.0) # Example clipping
    
    return compensation_map.T # Transpose to get (height, width)

# --- 1. Color & Gamma Solver ---
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
                            camera_matrix: np.ndarray, dist_coeffs: np.ndarray,
                            ccm_matrix: np.ndarray, awb_gains: np.ndarray, mura_map: np.ndarray):
    """
    Uploads calibration data to the Supabase 'calibration_sessions' table.

    Args:
        session_name (str): A unique name for this calibration session.
        gamma_value (float): The calculated optimal gamma value.
        lut (np.ndarray): The generated Look-Up Table.
        camera_matrix (np.ndarray): The camera intrinsic matrix.
        dist_coeffs (np.ndarray): The distortion coefficients.
        ccm_matrix (np.ndarray): The 3x3 Color Correction Matrix.
        awb_gains (np.ndarray): The 1x3 array of RGB AWB gain values.
        mura_map (np.ndarray): The 2D Mura Compensation Map.
    """
    
    # Convert NumPy arrays to list for JSON serialization
    lut_list = lut.tolist()
    camera_matrix_list = camera_matrix.tolist()
    dist_coeffs_list = dist_coeffs.tolist()
    ccm_matrix_list = ccm_matrix.tolist()
    awb_gains_list = awb_gains.tolist()
    mura_map_list = mura_map.tolist() # Mura map can be large, consider compression or linking to external storage for very large maps

    data = {
        "session_name": session_name,
        "gamma_value": float(gamma_value), # Ensure it's a standard float
        "lut": json.dumps(lut_list), # Store as JSON string
        "camera_matrix": json.dumps(camera_matrix_list), # Store as JSON string
        "dist_coeffs": json.dumps(dist_coeffs_list), # Store as JSON string
        "color_correction_matrix": json.dumps(ccm_matrix_list), # New field
        "awb_gains": json.dumps(awb_gains_list), # New field
        "mura_compensation_map": json.dumps(mura_map_list), # New field
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
    from datetime import datetime

    # --- Mock Data for Testing ---
    # In a real application, this data would come from actual sensor measurements.
    
    # Mock Luminance Data: Input signal (0-1) vs. measured luminance (0-1)
    mock_input_signal = np.linspace(0, 1, 100)
    mock_measured_luminance = mock_input_signal**2.5 + np.random.normal(0, 0.02, 100)
    mock_measured_luminance = np.clip(mock_measured_luminance, 0, 1)
    mock_luminance_data = np.vstack((mock_input_signal, mock_measured_luminance)).T

    # Path to the checkerboard image for distortion mapping.
    # IMPORTANT: Replace with the actual path to your checkerboard image.
    checkerboard_image_path = "path/to/your/checkerboard.png" 
    checkerboard_pattern_size = (7, 6) # Inner corners
    square_physical_size = 25.0 # mm

    # --- Perform Calibration Tasks ---
    session_name = f"DisplayCalibration_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}"

    # 1. Color & Gamma Solver
    gamma_val, lut_result = calculate_gamma_and_lut(mock_luminance_data)

    # Mock Data for new functions (replace with actual measurements)
    mock_measured_rgb = np.array([
        [0.1, 0.2, 0.3], [0.4, 0.5, 0.6], [0.7, 0.8, 0.9],
        [0.3, 0.1, 0.2], [0.6, 0.4, 0.5], [0.9, 0.7, 0.8]
    ])
    mock_target_rgb = mock_measured_rgb * 0.9

    mock_measured_white_rgb = np.array([0.9, 0.85, 0.95])

    num_mura_measurements = 20
    mura_x = np.random.rand(num_mura_measurements)
    mura_y = np.random.rand(num_mura_measurements)
    mura_lum = 0.7 + 0.3 * (np.sin(mura_x * np.pi) + np.sin(mura_y * np.pi)) + np.random.normal(0, 0.05, num_mura_measurements)
    mura_lum = np.clip(mura_lum, 0, 1)

    mock_spatial_luminance_data = np.vstack([mura_x, mura_y, mura_lum]).T
    mock_display_resolution = (1920, 1080)

    # 3. AI Color Matching Algorithm
    ccm_matrix_result = calculate_color_correction_matrix(mock_measured_rgb, mock_target_rgb)

    # 4. Auto-White Balance (AWB)
    awb_gains_result = calculate_awb_gains(mock_measured_white_rgb)

    # 5. Mura Compensation Prototype
    mura_map_result = generate_mura_compensation_map(mock_spatial_luminance_data, mock_display_resolution)

    # 2. Distortion Mapping
    camera_mat = np.array([])
    dist_coeff = np.array([])
    if os.path.exists(checkerboard_image_path):
        try:
            camera_mat, dist_coeff = calibrate_camera(checkerboard_image_path, checkerboard_pattern_size, square_physical_size)
        except Exception as e:
            # Log the error, but don't stop the entire calibration process
            print(f"Error during camera calibration with {checkerboard_image_path}: {e}")
    else:
        # Log a warning if the image is expected but not found
        print(f"Warning: Checkerboard image not found at {checkerboard_image_path}. Skipping camera calibration.")

    # 3. Database Integration
    if SUPABASE_URL == "YOUR_SUPABASE_URL" or SUPABASE_ANON_KEY == "YOUR_SUPABASE_ANON_KEY":
        print("Supabase credentials are placeholders. Please update SUPABASE_URL and SUPABASE_ANON_KEY to enable database upload.")
    else:
        upload_calibration_data(session_name, gamma_val, lut_result, camera_mat, dist_coeff,
                                ccm_matrix_result, awb_gains_result, mura_map_result)
