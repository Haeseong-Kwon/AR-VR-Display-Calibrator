# Precision | AR/VR Display Calibrator

Next-generation, AI-driven display calibration and correction system for high-end spatial computing.

**Precision** is a professional display calibration and correction system designed for high-end spatial computing devices, particularly targeting AR/VR applications. This project demonstrates advanced techniques for display characterization, correction, and long-term performance monitoring, crucial for achieving pristine visual experiences in extended reality environments.

Developed as a comprehensive solution, Precision integrates various modules for precise color and gamma management, distortion correction, display uniformity compensation, and proactive trend analysis. It leverages modern web technologies (Next.js) for intuitive control and visualization, backed by robust Python-based calibration engines and a scalable Supabase backend for data management.

## 🚀 Vision
Our mission is to bridge the gap between human perception and digital display limitations through intelligent, real-time correction algorithms.

Precision exemplifies a robust solution for a complex problem at the intersection of AI, computer vision, and advanced display systems, making it highly relevant to cutting-edge research and development in spatial computing and visual technologies.

## 🛠 Key Features
Precision provides a suite of tools for comprehensive display management:

- **AI-Driven Correction**: Automated adjustment of color temperature, white balance, and gamma curves using machine learning models.
- **Real-time Preview Engine**: Interactive A/B testing with a split-screen viewer to visualize correction effects instantly.
- **Multi-device Comparison Dashboard**: Unified management of calibration history and trends for multiple headsets (e.g., Vision Pro, Quest 3).
- **Professional PDF Reporting**: Automated generation of detailed calibration certificates with accuracy metrics (Delta-E).
- **Profile Export & Sync**: Seamless export of .cube (LUT) and .icc profiles, synced to secure cloud storage.
- **Web-based Remote Controller**: Low-latency remote management of calibration patterns via Supabase Realtime.

## 🏗 Architecture
The Precision system follows a modular, full-stack architecture:

- **Frontend**: Next.js 14, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend/Data**: Supabase (PostgreSQL), Realtime Broadcast, Supabase Storage.
- **Engine**: Python-based calibration modules for deep analysis.
- **Cloud**: Automated synchronization and persistent session management.

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project keys

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Haeseong-Kwon/AR-VR-Display-Calibrator.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to start the calibration workshop.