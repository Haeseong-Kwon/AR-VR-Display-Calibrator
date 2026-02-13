# Guardion | AR/VR Display Calibrator

## Project Overview

**Guardion** is a next-generation, AI-driven display calibration and correction system designed for high-end spatial computing devices, particularly targeting AR/VR applications. This project demonstrates advanced techniques for display characterization, correction, and long-term performance monitoring, crucial for achieving pristine visual experiences in extended reality environments.

Developed as a comprehensive solution, Guardion integrates various modules for precise color and gamma management, distortion correction, display uniformity compensation, and proactive trend analysis. It leverages modern web technologies (Next.js) for intuitive control and visualization, backed by robust Python-based calibration engines and a scalable Supabase backend for data management.

---

**For Wave-AI Lab's Consideration:**

This project serves as a portfolio piece showcasing expertise in:
*   **Applied AI/ML:** Implementation of optimization algorithms for color correction matrices and trend analysis for predictive maintenance.
*   **Computer Vision (OpenCV):** Precise distortion mapping using checkerboard calibration.
*   **Display Technologies:** Deep understanding and practical application of display characterization (gamma, color gamut, white balance, Mura compensation).
*   **Full-stack Development:** Integration of Next.js frontend with Python backend scripts and Supabase for a scalable and maintainable architecture.
*   **Data Analysis & Reporting:** Generation of structured reports for performance monitoring and decision-making.

Guardion exemplifies a robust solution for a complex problem at the intersection of AI, computer vision, and advanced display systems, making it highly relevant to cutting-edge research and development in spatial computing and visual technologies.

---

## Features

Guardion provides a suite of tools for comprehensive display management:

### 1. Calibration Engine (`calibration_engine.py`)
*   **Color & Gamma Solver:** Calculates optimal gamma curves and generates Look-Up Tables (LUTs) based on measured luminance data, ensuring accurate luminance response.
*   **Distortion Mapping:** Utilizes OpenCV with checkerboard patterns to calculate camera matrices and distortion coefficients, enabling precise correction of pincushion/barrel distortion common in AR/VR optics.
*   **AI Color Matching Algorithm:** Computes a 3x3 Color Correction Matrix (CCM) using optimization to minimize $\Delta E$ (color difference) between measured and target color spaces (e.g., sRGB, DCI-P3).
*   **Auto-White Balance (AWB):** Determines RGB gain values to automatically adjust the display's color temperature to standard white points (e.g., D65/6500K).
*   **Mura Compensation Prototype:** Generates a spatial luminance compensation map to correct for display brightness non-uniformity, enhancing visual consistency.
*   **Database Integration:** Uploads all calculated calibration parameters (gamma, LUT, distortion matrix, CCM, AWB gains, Mura map) to a Supabase database for persistent storage and historical tracking.

### 2. Reporting Engine (`report_engine.py`)
*   **CIE 1931 Chromaticity Calculator:** Converts measured RGB coordinates to CIE 1931 xy coordinates and calculates display color gamut coverage against standard color spaces (sRGB, AdobeRGB, DCI-P3).
*   **Trend Analysis Engine:** Analyzes historical calibration data from Supabase to detect color drift over time, providing insights and recommending optimal calibration cycle frequencies.
*   **Report Metadata Generator:** Summarizes key statistics (e.g., latest gamma, gamut coverage, trend analysis results) into a structured JSON report, ready for integration into PDF documents or web dashboards.

### 3. Web Dashboard (Next.js Frontend)
*(Note: The web dashboard component is implied by the project description and optimization goals. This `README.md` draft focuses on the backend logic and data generation, which would feed into such a dashboard.)*
*   Provides an interface for triggering calibrations.
*   Visualizes real-time and historical calibration data.
*   Displays generated reports and trend analyses.

## Architecture

The Guardion system follows a modular, full-stack architecture:

*   **Frontend:** Built with **Next.js** (React) for a high-performance, SEO-friendly web dashboard. It interacts with the Supabase database for data visualization and potentially triggers backend processes (e.g., via API routes).
*   **Backend / Processing Engines:** Core calibration and reporting logic is implemented in **Python**.
    *   `calibration_engine.py`: Handles display characterization, correction algorithms, and initial data persistence.
    *   `report_engine.py`: Focuses on data analysis, trend detection, and comprehensive report generation.
*   **Database:** **Supabase** (PostgreSQL-backed) serves as the primary data store, hosting the `calibration_sessions` table. It's used to store all raw and processed calibration parameters, enabling historical tracking and trend analysis.
*   **Libraries:** Extensively uses `NumPy` for numerical operations, `SciPy` for optimization and interpolation, and `OpenCV` for computer vision tasks.

