🌬️ IoT Hostel Air Quality Monitor (Frontend)

A real-time, edge-speed telemetry dashboard designed to monitor Ammonia (NH₃) and Hydrogen Sulfide (H₂S) gas levels in university hostel restroom facilities. Built for UNILAG Computer Science (Group 7) CSC419 Project.

📑 System Architecture

This frontend serves as the visualization and logical escalation engine for an overarching IoT system.

Hardware Layer: An ESP8266 MCU coupled with an MQ-135 gas sensor continuously reads air quality metrics.

Data Layer: Telemetry is pushed via Wi-Fi to a Firebase Realtime Database.

Application Layer: This React.js dashboard maintains a persistent WebSocket connection to Firebase, instantly reflecting state changes without HTTP polling.

Notification Layer: Serverless timeouts handle automated Telegram alerts for maintenance staff and management escalation.

✨ Core Features

Real-Time Telemetry: Instantaneous UI updates reflecting PPM (Parts Per Million) gas levels.

Automated Escalation Matrix:

Level 1: Immediate Telegram alert to cleaning staff when gas exceeds safety thresholds.

Level 2 (Verification): 10-minute automated verification window after a manual "I Have Cleaned It" trigger to ensure air quality actually improves.

Level 3 (Escalation): 30-minute critical timeout that automatically alerts Hall Management if the facility remains unsanitary.

Hardware Heartbeat: Continuous timestamp monitoring that triggers an offline UI warning if the IoT node drops off the network.

Hysteresis Logic: Requires PPM to drop significantly below the warning threshold to register as "Clean," preventing alert spam caused by minor sensor fluctuations.

Developer Test Suite: Built-in UI controls to simulate hardware states, force network disconnects, and accelerate timers for demonstration purposes.

🚀 Quick Start (Local Development)

Prerequisites

Node.js (v18+ recommended)

npm or yarn

Installation

Clone the repository:

git clone [https://github.com/YOUR_USERNAME/iot-hostel-monitor-frontend.git](https://github.com/YOUR_USERNAME/iot-hostel-monitor-frontend.git)
cd iot-hostel-monitor-frontend


Install dependencies:

npm install


Start the Vite development server:

npm run dev


Open your browser and navigate to http://localhost:5173.

🛠️ Environment Configuration

Note: For the purpose of the university defense, Firebase and Telegram configurations are currently initialized within the main component. For production deployment, these should be abstracted into a .env file.

👨‍💻 Contributors

Awoniyi Semilore (Frontend & System Logic)

Group 7 - UNILAG Computer Science