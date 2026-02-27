import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { AlertTriangle, CheckCircle, Clock, Wind, Settings, Info, Beaker, WifiOff, ShieldAlert, Moon, Sun } from 'lucide-react';

// ==========================================
// 1. CONFIGURATION & SETUP
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDPDPPVj21pRo5x0zWs0rhbU6sVOXYKcTY",
  authDomain: "unilag-toilet-monitor.firebaseapp.com",
  databaseURL: "https://unilag-toilet-monitor-default-rtdb.firebaseio.com",
  projectId: "unilag-toilet-monitor",
  storageBucket: "unilag-toilet-monitor.firebasestorage.app",
  messagingSenderId: "579226539994",
  appId: "1:579226539994:web:03f35f6ee41104dc8792e3",
  measurementId: "G-WR6WPCVBPM"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Telegram Config
const BOT_TOKEN = '8459102439:AAE_iPwp_AH1AftCasf4aCTWLnqXXrncdC4';
const CHAT_ID_CLEANER = '6843708383'; 
const CHAT_ID_CHAIRPERSON = '6843708383'; 

const THRESHOLD = 300; 
const CLEAN_THRESHOLD = 250; 

const sendTelegramAlert = async (recipientId, message) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: recipientId, text: message }),
    });
  } catch (error) {
    console.error("Telegram error:", error);
  }
};