## Setup and Installation

### Prerequisites

*   Node.js (LTS recommended)
*   Python 3.8+
*   Git
*   Supabase Account and Project

### Frontend (Next.js) Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd display-calibrator
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:**
    Create a `.env.local` file in the root directory.
    **CRITICAL SECURITY NOTE:** Ensure that sensitive keys are not exposed client-side.
    ```env
    # Client-side (Public) keys - Safe for browser exposure
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY # Use the 'anon' key from Supabase Project Settings > API

    # Server-side only keys - NOT exposed to the browser
    # SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY # Only if needed for server-side operations with elevated privileges
    ```
    **Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_PUBLIC_KEY` with your actual Supabase credentials.** The `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be your *public, anon* key, not the `service_role` key. The `service_role` key must ONLY be used server-side and should not be prefixed with `NEXT_PUBLIC_`.

4.  **Run the Next.js development server:**
    ```bash
    npm run dev
    ```
    The application should now be accessible at `http://localhost:3000`.

### Backend (Python Engines) Setup

1.  **Install Python dependencies:**
    ```bash
    pip install numpy scipy opencv-python supabase-py
    ```
2.  **Environment Variables:**
    The Python scripts also rely on Supabase credentials. Ensure these are set either in your shell environment or directly within the scripts (though environment variables are recommended for production).
    ```bash
    export SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    export SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
    # If using service role key in Python scripts (e.g., for specific server-side operations),
    # ensure it's loaded securely and not publicly exposed.
    ```
    **Replace with your actual Supabase credentials.**

### Database (Supabase) Setup

1.  **Create a Supabase Project:** If you haven't already, create a new project on Supabase.
2.  **Create `calibration_sessions` table:**
    Navigate to the "Table Editor" in your Supabase project and create a new table named `calibration_sessions`. The table schema should accommodate the following fields (you can add more as needed):

    | Column Name            | Type      | Default | Notes                                          |
    | :--------------------- | :-------- | :------ | :--------------------------------------------- |
    | `id`                   | `UUID`    | `gen_random_uuid()` | Primary Key                                    |
    | `created_at`           | `TIMESTAMP`| `now()`  | Timestamp of record creation                   |
    | `session_name`         | `TEXT`    |         | A unique name for the calibration session      |
    | `gamma_value`          | `REAL`    |         | Calculated gamma value                         |
    | `lut`                  | `JSONB`   |         | Look-Up Table (JSON string)                    |
    | `camera_matrix`        | `JSONB`   |         | Camera Intrinsic Matrix (JSON string)          |
    | `dist_coeffs`          | `JSONB`   |         | Distortion Coefficients (JSON string)          |
    | `color_correction_matrix` | `JSONB`   |         | 3x3 Color Correction Matrix (JSON string)      |
    | `awb_gains`            | `JSONB`   |         | RGB Auto-White Balance Gains (JSON string)     |
    | `mura_compensation_map` | `JSONB`   |         | Spatial Mura Compensation Map (JSON string)    |
    | `timestamp`            | `JSONB`   |         | JSON string of calibration timestamp (from Python) |
    | `device_id`            | `TEXT`    |         | (Recommended) Identifier for the calibrated device |

    **Note on JSONB types:** Fields like `lut`, `camera_matrix`, `dist_coeffs`, etc., are stored as JSON strings from Python. Using `JSONB` in Supabase allows efficient querying and indexing of the JSON content.

## Usage

### Running the Calibration Engine

To perform a display calibration and upload the results to Supabase:

1.  **Prepare a checkerboard image:** Place your checkerboard image (e.g., `checkerboard.png`) in the project directory or specify its path in `calibration_engine.py`.
2.  **Ensure sensor data:** Provide your luminance measurement data (mock data is used in the example).
3.  **Execute the script:**
    ```bash
    python calibration_engine.py
    ```
    This will generate calibration parameters and push them to your Supabase `calibration_sessions` table.

### Running the Reporting Engine

To generate a detailed JSON report from your Supabase data:

1.  **Ensure `calibration_engine.py` has been run at least once** to populate the `calibration_sessions` table.
2.  **Execute the script:**
    ```bash
    python report_engine.py
    ```
    This will fetch data, perform analysis, and output `calibration_report.json` in the project root.

---

This `README.md` provides a comprehensive overview of the project, its technical underpinnings, and instructions for setup and usage. It also highlights its value as a portfolio piece for Wave-AI Lab, as requested.