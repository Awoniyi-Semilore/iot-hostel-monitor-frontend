import React, { useState, useEffect, useRef } from 'react';
import { Wind, Wifi, WifiOff, AlertTriangle, RefreshCw, Activity, MapPin, Zap, MessageSquare, Bell, ShieldCheck, Cpu, Database, Smartphone, Sparkles, Timer, Clock, ArrowRight, Loader2, Server } from 'lucide-react';

export default function App() {
  const [data, setData] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('monitor'); 
  
  // --- SYSTEM BOOT STATE (Cold Start Mitigation) ---
  const [isBooting, setIsBooting] = useState(true);
  const [bootMessage, setBootMessage] = useState("Initializing system architecture...");
  const bootAttempts = useRef(0);

  // Alerts & Escalation
  const [dirtyStartTime, setDirtyStartTime] = useState(null);
  const [alertStatus, setAlertStatus] = useState('Idle');

  // Status Duration Tracker
  const [currentPhase, setCurrentPhase] = useState('unknown'); 
  const [phaseStartTime, setPhaseStartTime] = useState(Date.now());
  const [durationText, setDurationText] = useState('Calculating status duration...');

  // Maintenance Override State
  const [maintenanceEndTime, setMaintenanceEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const BASE_URL = "https://auracheck.fly.dev/api";
  const READINGS_URL = `${BASE_URL}/readings`;
  const PROXY = "https://api.allorigins.win/get?url=";

  const TELEGRAM_BOT_TOKEN = "8459102439:AAGVujkyrMaCBXY54wUSdr2nF89EJAl8Kg8"; 
  const TELEGRAM_CHAT_ID = "6843708383";    

  const sendTelegramAlert = async (message) => {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: `🚨 AURA_ALERT: ${message}` })
      });
      setAlertStatus('Escalated to Hall Mistress');
    } catch (e) { console.error("Telegram fail", e); }
  };

  // --- MAINTENANCE COUNTDOWN LOGIC ---
  const startMaintenance = () => {
    const overrideMinutes = 45;
    const endTime = Date.now() + overrideMinutes * 60 * 1000;
    setMaintenanceEndTime(endTime);
    setTimeLeft(overrideMinutes * 60);
    setIsLive(false); 
  };

  const cancelMaintenance = () => {
    setMaintenanceEndTime(null);
    setTimeLeft(0);
    fetchData(); 
  };

  useEffect(() => {
    let timer;
    if (maintenanceEndTime) {
      timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((maintenanceEndTime - now) / 1000));
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          setMaintenanceEndTime(null);
          fetchData(); 
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [maintenanceEndTime]);

  // --- API FETCH LOGIC ---
  const fetchData = async () => {
    if (maintenanceEndTime && Date.now() < maintenanceEndTime) return;

    setLoading(true);
    try {
      const response = await fetch(`${PROXY}${encodeURIComponent(READINGS_URL)}`);
      if (!response.ok) throw new Error(`Proxy Error: ${response.status}`);
      
      const wrapper = await response.json();
      const result = JSON.parse(wrapper.contents); 
      
      if (result.success && result.data && result.data.length > 0) {
        const latest = result.data[0];
        setData(latest);
        setLastSync(new Date());
        setError(null);
        setIsLive(true);
        setIsBooting(false); // Successfully connected, turn off boot screen!

        const isCurrentlyDirty = latest.status === 'moderate' || latest.status === 'critical';
        
        const newPhase = isCurrentlyDirty ? 'dirty' : 'clean';
        if (currentPhase !== newPhase) {
          setCurrentPhase(newPhase);
          setPhaseStartTime(Date.now()); 
        }

        if (isCurrentlyDirty) {
          if (!dirtyStartTime) {
            setDirtyStartTime(Date.now());
            setAlertStatus('SMS Sent to Cleaner');
          } else {
            const minutesDirty = (Date.now() - dirtyStartTime) / 60000;
            if (minutesDirty >= 15 && alertStatus !== 'Escalated to Hall Mistress') {
              sendTelegramAlert(`Location ${latest.location} is still ${latest.status.toUpperCase()} (${latest.raw_value} PPM) after 15 minutes. Urgent check required.`);
            }
          }
        } else {
          setDirtyStartTime(null);
          setAlertStatus('Idle');
        }
      } else {
        throw new Error("No recent readings found.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      
      // Cold Start Mitigation Logic
      if (isBooting && bootAttempts.current < 8) { // Try for ~2 minutes (8 * 15s)
        bootAttempts.current += 1;
        if (bootAttempts.current === 1) setBootMessage("Waking up Fly.io cloud servers...");
        if (bootAttempts.current === 3) setBootMessage("Establishing secure sensor uplink...");
        if (bootAttempts.current === 5) setBootMessage("Awaiting first telemetry packet...");
      } else {
        setIsBooting(false);
        setIsLive(false);
        setError("Connection timeout. Backend server unreachable.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- TIMERS ---
  useEffect(() => {
    fetchData(); 
    const interval = setInterval(() => {
      fetchData();
    }, 15000); 
    return () => clearInterval(interval);
  }, [alertStatus, dirtyStartTime, maintenanceEndTime, currentPhase, isBooting]);

  useEffect(() => {
    const updateText = () => {
      if (currentPhase === 'unknown') return;
      const mins = Math.floor((Date.now() - phaseStartTime) / 60000);
      setDurationText(`The facility has been ${currentPhase} for ${mins} minute${mins !== 1 ? 's' : ''} so far.`);
    };
    updateText(); 
    const minInterval = setInterval(updateText, 60000);
    return () => clearInterval(minInterval);
  }, [currentPhase, phaseStartTime]);

  // --- UI HELPERS ---
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const status = data?.status?.toLowerCase() || 'unknown';
  const isMaintenance = maintenanceEndTime !== null;
  
  const getStatusColor = () => {
    if (isMaintenance) return 'text-purple-400';
    if (!isLive) return 'text-slate-600';
    switch (status) {
      case 'fresh': return 'text-cyan-400';
      case 'normal': return 'text-emerald-400';
      case 'moderate': return 'text-orange-400';
      case 'critical': return 'text-red-500';
      default: return 'text-emerald-400';
    }
  };

  const getGlowColor = () => {
    if (isMaintenance) return 'bg-purple-600';
    if (!isLive) return 'bg-slate-800';
    switch (status) {
      case 'fresh': return 'bg-cyan-500';
      case 'normal': return 'bg-emerald-500';
      case 'moderate': return 'bg-orange-500';
      case 'critical': return 'bg-red-600';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center py-8 px-4 overflow-x-hidden selection:bg-blue-500/30">
      
      {/* Navigation Switch */}
      <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10 relative z-20">
        <button onClick={() => setView('monitor')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'monitor' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Monitor</button>
        <button onClick={() => setView('summary')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'summary' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Project Summary</button>
      </div>

      {view === 'monitor' ? (
        <div className="max-w-md w-full space-y-6 relative z-10">
          
          {/* BOOT SEQUENCE OVERLAY */}
          {isBooting ? (
            <div className="bg-slate-900/80 border border-blue-500/30 rounded-[3.5rem] p-12 text-center animate-in fade-in zoom-in duration-700 shadow-[0_0_50px_rgba(59,130,246,0.15)] mt-12">
              <div className="relative mx-auto w-24 h-24 mb-8">
                <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin duration-1000"></div>
                <div className="absolute inset-2 border-r-2 border-cyan-400 rounded-full animate-spin duration-700 reverse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Server className="text-blue-400 animate-pulse" size={32} />
                </div>
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-blue-400 mb-3">System Booting</h2>
              <div className="h-6 flex items-center justify-center">
                <p className="text-xs font-mono text-slate-400 animate-pulse">{bootMessage}</p>
              </div>
              <div className="mt-8 bg-blue-950/30 rounded-full h-1.5 w-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-[progress_2s_ease-in-out_infinite] w-1/3"></div>
              </div>
            </div>
          ) : (
            /* --- NORMAL MONITOR VIEW --- */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Status Header */}
              <div className={`flex justify-between items-center p-4 rounded-3xl border backdrop-blur-xl transition-all ${isMaintenance ? 'bg-purple-500/10 border-purple-500/30' : isLive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-2xl ${isMaintenance ? 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : isLive ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-red-500'}`}>
                    {isMaintenance ? <Timer size={20} className="animate-pulse text-white" /> : isLive ? <Activity size={20} className="animate-pulse" /> : <WifiOff size={20} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">System Health</p>
                    <h2 className={`text-sm font-bold tracking-tight ${isMaintenance ? 'text-purple-400' : isLive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isMaintenance ? 'SENSOR OVERRIDE ACTIVE' : isLive ? 'AURA_NODE_01 ACTIVE' : 'CONNECTION LOST'}
                    </h2>
                  </div>
                </div>
                {!isMaintenance && (
                  <button onClick={fetchData} className={`p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors ${loading ? 'animate-spin' : ''}`}><RefreshCw size={18} /></button>
                )}
              </div>

              {/* Main Monitor Display */}
              <div className={`text-center py-12 px-8 rounded-[3.5rem] border shadow-2xl relative overflow-hidden transition-all duration-700 ${isMaintenance ? 'bg-purple-950/20 border-purple-500/20' : 'bg-slate-900/40 border-white/5'}`}>
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 blur-[100px] rounded-full opacity-20 transition-colors duration-1000 ${getGlowColor()}`} />
                <div className="relative z-10">
                  
                  {isMaintenance ? (
                    <div className="animate-in fade-in zoom-in duration-500">
                      <Sparkles className="mx-auto mb-4 text-purple-400" size={56} />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300 mb-2">Chemical Override Countdown</p>
                      <h1 className="text-7xl font-black font-mono italic tracking-tighter mb-4 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                        {formatTime(timeLeft)}
                      </h1>
                      <p className="text-xs text-purple-200/60 leading-relaxed max-w-[250px] mx-auto mb-6">
                        API disconnected to prevent false alerts from air fresheners/bleach. System will auto-resume.
                      </p>
                      <button 
                        onClick={cancelMaintenance}
                        className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 text-xs font-bold uppercase tracking-widest py-2 px-6 rounded-xl transition-colors"
                      >
                        Resume Now
                      </button>
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-500">
                      <Wind className={`mx-auto mb-6 transition-all duration-700 ${getStatusColor()}`} size={64} />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Air Quality Status</p>
                      <h1 className={`text-6xl font-black italic uppercase tracking-tighter mb-6 transition-colors duration-500 ${getStatusColor()}`}>
                        {isLive ? status : '----'}
                      </h1>
                      <div className="bg-black/40 backdrop-blur-xl rounded-2xl py-3 px-6 inline-flex items-center gap-2 border border-white/5 shadow-inner">
                        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                        <p className="text-sm font-bold tracking-tight">{isLive ? `Updated ${lastSync?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'OFFLINE'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Duration Tracker */}
              {!isMaintenance && currentPhase !== 'unknown' && isLive && (
                <div className="bg-slate-900/60 border border-white/5 p-5 rounded-[2rem] flex items-start gap-4 animate-in slide-in-from-bottom-4">
                  <Clock className={currentPhase === 'dirty' ? 'text-orange-500 shrink-0 mt-0.5' : 'text-emerald-500 shrink-0 mt-0.5'} size={20} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Status Duration</p>
                    <p className={`text-sm font-medium ${currentPhase === 'dirty' ? 'text-orange-100' : 'text-emerald-100'}`}>
                      {durationText}
                    </p>
                  </div>
                </div>
              )}

              {/* Maintenance / Chemical Spray Button */}
              {!isMaintenance && isLive && (
                 <button 
                   onClick={startMaintenance}
                   className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 p-4 rounded-[2rem] flex items-center justify-between group transition-all"
                 >
                   <div className="flex items-center gap-3 text-indigo-400">
                     <div className="bg-indigo-500/20 p-2 rounded-xl group-hover:bg-indigo-500/40 transition-colors">
                       <Sparkles size={18} />
                     </div>
                     <div className="text-left">
                       <p className="text-sm font-bold">Maintenance / Spray Override</p>
                       <p className="text-[10px] text-indigo-300/60 uppercase tracking-widest font-black mt-0.5">Pause sensors for 45 mins</p>
                     </div>
                   </div>
                   <ArrowRight size={18} className="text-indigo-500/50 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                 </button>
              )}

              {/* Metadata Grid */}
              {!isMaintenance && isLive && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-white/5">
                    <div className="flex items-center gap-2 mb-3 opacity-40 text-blue-400"><MapPin size={14} /><p className="text-[10px] font-black uppercase tracking-widest">Location</p></div>
                    <p className="text-xs font-bold truncate">{data?.location || 'Unknown'}</p>
                  </div>
                  <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-white/5">
                    <div className="flex items-center gap-2 mb-3 opacity-40 text-blue-400"><Zap size={14} /><p className="text-[10px] font-black uppercase tracking-widest">Sensor Reading</p></div>
                    <p className="text-sm font-bold">{data?.raw_value || 0} <span className="text-[10px] opacity-40 ml-1 font-mono">PPM</span></p>
                  </div>
                </div>
              )}

              {/* Error Diagnostics */}
              {error && !isMaintenance && !isLive && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-3xl flex gap-3 animate-in fade-in">
                  <AlertTriangle className="text-red-500 shrink-0" size={18} />
                  <p className="text-[10px] text-red-200/60 uppercase font-black leading-tight tracking-widest">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* --- ENHANCED PROJECT SUMMARY VIEW --- */
        <div className="max-w-3xl w-full space-y-12 animate-in slide-in-from-right-8 duration-500 pb-16">
          
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Project AuraCheck</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px]">An intelligent IoT Hygiene & Sanitation Architecture</p>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5"><Wind size={120} /></div>
             <h3 className="flex items-center gap-3 font-black uppercase text-sm tracking-[0.2em] mb-4 text-blue-400">
               <AlertTriangle size={18} /> The Catalyst
             </h3>
             <p className="text-sm text-slate-300 leading-relaxed font-medium">
               Traditional university hostel cleaning schedules (like those in JAJA Hall, Unilag) are highly reactive. Cleaners operate on fixed timetables rather than actual necessity. This leads to prolonged exposure to high ammonia and VOC (Volatile Organic Compound) levels in communal washrooms, posing severe health and comfort risks to students. AuraCheck was born to shift sanitation from a "scheduled" task to a "data-driven" necessity.
             </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/10 transition-colors">
              <div className="bg-indigo-500/10 p-4 w-fit rounded-2xl text-indigo-400"><Cpu size={28} /></div>
              <h3 className="font-black uppercase text-xs tracking-widest text-white">Hardware Layer</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Powered by a NodeMCU (ESP8266) microcontroller interfaced with an array of MQ-135 sensors. The sensors are specifically calibrated to detect Ammonia (NH3) and other human-waste byproducts, pushing raw analog data via Wi-Fi to the cloud every 15 seconds.
              </p>
            </div>

            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/10 transition-colors">
              <div className="bg-emerald-500/10 p-4 w-fit rounded-2xl text-emerald-400"><Database size={28} /></div>
              <h3 className="font-black uppercase text-xs tracking-widest text-white">Cloud API & Logic</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                A custom FastAPI backend deployed globally on Fly.io. It handles data ingestion, PostgreSQL storage, and complex threshold logic (Normal, Moderate, Critical). It prevents spam by enforcing "cooldown" periods between alerts.
              </p>
            </div>

            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/10 transition-colors">
              <div className="bg-orange-500/10 p-4 w-fit rounded-2xl text-orange-400"><Smartphone size={28} /></div>
              <h3 className="font-black uppercase text-xs tracking-widest text-white">Escalation Protocol</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                When thresholds are breached, the system initiates a Twilio SMS to the assigned cleaner. If the status remains "Critical" for 15+ minutes, the system autonomously escalates the issue by pinging the Hall Master/Mistress via a Telegram Bot API integration.
              </p>
            </div>

            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/10 transition-colors">
              <div className="bg-purple-500/10 p-4 w-fit rounded-2xl text-purple-400"><Sparkles size={28} /></div>
              <h3 className="font-black uppercase text-xs tracking-widest text-white">Edge Case Handling</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                <strong>The Bleach Dilemma:</strong> Cleaning agents release heavy VOCs, causing false "Dirty" alarms. AuraCheck features a 45-minute "Maintenance Override" that temporarily isolates the API polling to allow chemical vapors to dissipate post-cleaning.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Signature */}
      <div className="text-center opacity-40 py-8 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-2 text-white">Designed & Engineered by Group 7 students for CSCS419 Project</p>
        <p className="text-[9px] font-mono text-slate-400">University of Lagos • Smart Campus Initiative • v3.5</p>
      </div>
    </div>
  );
}
