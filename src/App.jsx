import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { AlertTriangle, CheckCircle, Clock, Wind, Settings, Info, Beaker, WifiOff, ShieldAlert, Moon, Sun } from 'lucide-react';

// ==========================================
// 1. STABLE CONFIGURATION (HARDCODED)
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

// New Revoked Telegram Credentials
const BOT_TOKEN = '8459102439:AAGVujkyrMaCBXY54wUSdr2nF89EJAl8Kg8';
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

const alertBoth = (msg) => {
  sendTelegramAlert(CHAT_ID_CLEANER, msg);
  sendTelegramAlert(CHAT_ID_CHAIRPERSON, msg);
};

// ==========================================
// 2. MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [gasLevel, setGasLevel] = useState(0);
  const [status, setStatus] = useState("CLEAN"); 
  const [isTestMode, setIsTestMode] = useState(false); 
  const [isOffline, setIsOffline] = useState(false); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [isEscalated, setIsEscalated] = useState(false); 
  const [dirtyStartTime, setDirtyStartTime] = useState(null);
  const [offlineStartTime, setOfflineStartTime] = useState(null);

  const escalationTimer = useRef(null);
  const graceTimer = useRef(null);
  const lastSeenRef = useRef(Date.now()); 
  const wasOfflineRef = useRef(false);

  const GRACE_PERIOD_MS = isTestMode ? 10 * 1000 : 10 * 60 * 1000; 
  const ESCALATION_PERIOD_MS = isTestMode ? 30 * 1000 : 30 * 60 * 1000; 
  const OFFLINE_TIMEOUT_MS = isTestMode ? 20 * 1000 : 5 * 60 * 1000; 

  useEffect(() => {
    const sensorRef = ref(db, 'sensorData/gasLevel');
    
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const currentGas = snapshot.val() || 0;
      setGasLevel(currentGas);
      
      // Hardware Reconnection Logic
      if (wasOfflineRef.current) {
        const downtime = Date.now() - (offlineStartTime || Date.now());
        const duration = isTestMode ? Math.floor(downtime/1000) : Math.floor(downtime/60000);
        const unit = isTestMode ? "seconds" : "minutes";
        
        alertBoth(`✅ SYSTEM RESTORED: Connection to Toilet 1 hardware re-established. \n\n⏱️ Total System Downtime: ${duration} ${unit}.`);
        wasOfflineRef.current = false;
        setIsOffline(false);
        setOfflineStartTime(null);
      }

      lastSeenRef.current = Date.now();

      // Trigger Logic: Air Quality Drop
      if (currentGas > THRESHOLD && status === "CLEAN") {
        setStatus("DIRTY");
        setDirtyStartTime(Date.now()); 
        setIsEscalated(false);
        sendTelegramAlert(CHAT_ID_CLEANER, "🚨 ACTION REQUIRED: Toilet 1 air quality has dropped! Please sanitize immediately.");
        
        escalationTimer.current = setTimeout(() => {
          setIsEscalated(true); 
          sendTelegramAlert(CHAT_ID_CHAIRPERSON, "⚠️ ESCALATION ALERT: Toilet 1 has been dirty for 30 minutes. Management intervention required.");
        }, ESCALATION_PERIOD_MS);
      }
      
      // Resolution Logic (Hysteresis applied)
      if (currentGas <= CLEAN_THRESHOLD && status !== "CLEAN") {
        if (isEscalated && dirtyStartTime) {
          const timeDiff = Date.now() - dirtyStartTime;
          const duration = isTestMode ? Math.floor(timeDiff / 1000) : Math.floor(timeDiff / 60000);
          const unit = isTestMode ? "seconds" : "minutes";
          sendTelegramAlert(CHAT_ID_CHAIRPERSON, `✅ INCIDENT RESOLVED: Toilet 1 air quality restored.\n\n⏱️ Time to Resolution: ${duration} ${unit}.`);
        }
        setStatus("CLEAN");
        setIsEscalated(false);
        setDirtyStartTime(null);
        clearTimeout(escalationTimer.current);
        clearTimeout(graceTimer.current);
      }
    });

    const offlineChecker = setInterval(() => {
      const timeSinceLastSeen = Date.now() - lastSeenRef.current;
      if (timeSinceLastSeen > OFFLINE_TIMEOUT_MS && !wasOfflineRef.current) {
        setIsOffline(true);
        wasOfflineRef.current = true;
        setOfflineStartTime(Date.now());
        alertBoth("🚨 SYSTEM FAILURE: Connection lost with Toilet 1 hardware. Monitoring suspended.");
      }
    }, 1000);

    return () => { 
      unsubscribe(); 
      clearInterval(offlineChecker);
    };
  }, [status, isTestMode, isEscalated, dirtyStartTime, isOffline, offlineStartTime]);

  const handleCleaned = () => {
    setStatus("VERIFYING");
    graceTimer.current = setTimeout(() => {
      setStatus((currentStatus) => {
        if (currentStatus === "VERIFYING") {
          sendTelegramAlert(CHAT_ID_CLEANER, "❌ VERIFICATION FAILED: Gas levels remain critical after reported cleaning.");
          return "DIRTY";
        }
        return currentStatus;
      });
    }, GRACE_PERIOD_MS);
  };

  const simulateGasLevel = (level) => {
    set(ref(db, 'sensorData/gasLevel'), level);
  };

  const handleForceClean = () => {
    setStatus("CLEAN");
    setIsEscalated(false);
    simulateGasLevel(100); 
    sendTelegramAlert(CHAT_ID_CHAIRPERSON, "🛠️ ADMIN OVERRIDE: System manually reset to CLEAN state.");
  };

  const forceOffline = () => {
    lastSeenRef.current = Date.now() - OFFLINE_TIMEOUT_MS - 5000;
  };

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
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className="p-4 md:p-6 lg:p-8 flex flex-col items-center">
        
        <div className="w-full max-w-6xl flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Wind size={26} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Hostel Monitor</h1>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>UNILAG Computer Science | Group 7</p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>CSC419 Project</p>
            </div>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-full border transition-transform active:scale-90 ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-200'}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-7">
            <div className={`rounded-2xl shadow-xl overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 text-white text-center border-b ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-800'}`}>
                <h2 className="text-2xl font-bold tracking-tight">Facility Overview</h2>
                <p className="text-slate-400 text-sm mt-1">H₂S & NH₃ concentration monitoring</p>
              </div>

              <div className="p-8 space-y-6">
                {isOffline && (
                  <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg flex items-start gap-3 border-2 border-slate-600 animate-pulse">
                    <WifiOff className="shrink-0 mt-1 text-red-400" size={24} />
                    <div>
                      <p className="font-bold text-lg">Hardware Module Offline</p>
                      <p className="text-sm text-slate-400">Connection to the sensor node has been lost. System is in failover mode.</p>
                    </div>
                  </div>
                )}

                {!isOffline && isEscalated && (
                  <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg flex items-start gap-3 animate-pulse border-2 border-red-800">
                    <AlertTriangle className="shrink-0 mt-1" size={24} />
                    <div>
                      <p className="font-bold text-lg uppercase tracking-wide">Critical Warning</p>
                      <p className="text-sm mt-1">Inability to sanitize facility under 30 minutes. Management intervention required.</p>
                    </div>
                  </div>
                )}

                <div className={`rounded-xl border p-5 flex items-center justify-center gap-3 transition-colors shadow-inner ${getStatusStyles()}`}>
                  {isOffline ? <WifiOff size={28} /> : status === "CLEAN" ? <CheckCircle size={28} /> : status === "DIRTY" ? <AlertTriangle size={28} className="animate-pulse" /> : <Clock size={28} className="animate-spin-slow" />}
                  <span className="text-xl font-bold tracking-tight">
                    {isOffline ? "NODE DISCONNECTED" : status === "CLEAN" ? "FACILITY IS CLEAN" : status === "DIRTY" ? "SANITIZATION REQUIRED" : "VERIFYING..."}
                  </span>
                </div>

                <div className={`flex flex-col items-center justify-center py-8 ${isOffline ? 'opacity-30' : ''}`}>
                  <Wind size={56} className={`mb-4 ${getGaugeColor()}`} />
                  <div className={`text-8xl font-black ${getGaugeColor()} tracking-tighter`}>{gasLevel}</div>
                  <div className={`font-bold mt-2 uppercase tracking-widest text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Parts Per Million (PPM)</div>
                </div>

                <div className={`pt-6 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  {status === "DIRTY" && !isOffline && (
                    <button onClick={handleCleaned} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-lg">
                      <CheckCircle size={24} /> Register Completion
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className={`rounded-2xl shadow-lg border p-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`flex items-center gap-2 border-b pb-3 mb-5 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <Settings size={20} className="text-slate-500" />
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Simulation Suite</h2>
              </div>
              
              <div className={`flex items-center justify-between mb-6 p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                <p className="font-bold text-sm">Test Mode (Seconds)</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isTestMode} onChange={() => setIsTestMode(!isTestMode)} />
                  <div className={`w-14 h-7 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-full ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={() => simulateGasLevel(450)} className={`font-bold py-3 rounded-xl text-sm border ${isDarkMode ? 'bg-red-500/20 text-red-400 border-red-900/50' : 'bg-red-100 text-red-700 border-red-200'}`}>Make Dirty</button>
                <button onClick={() => simulateGasLevel(100)} className={`font-bold py-3 rounded-xl text-sm border ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-900/50' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>Make Clean</button>
                <button onClick={forceOffline} className={`font-bold py-3 rounded-xl text-sm border flex items-center justify-center gap-2 ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}><WifiOff size={16}/> Drop Node</button>
                <button onClick={handleForceClean} className={`font-bold py-3 rounded-xl text-sm border ${isDarkMode ? 'bg-blue-500/20 text-blue-400 border-blue-900/50' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>Admin Reset</button>
              </div>
            </div>

            <div className={`rounded-2xl p-6 h-full ${isDarkMode ? 'bg-black border border-slate-800 text-slate-400' : 'bg-slate-900 text-slate-300'}`}>
              <div className="flex items-center gap-2 border-b border-slate-700 pb-3 mb-5">
                <Info size={20} className="text-blue-400" />
                <h2 className="text-lg font-bold text-white">System Logs</h2>
              </div>
              <ul className="space-y-4 text-xs">
                <li className="flex justify-between border-b border-slate-800 pb-2"><span>Network Status:</span> <span className={isOffline ? "text-red-500 font-bold" : "text-emerald-500"}>{isOffline ? "CRITICAL FAILURE" : "STABLE FEED"}</span></li>
                <li className="flex justify-between border-b border-slate-800 pb-2"><span>Logic Strategy:</span> <span>Hysteresis v2.1</span></li>
                <li className="flex justify-between"><span>Architecture:</span> <span>Real-time WebSocket</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}