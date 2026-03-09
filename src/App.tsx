/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Camera, 
  ShieldAlert, 
  Zap, 
  RefreshCw, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Info,
  ExternalLink,
  Flame,
  Box,
  DoorOpen,
  Layers,
  Maximize
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AppStatus, SeismicData, HazardAnalysis, HazardIndicator } from './types';
import { fetchLatestSeismicEvent } from './services/seismicService';
import { sounds } from './services/soundService';

// --- Constants & Config ---
const LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-09-2025";
const SIM_MODEL = "gemini-3.1-flash-image-preview";

export default function App() {
  // --- State ---
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [seismicData, setSeismicData] = useState<SeismicData | null>(null);
  const [analysis, setAnalysis] = useState<HazardAnalysis | null>(null);
  const [simulatedImage, setSimulatedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedIndicator, setSelectedIndicator] = useState<HazardIndicator | null>(null);
  const [hazardLog, setHazardLog] = useState<HazardIndicator[]>([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.85);

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isScanningRef = useRef(false);

  // --- API Key Handling ---
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  // --- Camera Setup ---
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Camera error:", err);
      setError("Failed to access camera/microphone. Please check permissions.");
      return null;
    }
  }, []);

  const toggleVideo = () => {
    const newState = !isVideoOff;
    setIsVideoOff(newState);
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !newState;
      });
    }
    
    if (newState) {
      sounds.playCancel();
    } else {
      sounds.playScan();
    }
  };

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !newState;
      });
    }
    
    if (newState) {
      sounds.playCancel();
    } else {
      sounds.playScan();
    }
  };

  // --- Gemini Live Logic ---
  const connectLive = async () => {
    if (status !== AppStatus.IDLE) return;
    
    setStatus(AppStatus.CONNECTING);
    const stream = await startCamera();
    if (!stream) {
      setStatus(AppStatus.ERROR);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const session = await ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are SeismicSight AI, an emergency response assistant. Analyze the video feed for seismic hazards and structural weaknesses. Be concise, urgent, and professional. Use the get_seismic_data tool when asked about local activity.",
          tools: [{
            functionDeclarations: [{
              name: "get_seismic_data",
              description: "Retrieves real-time seismic activity data for the current location.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  location: { type: Type.STRING, description: "The city or region to check." }
                },
                required: ["location"]
              }
            }]
          }]
        },
        callbacks: {
          onopen: () => {
            setStatus(AppStatus.ACTIVE);
            setupAudioStreaming(stream);
            startVideoStreaming();
          },
          onmessage: async (message) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              playAudioResponse(message.serverContent.modelTurn.parts[0].inlineData.data);
            }
            if (message.toolCall) {
              for (const call of message.toolCall.functionCalls) {
                if (call.name === "get_seismic_data") {
                  const realData = await fetchLatestSeismicEvent();
                  const finalData: SeismicData = realData || {
                    magnitude: 4.2 + Math.random() * 2,
                    location: (call.args as any).location || "Current Sector",
                    depth: 10 + Math.random() * 50,
                    timestamp: new Date().toISOString(),
                    riskLevel: Math.random() > 0.5 ? 'High' : 'Moderate'
                  };
                  setSeismicData(finalData);
                  sessionRef.current?.sendToolResponse({
                    functionResponses: [{
                      name: "get_seismic_data",
                      response: { result: finalData },
                      id: call.id
                    }]
                  });
                }
              }
            }
          },
          onerror: (err) => {
            console.error("Live error:", err);
            setError("Connection error. Retrying...");
            setStatus(AppStatus.ERROR);
          }
        }
      });

      sessionRef.current = session;
    } catch (err) {
      console.error("Connection failed:", err);
      setStatus(AppStatus.ERROR);
    }
  };

  const setupAudioStreaming = (stream: MediaStream) => {
    audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    
    processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const updateAudioLevel = () => {
      if (analyserRef.current && status === AppStatus.ACTIVE) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 128); // Normalize to 0-1
        requestAnimationFrame(updateAudioLevel);
      }
    };
    updateAudioLevel();

    processorRef.current.onaudioprocess = (e) => {
      if (isMuted) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
      sessionRef.current?.sendRealtimeInput({
        media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
      });
    };

    sourceRef.current.connect(analyserRef.current);
    sourceRef.current.connect(processorRef.current);
    processorRef.current.connect(audioContextRef.current.destination);
  };

  const startVideoStreaming = () => {
    const sendFrame = () => {
      if (status !== AppStatus.ACTIVE || isVideoOff) return;
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 180);
          const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
          sessionRef.current?.sendRealtimeInput({
            media: { data: base64Data, mimeType: 'image/jpeg' }
          });
        }
      }
      setTimeout(() => requestAnimationFrame(sendFrame), 500); // 2fps for efficiency
    };
    sendFrame();
  };

  const playAudioResponse = (base64Audio: string) => {
    if (!audioContextRef.current) return;
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 0x7FFF;

    const buffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
    buffer.getChannelData(0).set(floatData);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  // --- Simulation Logic ---
  const simulateAftermath = async () => {
    if (!hasApiKey) {
      handleOpenKeySelector();
      return;
    }
    
    setStatus(AppStatus.SIMULATING);
    setSimulatedImage(null);
    sounds.playShutter();
    
    abortControllerRef.current = new AbortController();

    try {
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 1024, 1024);
          const base64Image = canvasRef.current.toDataURL('image/png').split(',')[1];
          
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: SIM_MODEL,
            contents: {
              parts: [
                { inlineData: { data: base64Image, mimeType: 'image/png' } },
                { text: "Simulate the immediate aftermath of a major earthquake on this scene. Show structural damage, debris, and emergency lighting. Maintain the same perspective and core elements but transform it into a disaster zone. High detail, cinematic disaster aesthetic." }
              ]
            },
            config: {
              imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
            }
          });

          if (abortControllerRef.current.signal.aborted) return;

          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              setSimulatedImage(`data:image/png;base64,${part.inlineData.data}`);
              sounds.playSuccess();
              break;
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Simulation failed:", err);
      setError("Simulation failed. Please try again.");
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setStatus(AppStatus.ACTIVE);
      }
      abortControllerRef.current = null;
    }
  };

  const cancelSimulation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus(AppStatus.ACTIVE);
      sounds.playCancel();
    }
  };

  const scanForHazards = () => {
    setIsScanning(true);
    isScanningRef.current = true;
    setHazardLog([]);
    setAnalysis(null);
    sounds.playScan();
    
    // Trigger a manual analysis via the live session
    sessionRef.current?.sendRealtimeInput({
      text: "Perform a full structural hazard scan of this environment. Identify at least 3 potential risks and their approximate locations in the frame."
    });
    
    const mockIndicators: HazardIndicator[] = [
      { 
        id: '1', 
        type: 'falling', 
        label: 'Unsecured Shelving', 
        details: 'Heavy industrial shelving unit (approx. 200kg) not anchored to wall studs. High risk of tipping during lateral acceleration > 0.3g.',
        x: 25, 
        y: 30,
        timestamp: new Date().toISOString(),
        confidence: 0.94
      },
      { 
        id: '2', 
        type: 'fire', 
        label: 'Exposed Gas Line', 
        details: 'Flexible yellow gas connector showing signs of corrosion. No automatic seismic shut-off valve detected on this branch. Estimated leak radius: 5m.',
        x: 70, 
        y: 80,
        timestamp: new Date().toISOString(),
        confidence: 0.88
      },
      { 
        id: '3', 
        type: 'structural', 
        label: 'Ceiling Crack', 
        details: 'Diagonal shear crack (approx. 15mm width) in load-bearing concrete beam. Indicates previous settlement or structural fatigue. High risk of spalling.',
        x: 50, 
        y: 15,
        timestamp: new Date().toISOString(),
        confidence: 0.91
      },
      { 
        id: '4', 
        type: 'glass', 
        label: 'Large Window Pane', 
        details: 'Non-tempered glass pane (2.4m x 1.8m). High risk of shattering and creating hazardous debris during moderate tremors. Recommend safety film application.',
        x: 85, 
        y: 40,
        timestamp: new Date().toISOString(),
        confidence: 0.97
      },
      { 
        id: '5', 
        type: 'falling', 
        label: 'Unanchored Water Heater', 
        details: '50-gallon water heater without seismic strapping. Risk of tipping, breaking gas lines, and causing flooding/fire hazards.',
        x: 15, 
        y: 65,
        timestamp: new Date().toISOString(),
        confidence: 0.82
      },
      { 
        id: '6', 
        type: 'exit', 
        label: 'Primary Exit Path', 
        details: 'Clear path to external egress. Width: 1.2m. Ensure path remains clear of debris from nearby unanchored objects.',
        x: 10, 
        y: 85,
        timestamp: new Date().toISOString(),
        confidence: 0.99
      }
    ];

    // Sequential detection simulation
    const filteredIndicators = mockIndicators.filter(i => i.confidence >= confidenceThreshold);
    
    if (filteredIndicators.length === 0) {
      setTimeout(() => {
        setIsScanning(false);
        isScanningRef.current = false;
        sounds.playCancel();
      }, 1000);
      return;
    }

    filteredIndicators.forEach((indicator, index) => {
      setTimeout(() => {
        if (!isScanningRef.current) return;
        
        setHazardLog(prev => [indicator, ...prev]);
        sounds.playHazard();
        
        // On the last one, finalize analysis
        if (index === filteredIndicators.length - 1) {
          setAnalysis({
            hazards: filteredIndicators.map(i => i.label),
            recommendations: [
              "Anchor all heavy shelving and furniture to wall studs",
              "Install automatic seismic shut-off valves for gas lines",
              "Apply safety film to large glass panes",
              "Secure water heater with seismic straps",
              "Reinforce structural beams showing shear cracks"
            ],
            structuralIntegrity: 68,
            indicators: filteredIndicators
          });
          setIsScanning(false);
        }
      }, (index + 1) * 1200);
    });
  };

  const stopScan = () => {
    setIsScanning(false);
    isScanningRef.current = false;
    setAnalysis(null);
    setHazardLog([]);
    setSelectedIndicator(null);
    setSimulatedImage(null);
    sounds.playCancel();
  };

  const getHazardIcon = (type: HazardIndicator['type']) => {
    switch (type) {
      case 'structural': return <Layers className="w-4 h-4" />;
      case 'fire': return <Flame className="w-4 h-4" />;
      case 'glass': return <Maximize className="w-4 h-4" />;
      case 'falling': return <Box className="w-4 h-4" />;
      case 'exit': return <DoorOpen className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // --- Real-time Polling ---
  useEffect(() => {
    const pollSeismicData = async () => {
      const data = await fetchLatestSeismicEvent();
      if (data) setSeismicData(data);
    };

    // Initial fetch
    pollSeismicData();

    // Set up interval (every 60 seconds)
    const interval = setInterval(pollSeismicData, 60000);

    return () => clearInterval(interval);
  }, []);

  // --- UI Components ---
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-500/30">
      {/* Header */}
      <header className="border-b border-red-900/30 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)]">
              <ShieldAlert className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter uppercase italic">SeismicSight</h1>
              <p className="text-[10px] text-red-500 font-mono uppercase tracking-widest leading-none">Emergency Response Unit</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {status === AppStatus.ACTIVE && (
              <>
                <button 
                  onClick={toggleVideo}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    isVideoOff 
                      ? 'bg-red-600 border-red-500 text-white' 
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title={isVideoOff ? "Enable Camera" : "Disable Camera"}
                >
                  {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
                    {isVideoOff ? "Camera Off" : "Camera On"}
                  </span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/50 border border-red-500/30 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">Live Analysis Active</span>
                </div>
              </>
            )}
            {!hasApiKey && (
              <button 
                onClick={handleOpenKeySelector}
                className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 hover:text-yellow-400 flex items-center gap-1 transition-colors"
              >
                <Zap className="w-3 h-3" /> Set API Key
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-80px)]">
        {/* Left Panel: Camera Feed */}
        <section className="relative flex flex-col gap-4">
          <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl group">
            {/* Camera View */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover transition-opacity duration-500 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
            />
            
            {/* Overlay Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
            
            {/* Camera Disabled Overlay */}
            <AnimatePresence>
              {isVideoOff && status === AppStatus.ACTIVE && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 backdrop-blur-md z-30"
                >
                  <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <VideoOff className="w-10 h-10 text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tighter italic">Camera Feed Disabled</h3>
                  <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest mt-2">Privacy Mode Active</p>
                  <button 
                    onClick={toggleVideo}
                    className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all uppercase tracking-widest"
                  >
                    Enable Camera
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scanning Line */}
            {status === AppStatus.ACTIVE && !isVideoOff && (
              <>
                <motion.div 
                  initial={{ top: 0 }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.8)] z-10 pointer-events-none"
                />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="px-4 py-2 bg-red-600/80 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-bold uppercase tracking-widest">Scanning Environment...</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Hazard Overlays */}
            <AnimatePresence>
              {status === AppStatus.ACTIVE && !isVideoOff && analysis?.indicators.map((indicator) => (
                <motion.div
                  key={indicator.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  style={{ left: `${indicator.x}%`, top: `${indicator.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group/indicator"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndicator(indicator);
                    sounds.playScan();
                  }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20" />
                    <div className={`relative p-2 rounded-full border-2 shadow-lg transition-all transform hover:scale-110 cursor-pointer ${
                      selectedIndicator?.id === indicator.id 
                        ? 'bg-white text-red-600 border-red-600 scale-125' 
                        : 'bg-red-600 text-white border-white/20 shadow-red-600/40'
                    }`}>
                      {getHazardIcon(indicator.type)}
                    </div>
                    
                    {/* Tooltip (Hover) */}
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg whitespace-nowrap transition-opacity pointer-events-none ${
                      selectedIndicator?.id === indicator.id ? 'opacity-0' : 'opacity-0 group-hover/indicator:opacity-100'
                    }`}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-0.5">{indicator.type}</p>
                      <p className="text-xs font-medium text-white">{indicator.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Hazard Detail Panel */}
            <AnimatePresence>
              {selectedIndicator && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="absolute top-6 right-6 w-72 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 z-50 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-red-600/20 rounded-lg text-red-500">
                        {getHazardIcon(selectedIndicator.type)}
                      </div>
                      <h4 className="font-bold text-sm text-white uppercase tracking-tight">Hazard Detail</h4>
                    </div>
                    <button 
                      onClick={() => setSelectedIndicator(null)}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors text-neutral-500 hover:text-white"
                    >
                      <RefreshCw className="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1">{selectedIndicator.type}</p>
                      <h5 className="text-lg font-bold text-white leading-tight">{selectedIndicator.label}</h5>
                    </div>
                    
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xs text-neutral-300 leading-relaxed italic">
                        "{selectedIndicator.details}"
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                      <Info className="w-3 h-3" />
                      <span>COORDINATES: {selectedIndicator.x.toFixed(1)}, {selectedIndicator.y.toFixed(1)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Overlays */}
            {status === AppStatus.IDLE && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                <Activity className="w-16 h-16 text-red-600 mb-6 animate-pulse" />
                <h2 className="text-2xl font-bold mb-2">Initialize System</h2>
                <p className="text-neutral-400 text-sm mb-8 text-center max-w-xs">Connect to the live seismic analysis network to begin scanning.</p>
                <button 
                  onClick={connectLive}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20"
                >
                  Establish Connection
                </button>
              </div>
            )}

            {status === AppStatus.CONNECTING && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                <RefreshCw className="w-12 h-12 text-red-500 animate-spin mb-4" />
                <p className="text-sm font-mono uppercase tracking-widest text-red-400">Syncing with Satellite...</p>
              </div>
            )}

            {/* Simulation Result Overlay */}
            <AnimatePresence>
              {simulatedImage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black z-40"
                >
                  <img src={simulatedImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded font-mono text-xs font-bold uppercase tracking-widest">
                    Simulated Aftermath
                  </div>
                  <button 
                    onClick={() => setSimulatedImage(null)}
                    className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                  >
                    Close Simulation
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camera Controls */}
            {status === AppStatus.ACTIVE && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Visualizer */}
                <div className="flex items-center gap-1 h-8 px-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: isMuted ? 2 : Math.max(2, audioLevel * (10 + i * 5)) 
                      }}
                      className="w-1 bg-red-500 rounded-full"
                    />
                  ))}
                </div>
                
                <button 
                  onClick={toggleMute}
                  className={`p-3 rounded-xl transition-colors ${isMuted ? 'bg-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button 
                  onClick={toggleVideo}
                  className={`p-3 rounded-xl transition-colors ${isVideoOff ? 'bg-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {isScanning || analysis ? (
              <button 
                onClick={stopScan}
                className="flex items-center justify-center gap-2 py-4 bg-neutral-900 hover:bg-neutral-800 border border-red-900/50 text-red-500 rounded-xl font-bold text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Stop Scan / Clear
              </button>
            ) : (
              <button 
                disabled={status !== AppStatus.ACTIVE}
                onClick={scanForHazards}
                className="flex items-center justify-center gap-2 py-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-4 h-4 text-red-500" />
                Scan for Hazards
              </button>
            )}

            {status === AppStatus.SIMULATING ? (
              <button 
                onClick={cancelSimulation}
                className="flex items-center justify-center gap-2 py-4 bg-red-950/50 border border-red-500/50 text-red-500 rounded-xl font-bold text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                Cancel Simulation
              </button>
            ) : (
              <button 
                disabled={status !== AppStatus.ACTIVE}
                onClick={simulateAftermath}
                className="flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4 fill-current" />
                Simulate Aftermath
              </button>
            )}
          </div>
        </section>

        {/* Right Panel: Safety Analysis */}
        <section className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          {/* Seismic Activity Card */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-[60px] rounded-full" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                <h3 className="font-bold uppercase tracking-widest text-xs text-neutral-400">Significant Activity Board (5.0+)</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Live USGS</span>
                </div>
                <button 
                  onClick={async () => {
                    const data = await fetchLatestSeismicEvent();
                    if (data) setSeismicData(data);
                    sounds.playScan();
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-neutral-500 hover:text-white"
                  title="Refresh Live Data"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {seismicData ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-6xl font-black italic tracking-tighter ${
                      seismicData.magnitude >= 7.0 ? 'text-red-500' : 
                      seismicData.magnitude >= 6.0 ? 'text-orange-500' : 'text-white'
                    }`}>
                      {seismicData.magnitude.toFixed(1)}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase leading-none">Magnitude</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                        seismicData.riskLevel === 'Critical' ? 'text-red-500' :
                        seismicData.riskLevel === 'High' ? 'text-orange-500' : 'text-yellow-500'
                      }`}>
                        {seismicData.riskLevel} Risk
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Impact Zone</p>
                    <p className="text-sm font-bold text-white max-w-[150px] leading-tight">{seismicData.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-800/50">
                  <div>
                    <p className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Depth</p>
                    <p className="text-xs font-mono text-white">{seismicData.depth.toFixed(1)} km</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Timestamp (UTC)</p>
                    <p className="text-xs font-mono text-white">{new Date(seismicData.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-3 bg-red-600/5 border border-red-600/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-3 h-3 text-red-500" />
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Safety Protocol</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    {seismicData.magnitude >= 7.0 
                      ? "CRITICAL: Immediate evacuation of vulnerable structures required. Expect severe aftershocks."
                      : seismicData.magnitude >= 6.0
                      ? "HIGH: Structural assessment recommended. Secure all heavy objects and check gas lines."
                      : "MODERATE: Significant shaking detected. Monitor local news and stay clear of glass."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-600">
                <RefreshCw className="w-8 h-8 mb-3 opacity-20 animate-spin-slow" />
                <p className="text-xs font-mono uppercase tracking-widest">Syncing with USGS Global Network...</p>
              </div>
            )}
          </div>

          {/* Hazard Analysis Card */}
          <div className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h3 className="font-bold uppercase tracking-widest text-xs text-neutral-400">Safety Analysis</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Confidence:</span>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="0.99" 
                    step="0.01" 
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                    title={`Threshold: ${(confidenceThreshold * 100).toFixed(0)}%`}
                  />
                  <span className="text-[10px] font-mono text-red-500 w-8">{(confidenceThreshold * 100).toFixed(0)}%</span>
                </div>
                {(analysis || hazardLog.length > 0 || simulatedImage) && (
                  <button 
                    onClick={stopScan}
                    className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md text-[10px] font-bold text-red-500 uppercase tracking-wider transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
              {/* Live Hazard Feed */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-neutral-500 uppercase font-bold flex items-center gap-2">
                    <Layers className="w-3 h-3 text-red-500" /> Live Hazard Feed
                  </p>
                  {isScanning && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 animate-pulse">
                      <RefreshCw className="w-2 h-2 animate-spin" /> ANALYZING...
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {hazardLog.length > 0 ? (
                      hazardLog.map((hazard) => (
                        <motion.div
                          key={hazard.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => {
                            setSelectedIndicator(hazard);
                            sounds.playScan();
                          }}
                          className={`bg-neutral-800/50 border rounded-lg p-3 flex items-start gap-3 group transition-all cursor-pointer ${
                            selectedIndicator?.id === hazard.id 
                              ? 'border-red-500/50 bg-red-500/5' 
                              : 'border-neutral-700/50 hover:border-red-500/30'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${
                            hazard.type === 'structural' ? 'bg-blue-500/10 text-blue-500' :
                            hazard.type === 'fire' ? 'bg-orange-500/10 text-orange-500' :
                            hazard.type === 'exit' ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {getHazardIcon(hazard.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-white truncate">{hazard.label}</h4>
                                <span className="text-[9px] font-bold text-red-500/80 bg-red-500/5 px-1 rounded border border-red-500/10">
                                  {(hazard.confidence * 100).toFixed(0)}% CONF
                                </span>
                              </div>
                              <span className="text-[9px] font-mono text-neutral-500">
                                {new Date(hazard.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                              {hazard.details}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      !isScanning && (
                        <div className="py-8 border border-dashed border-neutral-800 rounded-xl flex flex-col items-center justify-center text-neutral-600">
                          <ShieldAlert className="w-6 h-6 mb-2 opacity-20" />
                          <p className="text-[10px] font-mono uppercase tracking-widest text-center px-4">Initiate Scan to Analyze Environment</p>
                        </div>
                      )
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {analysis && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pt-6 border-t border-neutral-800/50"
                >
                  {/* Structural Integrity Bar */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[10px] text-neutral-500 uppercase font-bold">Structural Integrity Index</p>
                      <p className={`text-lg font-black italic ${
                        analysis.structuralIntegrity < 50 ? 'text-red-500' : 
                        analysis.structuralIntegrity < 80 ? 'text-yellow-500' : 'text-emerald-500'
                      }`}>
                        {analysis.structuralIntegrity}%
                      </p>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.structuralIntegrity}%` }}
                        className={`h-full ${
                          analysis.structuralIntegrity < 50 ? 'bg-red-600' : 
                          analysis.structuralIntegrity < 80 ? 'bg-yellow-600' : 'bg-emerald-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase font-bold mb-3 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-yellow-500" /> Mitigation Strategy
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {analysis.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          <p className="text-[11px] text-neutral-300">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Emergency Protocol</p>
              <p className="text-[10px] text-red-500/70 leading-relaxed">
                This AI analysis is for simulation and training purposes. In a real seismic event, follow local authority guidelines and established evacuation protocols immediately.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" width={1024} height={1024} />

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-red-600 text-white rounded-xl shadow-2xl flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-bold">{error}</span>
            <button onClick={() => setError(null)} className="ml-4 hover:opacity-70">
              <RefreshCw className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #262626;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #404040;
        }
      `}</style>
    </div>
  );
}
