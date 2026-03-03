import React, { useState, useEffect, useRef } from 'react';
import { Wind, Wifi, WifiOff, AlertTriangle, RefreshCw, Activity, MapPin, Zap, MessageSquare, Bell, ShieldCheck, Cpu, Database, Smartphone, Sparkles, Timer, Clock, ArrowRight, Loader2, Server } from 'lucide-react';

export default function App() {
  const [data, setData] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('monitor'); 
  
  // --- SYSTEM BOOT STATE ---
  const [isBooting, setIsBooting] = useState(true);
  const [bootMessage, setBootMessage] = useState("Initializing system architecture...");
  const bootAttempts = useRef(0);
  const proxyIndex = useRef(0);

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
  
  // Multiple proxies to prevent "Failed to fetch" due to rate limits
  const PROXIES = [
    "https://api.allorigins.win/get?url=",
    "https://corsproxy.io/?",
    "https://thingproxy.freeboard.io/fetch/"
  ];

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

  const fetchData = async () => {
    if (maintenanceEndTime && Date.now() < maintenanceEndTime) return;

    setLoading(true);
    const currentProxy = PROXIES[proxyIndex.current % PROXIES.length];
    const targetUrl = `${currentProxy}${encodeURIComponent(READINGS_URL)}`;

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`Gateway Error: ${response.status}`);
      
      const wrapper = await response.json();
      // Logic for different proxy response structures
      let rawData = wrapper.contents || wrapper;
      if (typeof rawData === 'string') rawData = JSON.parse(rawData);
      
      const result = rawData; 
      
      if (result.success && result.data && result.data.length > 0) {
        const latest = result.data[0];
        setData(latest);
        setLastSync(new Date());
        setError(null);
        setIsLive(true);
        setIsBooting(false); 

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
              sendTelegramAlert(`Location ${latest.location} is still ${latest.status.toUpperCase()} (${latest.raw_value} PPM) after 15 minutes.`);
            }
          }
        } else {
          setDirtyStartTime(null);
          setAlertStatus('Idle');
        }
      } else {
        throw new Error("No data in response.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      
      // Rotate proxy for the next attempt
      proxyIndex.current += 1;

      if (isBooting && bootAttempts.current < 12) { 
        bootAttempts.current += 1;
        if (bootAttempts.current === 1) setBootMessage("Waking up Fly.io cloud servers...");
        if (bootAttempts.current === 4) setBootMessage("Retrying via secondary gateway...");
        if (bootAttempts.current === 8) setBootMessage("Establishing secure sensor uplink...");
      } else if (!isBooting) {
        setIsLive(false);
        setError("Telemetry interrupted. System attempting reconnect...");
      } else {
        setIsBooting(false);
        setIsLive(false);
        setError("Critical Connection Failure. Check Backend Status.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); 
    const interval = setInterval(fetchData, 15000); 
    return () => clearInterval(interval);
  }, [currentPhase, isBooting]);

  useEffect(() => {
    const updateText = () => {
      if (currentPhase === 'unknown') return;
      const mins = Math.floor((Date.now() - phaseStartTime) / 60000);
      setDurationText(`Facility has been ${currentPhase} for ${mins} minute${mins !== 1 ? 's' : ''}.`);
    };
    updateText(); 
    const minInterval = setInterval(updateText, 60000);
    return () => clearInterval(minInterval);
  }, [currentPhase, phaseStartTime]);

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
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center py-8 px-4 overflow-x-hidden">
      
      <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10 relative z-20">
        <button onClick={() => setView('monitor')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'monitor' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Monitor</button>
        <button onClick={() => setView('summary')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'summary' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Summary</button>
      </div>

      {view === 'monitor' ? (
        <div className="max-w-md w-full space-y-6 relative z-10">
          
          {isBooting ? (
            <div className="bg-slate-900/80 border border-blue-500/30 rounded-[3.5rem] p-12 text-center animate-in fade-in zoom-in duration-700 shadow-[0_0_50px_rgba(59,130,246,0.15)] mt-12">
              <div className="relative mx-auto w-24 h-24 mb-8">
                <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin duration-1000"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Server className="text-blue-400 animate-pulse" size={32} />
                </div>
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-blue-400 mb-3">System Booting</h2>
              <p className="text-xs font-mono text-slate-400 h-4">{bootMessage}</p>
              <div className="mt-8 bg-blue-950/30 rounded-full h-1 w-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-[progress_3s_ease-in-out_infinite] w-1/3"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className={`flex justify-between items-center p-4 rounded-3xl border transition-all ${isMaintenance ? 'bg-purple-500/10 border-purple-500/30' : isLive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-2xl ${isMaintenance ? 'bg-purple-500' : isLive ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {isMaintenance ? <Timer size={20} className="text-white" /> : isLive ? <Activity size={20} className="animate-pulse" /> : <WifiOff size={20} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">System Health</p>
                    <h2 className="text-sm font-bold tracking-tight">
                      {isMaintenance ? 'OVERRIDE ACTIVE' : isLive ? 'NODE_01 ACTIVE' : 'RECONNECTING...'}
                    </h2>
                  </div>
                </div>
                <button onClick={fetchData} className={`p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors ${loading ? 'animate-spin' : ''}`}><RefreshCw size={18} /></button>
              </div>

              <div className={`text-center py-12 px-8 rounded-[3.5rem] border shadow-2xl relative overflow-hidden transition-all duration-700 ${isMaintenance ? 'bg-purple-950/20 border-purple-500/20' : 'bg-slate-900/40 border-white/5'}`}>
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 blur-[100px] rounded-full opacity-20 transition-colors duration-1000 ${getGlowColor()}`} />
                <div className="relative z-10">
                  {isMaintenance ? (
                    <div className="animate-in fade-in zoom-in duration-500">
                      <Sparkles className="mx-auto mb-4 text-purple-400" size={56} />
                      <h1 className="text-7xl font-black font-mono italic tracking-tighter mb-4 text-purple-400">{formatTime(timeLeft)}</h1>
                      <button onClick={cancelMaintenance} className="bg-purple-500/20 border border-purple-500/50 text-purple-300 text-xs font-bold uppercase py-2 px-6 rounded-xl">Resume Now</button>
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-500">
                      <Wind className={`mx-auto mb-6 transition-all duration-700 ${getStatusColor()}`} size={64} />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Air Quality</p>
                      <h1 className={`text-6xl font-black italic uppercase tracking-tighter mb-6 ${getStatusColor()}`}>{isLive ? status : '----'}</h1>
                      <div className="bg-black/40 backdrop-blur-xl rounded-2xl py-3 px-6 inline-flex items-center gap-2 border border-white/5">
                        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                        <p className="text-sm font-bold">{isLive ? `Live @ ${lastSync?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'OFFLINE'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isMaintenance && isLive && (
                <div className="bg-slate-900/60 border border-white/5 p-5 rounded-[2rem] flex items-start gap-4 animate-in slide-in-from-bottom-4">
                  <Clock className={currentPhase === 'dirty' ? 'text-orange-500 shrink-0 mt-0.5' : 'text-emerald-500 shrink-0 mt-0.5'} size={20} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Status Duration</p>
                    <p className="text-sm font-medium">{durationText}</p>
                  </div>
                </div>
              )}

              {!isMaintenance && isLive && (
                 <button onClick={startMaintenance} className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 p-4 rounded-[2rem] flex items-center justify-between group transition-all">
                   <div className="flex items-center gap-3 text-indigo-400">
                     <div className="bg-indigo-500/20 p-2 rounded-xl"><Sparkles size={18} /></div>
                     <div className="text-left">
                       <p className="text-sm font-bold">Spray Override</p>
                       <p className="text-[10px] opacity-60 uppercase tracking-widest font-black">Pause sensors for 45 mins</p>
                     </div>
                   </div>
                   <ArrowRight size={18} className="text-indigo-500/50 group-hover:translate-x-1 transition-all" />
                 </button>
              )}

              {error && !isMaintenance && !isLive && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-3xl flex gap-3 animate-in fade-in">
                  <AlertTriangle className="text-red-500 shrink-0" size={18} />
                  <p className="text-[10px] text-red-200/60 uppercase font-black tracking-widest leading-tight">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-3xl w-full space-y-12 animate-in slide-in-from-right-8 duration-500 pb-16 px-4">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Project AuraCheck</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px]">IoT Hygiene & Sanitation Architecture</p>
          </div>
          <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
             <h3 className="flex items-center gap-3 font-black uppercase text-sm tracking-[0.2em] mb-4 text-blue-400">
               <AlertTriangle size={18} /> The Catalyst
             </h3>
             <p className="text-sm text-slate-300 leading-relaxed font-medium">
               AuraCheck addresses the reactive cleaning schedules in university hostels (e.g., JAJA Hall, Unilag). By monitoring Ammonia (NH3) levels in real-time, it triggers cleaning based on actual usage rather than fixed timetables, significantly improving sanitation and student health.
             </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/10">
              <Cpu size={28} className="text-indigo-400" />
              <h3 className="font-black uppercase text-xs tracking-widest">Hardware</h3>
              <p className="text-xs text-slate-400 leading-relaxed">NodeMCU + MQ-135 sensors push data via Wi-Fi to a cloud API every 15 seconds.</p>
            </div>
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/10">
              <Database size={28} className="text-emerald-400" />
              <h3 className="font-black uppercase text-xs tracking-widest">Logic</h3>
              <p className="text-xs text-slate-400 leading-relaxed">FastAPI + PostgreSQL handles data ingestion and threshold alerts (Normal vs. Moderate vs. Critical).</p>
            </div>
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/10">
              <Smartphone size={28} className="text-orange-400" />
              <h3 className="font-black uppercase text-xs tracking-widest">Escalation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">SMS alerts go to cleaners; Critical levels lasting 15+ mins escalate to the Hall Mistress via Telegram.</p>
            </div>
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/10">
              <Sparkles size={28} className="text-purple-400" />
              <h3 className="font-black uppercase text-xs tracking-widest">Mitigation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">The "Spray Override" pauses sensors during cleaning to prevent false VOC alerts from chemicals.</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center opacity-40 py-8 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-2">Designed & Engineered by Group 7 students for CSC419 Project</p>
        <p className="text-[9px] font-mono text-slate-400">Unilag Smart Campus Initiative • v3.6</p>
      </div>
    </div>
  );
}

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};