// ==========================================
// 2. MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [gasLevel, setGasLevel] = useState(0);
  const [status, setStatus] = useState("CLEAN"); 
  const [isTestMode, setIsTestMode] = useState(false); 
  const [isOffline, setIsOffline] = useState(false); 
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode for your eyes!
  
  const [isEscalated, setIsEscalated] = useState(false); 
  const [dirtyStartTime, setDirtyStartTime] = useState(null);

  const escalationTimer = useRef(null);
  const graceTimer = useRef(null);
  const lastSeenRef = useRef(Date.now()); 

  const GRACE_PERIOD_MS = isTestMode ? 10 * 1000 : 10 * 60 * 1000; 
  const ESCALATION_PERIOD_MS = isTestMode ? 30 * 1000 : 30 * 60 * 1000; 
  const OFFLINE_TIMEOUT_MS = isTestMode ? 20 * 1000 : 5 * 60 * 1000; 

  useEffect(() => {
    const sensorRef = ref(db, 'sensorData/gasLevel');
    
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const currentGas = snapshot.val() || 0;
      setGasLevel(currentGas);
      
      lastSeenRef.current = Date.now();
      if (isOffline) setIsOffline(false);

      if (currentGas > THRESHOLD && status === "CLEAN") {
        setStatus("DIRTY");
        setDirtyStartTime(Date.now()); 
        setIsEscalated(false);
        sendTelegramAlert(CHAT_ID_CLEANER, "🚨 ACTION REQUIRED: Toilet 1 air quality has dropped below acceptable limits (High H₂S/NH₃). Please sanitize immediately.");
        
        escalationTimer.current = setTimeout(() => {
          setIsEscalated(true); 
          sendTelegramAlert(CHAT_ID_CHAIRPERSON, "⚠️ ESCALATION ALERT: Toilet 1 has maintained hazardous gas levels for over 30 minutes without resolution. Management intervention required.");
        }, ESCALATION_PERIOD_MS);
      }
      
      if (currentGas <= CLEAN_THRESHOLD && status !== "CLEAN") {
        if (isEscalated && dirtyStartTime) {
          const timeDiff = Date.now() - dirtyStartTime;
          const duration = isTestMode ? Math.floor(timeDiff / 1000) : Math.floor(timeDiff / 60000);
          const unit = isTestMode ? "seconds" : "minutes";
          sendTelegramAlert(CHAT_ID_CHAIRPERSON, `✅ STATUS UPDATE: Toilet 1 has been successfully cleaned and air quality is restored.\n\n⏱️ Total Time to Resolution: ${duration} ${unit}.`);
        }
        setStatus("CLEAN");
        setIsEscalated(false);
        setDirtyStartTime(null);
        clearTimeout(escalationTimer.current);
        clearTimeout(graceTimer.current);
      }
    });

    const offlineChecker = setInterval(() => {
      if (Date.now() - lastSeenRef.current > OFFLINE_TIMEOUT_MS) {
        setIsOffline(true);
      }
    }, 1000);

    return () => { 
      unsubscribe(); 
      clearInterval(offlineChecker);
    };
  }, [status, isTestMode, isEscalated, dirtyStartTime, isOffline]);

  const handleCleaned = () => {
    setStatus("VERIFYING");
    graceTimer.current = setTimeout(() => {
      setStatus((currentStatus) => {
        if (currentStatus === "VERIFYING") {
          sendTelegramAlert(CHAT_ID_CLEANER, "❌ VERIFICATION FAILED: Gas levels at Toilet 1 remain critical 10 minutes after reported cleaning. Please re-assess immediately.");
          return "DIRTY";
        }
        return currentStatus;
      });
    }, GRACE_PERIOD_MS);
  };

  const simulateGasLevel = (level) => {
    set(ref(db, 'sensorData/gasLevel'), level);
    lastSeenRef.current = Date.now(); 
  };

  const handleForceClean = () => {
    setStatus("CLEAN");
    setIsEscalated(false);
    setDirtyStartTime(null);
    clearTimeout(escalationTimer.current);
    clearTimeout(graceTimer.current);
    simulateGasLevel(100); 
    sendTelegramAlert(CHAT_ID_CHAIRPERSON, "🛠️ SYSTEM OVERRIDE: Toilet 1 has been manually reset to a CLEAN state by an Administrator. Please inspect the hardware sensor for potential faults.");
  };

  const forceOffline = () => {
    lastSeenRef.current = Date.now() - OFFLINE_TIMEOUT_MS - 1000;
  };

  // ==========================================
  // 3. UI RENDER (Hardwired Dark Mode for Tailwind v4)
  // ==========================================
  
  const getStatusStyles = () => {
    if (isOffline) return isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-300 text-slate-500";
    switch (status) {
      case "DIRTY": return isDarkMode ? "bg-red-900/30 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-700";
      case "VERIFYING": return isDarkMode ? "bg-amber-900/30 border-amber-800 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700";
      default: return isDarkMode ? "bg-emerald-900/30 border-emerald-800 text-emerald-400" : "bg-green-50 border-green-200 text-green-700";
    }
  };

  const getGaugeColor = () => {
    if (gasLevel > THRESHOLD + 100) return isDarkMode ? "text-red-500" : "text-red-600";
    if (gasLevel > THRESHOLD) return isDarkMode ? "text-orange-400" : "text-orange-500";
    return isDarkMode ? "text-emerald-400" : "text-emerald-500";
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <div className="p-4 md:p-6 lg:p-8 flex flex-col items-center">
        
        {/* Top Header & Dark Mode Toggle */}
        <div className="w-full max-w-6xl flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Wind size={26} />
            </div>
            <div>
              <h1 className={`text-xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Hostel Monitor</h1>
              <p className={`text-sm font-semibold mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>UNILAG Computer Science | Group 7</p>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>CSC419 Project</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 md:p-3 rounded-full shadow-sm border transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Main Responsive Grid */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* ================= LEFT COLUMN: MAIN DASHBOARD ================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className={`rounded-2xl shadow-xl overflow-hidden border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              
              <div className={`p-6 text-white text-center border-b ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-800'}`}>
                <h2 className="text-2xl font-bold tracking-tight">Toilet 1 Overview</h2>
                <p className="text-slate-400 text-sm mt-1">Real-time H₂S & NH₃ telemetry</p>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                
                {/* Critical Banners */}
                {isEscalated && !isOffline && (
                  <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg flex items-start gap-3 animate-pulse border-2 border-red-800">
                    <AlertTriangle className="shrink-0 mt-1" size={24} />
                    <div>
                      <p className="font-bold text-lg uppercase tracking-wide">Critical Warning</p>
                      <p className="text-sm mt-1 text-red-100">Inability to clean the toilet under 30 minutes. Management notified. Action required.</p>
                    </div>
                  </div>
                )}

                {isOffline && (
                  <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg flex items-start gap-3 border-2 border-slate-600">
                    <WifiOff className="shrink-0 mt-1 text-slate-400" size={24} />
                    <div>
                      <p className="font-bold text-lg tracking-wide text-slate-200">System Offline</p>
                      <p className="text-sm mt-1 text-slate-400">Connection to hardware lost. Please check power and Wi-Fi at the node.</p>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className={`rounded-xl border p-4 md:p-5 flex items-center justify-center gap-3 transition-colors duration-300 shadow-inner ${getStatusStyles()}`}>
                  {isOffline && <WifiOff size={28} />}
                  {!isOffline && status === "CLEAN" && <CheckCircle size={28} />}
                  {!isOffline && status === "DIRTY" && <AlertTriangle size={28} className="animate-pulse" />}
                  {!isOffline && status === "VERIFYING" && <Clock size={28} className="animate-spin-slow" />}
                  
                  <span className="text-lg md:text-xl font-bold tracking-wide">
                    {isOffline && "HARDWARE OFFLINE"}
                    {!isOffline && status === "CLEAN" && "TOILET IS CLEAN"}
                    {!isOffline && status === "DIRTY" && "CLEANING REQUIRED"}
                    {!isOffline && status === "VERIFYING" && "VERIFYING CLEAN..."}
                  </span>
                </div>

                {/* Gas Level Gauge */}
                <div className={`flex flex-col items-center justify-center py-8 ${isOffline ? 'opacity-40 grayscale' : ''}`}>
                  <Wind size={56} className={`mb-4 ${getGaugeColor()} transition-colors duration-500`} />
                  <div className={`text-7xl md:text-8xl font-black ${getGaugeColor()} transition-colors duration-500 tracking-tighter`}>
                    {gasLevel}
                  </div>
                  <div className={`font-bold mt-2 uppercase tracking-widest text-sm md:text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Parts Per Million (PPM)
                  </div>
                  <div className={`text-xs mt-2 font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Threshold: {THRESHOLD} | Clean Reset: {CLEAN_THRESHOLD}
                  </div>
                </div>

                {/* Action Button */}
                <div className={`pt-6 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  {status === "CLEAN" && (
                    <div className={`text-center text-sm italic font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isOffline ? "Monitoring suspended." : "Monitoring active. No action required."}
                    </div>
                  )}
                  
                  {status === "DIRTY" && !isOffline && (
                    <button 
                      onClick={handleCleaned}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 md:py-5 px-6 rounded-xl shadow-lg shadow-blue-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2 text-lg"
                    >
                      <CheckCircle size={24} />
                      I Have Cleaned It
                    </button>
                  )}

                  {status === "VERIFYING" && (
                    <div className={`text-center rounded-xl p-4 border ${isDarkMode ? 'bg-amber-900/20 border-amber-800/50' : 'bg-amber-50 border-amber-100'}`}>
                      <p className={`font-bold text-lg ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>Grace Period Active</p>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-amber-400/80' : 'text-amber-600/80'}`}>Waiting for sensor levels to drop below {CLEAN_THRESHOLD}...</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: DEV CONTROLS & DOCS ================= */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Dev Controls */}
            <div className={`rounded-2xl shadow-lg border p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`flex items-center gap-2 border-b pb-3 mb-5 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <Settings size={20} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Testing & Simulation</h2>
              </div>
              
              <div className={`flex items-center justify-between mb-6 p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                <div>
                  <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Test Mode Timers</p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Accelerates logic to seconds</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isTestMode} onChange={() => setIsTestMode(!isTestMode)} />
                  <div className={`w-14 h-7 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <button onClick={() => simulateGasLevel(450)} className={`flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition-colors text-sm border ${isDarkMode ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-900/50' : 'bg-red-100 hover:bg-red-200 text-red-700 border-red-200'}`}>
                  <Beaker size={18} /> Make Dirty
                </button>
                <button onClick={() => simulateGasLevel(100)} className={`flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition-colors text-sm border ${isDarkMode ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-200'}`}>
                  <CheckCircle size={18} /> Make Clean
                </button>
              </div>

              <p className={`font-bold mb-3 text-sm mt-6 border-t pt-5 ${isDarkMode ? 'text-slate-300 border-slate-800' : 'text-slate-700 border-slate-100'}`}>Edge Cases:</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={forceOffline} className={`flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition-colors text-sm border ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}>
                  <WifiOff size={18} /> Drop Wi-Fi
                </button>
                <button onClick={handleForceClean} className={`flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition-colors text-sm border ${isDarkMode ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-900/50' : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200'}`}>
                  <ShieldAlert size={18} /> Force Clean
                </button>
              </div>
            </div>

            {/* Architecture Docs */}
            <div className={`rounded-2xl shadow-xl border p-6 h-full ${isDarkMode ? 'bg-black border-slate-800 text-slate-300' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
              <div className="flex items-center gap-2 border-b border-slate-700 pb-3 mb-5">
                <Info size={20} className="text-blue-400" />
                <h2 className="text-lg font-bold text-white">System Architecture</h2>
              </div>
              
              <div className="space-y-5 text-sm leading-relaxed">
                <div>
                  <h3 className="text-white font-bold mb-1">Hardware Layer</h3>
                  <p className="text-slate-400">An <span className="text-blue-400 font-mono">ESP8266</span> MCU interfaces with an <span className="text-blue-400 font-mono">MQ-135</span> gas sensor to detect Ammonia (NH₃) and Hydrogen Sulfide (H₂S) anomalies. Telemetry is pushed over Wi-Fi.</p>
                </div>
                
                <div>
                  <h3 className="text-white font-bold mb-1">Escalation Matrix</h3>
                  <ul className="list-none space-y-2 mt-2">
                    <li className="flex gap-2 items-start"><span className="text-red-400 font-bold mt-0.5">•</span><span className="text-slate-400">Immediate alert dispatched to cleaning staff when PPM {'>'} {THRESHOLD}.</span></li>
                    <li className="flex gap-2 items-start"><span className="text-amber-400 font-bold mt-0.5">•</span><span className="text-slate-400">Timeout validation ensures reported "Clean" statuses are verified.</span></li>
                    <li className="flex gap-2 items-start"><span className="text-blue-400 font-bold mt-0.5">•</span><span className="text-slate-400">Unhandled exceptions (30 mins) trigger escalation to Hall Management.</span></li>
                  </ul>
                </div>

                <div className="border-t border-slate-800 pt-5 mt-2">
                  <h3 className="text-blue-400 font-bold mb-2">Edge Case Handling</h3>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                    <li><strong className="text-slate-300">Hysteresis:</strong> Requires PPM to drop to {CLEAN_THRESHOLD} to prevent alert spam.</li>
                    <li><strong className="text-slate-300">Heartbeat:</strong> Tracks data timestamps. Triggers an offline warning if hardware drops off Wi-Fi.</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}