import React, { useState, useEffect, useRef } from 'react';
import { Wind, Wifi, WifiOff, AlertTriangle, RefreshCw, Activity, MapPin, Zap, MessageSquare, Bell, ShieldCheck, Cpu, Database, Smartphone } from 'lucide-react';

export default function App() {
  const [data, setData] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('monitor'); // 'monitor' or 'summary'
  
  // Escalation State
  const [dirtyStartTime, setDirtyStartTime] = useState(null);
  const [alertStatus, setAlertStatus] = useState('Idle');

  const BASE_URL = "https://auracheck.fly.dev/api";
  const READINGS_URL = `${BASE_URL}/readings`;
  const PROXY = "https://corsproxy.io/?";

  // UPDATED TELEGRAM CONFIG
  const TELEGRAM_BOT_TOKEN = "8459102439:AAGVujkyrMaCBXY54wUSdr2nF89EJAl8Kg8"; 
  const TELEGRAM_CHAT_ID = "6843708383";    

  const sendTelegramAlert = async (message) => {
    if (!TELEGRAM_BOT_TOKEN) return;
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: `🚨 AURA_ALERT: ${message}` })
      });
      setAlertStatus('Escalated to Hall Mistress');
    } catch (e) { console.error("Telegram fail", e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const proxyUrl = `${PROXY}${encodeURIComponent(READINGS_URL)}`;
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      const result = await response.json();
      
      // Based on your previous API structure, checking result.data[0]
      if (result.success && result.data && result.data.length > 0) {
        const latest = result.data[0];
        setData(latest);
        setLastSync(new Date());
        setError(null);
        setIsLive(true);

        // Alert Escalation Logic
        const isCurrentlyDirty = latest.status === 'moderate' || latest.status === 'critical';
        
        if (isCurrentlyDirty) {
          if (!dirtyStartTime) {
            setDirtyStartTime(Date.now());
            setAlertStatus('SMS Sent to Cleaner');
          } else {
            const minutesDirty = (Date.now() - dirtyStartTime) / 60000;
            // If dirty for more than 15 minutes, send Telegram to Semilore/Mistress
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
      setError(err.message);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [alertStatus, dirtyStartTime]);

  const status = data?.status?.toLowerCase() || 'unknown';
  
  const getStatusColor = () => {
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
      
      {/* Navigation Switch */}
      <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10">
        <button 
          onClick={() => setView('monitor')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'monitor' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
        >
          Monitor
        </button>
        <button 
          onClick={() => setView('summary')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'summary' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
        >
          Project Summary
        </button>
      </div>

      {view === 'monitor' ? (
        <div className="max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-500">
          
          {/* Status Header */}
          <div className={`flex justify-between items-center p-4 rounded-3xl border backdrop-blur-xl transition-all ${isLive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-2xl ${isLive ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-red-500'}`}>
                {isLive ? <Activity size={20} className="animate-pulse" /> : <WifiOff size={20} />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">System Health</p>
                <h2 className={`text-sm font-bold tracking-tight ${isLive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isLive ? 'AURA_NODE_01 ACTIVE' : 'CONNECTION LOST'}
                </h2>
              </div>
            </div>
            <button onClick={fetchData} className={`p-3 rounded-2xl bg-white/5 hover:bg-white/10 ${loading ? 'animate-spin' : ''}`}>
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Alert Protocol Card */}
          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className={dirtyStartTime ? "text-orange-500 animate-bounce" : "text-slate-600"} />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Alert Protocol</p>
                <p className="text-xs font-bold text-slate-200">{alertStatus}</p>
              </div>
            </div>
            {dirtyStartTime && (
              <div className="text-right">
                <p className="text-[9px] font-black uppercase text-orange-500">Dirty For</p>
                <p className="text-xs font-mono font-bold text-white">
                  {Math.floor((Date.now() - dirtyStartTime) / 60000)}m
                </p>
              </div>
            )}
          </div>

          {/* Main Monitor Display */}
          <div className="text-center py-12 px-8 bg-slate-900/40 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 blur-[100px] rounded-full opacity-20 transition-colors duration-1000 ${getGlowColor()}`} />
            <div className="relative z-10">
              <Wind className={`mx-auto mb-6 transition-all duration-700 ${getStatusColor()}`} size={64} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Air Quality Status</p>
              <h1 className={`text-6xl font-black italic uppercase tracking-tighter mb-6 transition-colors duration-500 ${getStatusColor()}`}>
                {isLive ? status : '----'}
              </h1>
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl py-3 px-6 inline-flex items-center gap-2 border border-white/5 shadow-inner">
                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                <p className="text-sm font-bold tracking-tight">
                  {isLive ? `Updated ${lastSync?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'OFFLINE'}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-white/5">
              <div className="flex items-center gap-2 mb-3 opacity-40 text-blue-400">
                <MapPin size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest">Location</p>
              </div>
              <p className="text-xs font-bold truncate">{data?.location || 'Unknown'}</p>
            </div>
            <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-white/5">
              <div className="flex items-center gap-2 mb-3 opacity-40 text-blue-400">
                <Zap size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest">Sensor Reading</p>
              </div>
              <p className="text-sm font-bold">{data?.raw_value || 0} <span className="text-[10px] opacity-40 ml-1 font-mono">PPM</span></p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-3xl flex gap-3">
              <AlertTriangle className="text-red-500" size={18} />
              <p className="text-[10px] text-red-200/60 uppercase font-black leading-tight tracking-widest">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-2xl w-full space-y-8 animate-in slide-in-from-right-8 duration-500 pb-12">
          
          <div className="text-center">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-blue-500 mb-2">Project AuraCheck</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Smart Hostel Hygiene Monitor</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
              <div className="bg-blue-500/10 p-3 w-fit rounded-2xl text-blue-400">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-black uppercase text-xs tracking-widest">The Problem</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Traditional hostel cleaning schedules are fixed and reactive. High ammonia levels in communal spaces often go unnoticed, leading to poor hygiene and health risks for students.
              </p>
            </div>

            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
              <div className="bg-emerald-500/10 p-3 w-fit rounded-2xl text-emerald-400">
                <Activity size={24} />
              </div>
              <h3 className="font-black uppercase text-xs tracking-widest">The Solution</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                An IoT ecosystem using MQ-135 sensors to monitor air quality in real-time. AuraCheck automates accountability by alerting staff exactly when and where cleaning is needed.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/10">
            <h3 className="font-black uppercase text-sm tracking-[0.2em] mb-8 text-center border-b border-white/5 pb-4">Technology Stack</h3>
            <div className="space-y-6">
              {[
                { icon: <Cpu />, title: "Hardware", desc: "NodeMCU (ESP8266) + MQ-135 Sensor Array with customized voltage calibration for JAJA Hall environments." },
                { icon: <Database />, title: "Backend API", desc: "FastAPI server deployed on Fly.io managing PostgreSQL ingestion and automated logic." },
                { icon: <Smartphone />, title: "Communication", desc: "Twilio Programmable SMS for Cleaners + Telegram Bot API for administrative escalation." },
                { icon: <MessageSquare />, title: "Frontend", desc: "Real-time React dashboard with glassmorphic UI and automated polling logic." }
              ].map((tech, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="text-blue-500 bg-blue-500/5 p-3 rounded-2xl shrink-0">{tech.icon}</div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">{tech.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{tech.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Signature */}
      <div className="text-center opacity-30 py-8">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-1">Developed by Group 7 Students for CSC419 Project</p>
        <p className="text-[8px] font-mono">University of Lagos • Smart Campus Initiative</p>
      </div>
    </div>
  );
}
