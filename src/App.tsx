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
  Maximize,
  Plus,
  Trash2,
  Crosshair,
  Globe,
  Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AppStatus, SeismicData, HazardAnalysis, HazardIndicator } from './types';
import { fetchLatestSeismicEvent, fetchRecentSeismicEvents, queryEarthquakesApi } from './services/seismicService';
import { sounds } from './services/soundService';

// --- Constants & Config ---
const LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-09-2025";
const SIM_MODEL = "gemini-3.1-flash-image-preview";

const translations: Record<string, Record<string, string>> = {
  English: {
    title: "SeismicSight",
    subtitle: "Emergency Response Unit",
    cameraOff: "Camera Off",
    cameraOn: "Camera On",
    liveAnalysis: "Live Analysis Active",
    setApiKey: "Set API Key",
    cameraDisabled: "Camera Feed Disabled",
    privacyMode: "Privacy Mode Active",
    enableCamera: "Enable Camera",
    scanning: "Scanning Environment...",
    hazardDetail: "Hazard Detail",
    addHazard: "Add Hazard",
    structural: "Structural",
    falling: "Falling Object",
    glass: "Glass",
    fire: "Fire/Gas",
    exit: "Exit Path",
    hazardLabel: "Hazard Label",
    details: "Details...",
    cancel: "Cancel",
    save: "Save",
    clear: "Clear",
    scan: "Scan",
    annotate: "Annotate",
    simulate: "Simulate",
    initSystem: "Initialize System",
    connectMsg: "Connect to the live seismic analysis network to begin scanning.",
    establishConn: "Establish Connection",
    syncing: "Syncing with Satellite...",
    simAftermath: "Simulated Aftermath",
    closeSim: "Close Simulation",
    liveFeed: "Live Hazard Feed",
    noHazards: "No hazards detected in current sector.",
    sigActivity: "Significant Activity Board (5.0+)",
    liveUsgs: "Live USGS",
    refresh: "Refresh",
    mag: "MAG",
    depth: "DEPTH",
    time: "TIME",
    status: "STATUS",
    awaiting: "Awaiting Data...",
    structIntegrity: "Structural Integrity",
    safetyRecs: "Safety Recommendations",
    recentAlerts: "Historical Data",
    location: "Location"
  },
  Spanish: {
    title: "SeismicSight",
    subtitle: "Unidad de Respuesta a Emergencias",
    cameraOff: "Cámara Apagada",
    cameraOn: "Cámara Encendida",
    liveAnalysis: "Análisis en Vivo Activo",
    setApiKey: "Configurar API Key",
    cameraDisabled: "Cámara Desactivada",
    privacyMode: "Modo de Privacidad Activo",
    enableCamera: "Activar Cámara",
    scanning: "Escaneando Entorno...",
    hazardDetail: "Detalle del Peligro",
    addHazard: "Añadir Peligro",
    structural: "Estructural",
    falling: "Objeto que Cae",
    glass: "Vidrio",
    fire: "Fuego/Gas",
    exit: "Ruta de Salida",
    hazardLabel: "Etiqueta del Peligro",
    details: "Detalles...",
    cancel: "Cancelar",
    save: "Guardar",
    clear: "Limpiar",
    scan: "Escanear",
    annotate: "Anotar",
    simulate: "Simular",
    initSystem: "Inicializar Sistema",
    connectMsg: "Conéctese a la red de análisis sísmico en vivo para comenzar a escanear.",
    establishConn: "Establecer Conexión",
    syncing: "Sincronizando con Satélite...",
    simAftermath: "Secuelas Simuladas",
    closeSim: "Cerrar Simulación",
    liveFeed: "Feed de Peligros en Vivo",
    noHazards: "No se detectaron peligros en el sector actual.",
    sigActivity: "Actividad Significativa (5.0+)",
    liveUsgs: "USGS en Vivo",
    refresh: "Actualizar",
    mag: "MAG",
    depth: "PROF",
    time: "HORA",
    status: "ESTADO",
    awaiting: "Esperando Datos...",
    structIntegrity: "Integridad Estructural",
    safetyRecs: "Recomendaciones de Seguridad",
    recentAlerts: "Datos Históricos",
    location: "Ubicación"
  },
  French: {
    title: "SeismicSight",
    subtitle: "Unité d'Intervention d'Urgence",
    cameraOff: "Caméra Désactivée",
    cameraOn: "Caméra Activée",
    liveAnalysis: "Analyse en Direct Active",
    setApiKey: "Définir la Clé API",
    cameraDisabled: "Flux Caméra Désactivé",
    privacyMode: "Mode Confidentialité Actif",
    enableCamera: "Activer la Caméra",
    scanning: "Analyse de l'Environnement...",
    hazardDetail: "Détail du Danger",
    addHazard: "Ajouter un Danger",
    structural: "Structurel",
    falling: "Objet Tombant",
    glass: "Verre",
    fire: "Feu/Gaz",
    exit: "Voie de Sortie",
    hazardLabel: "Étiquette du Danger",
    details: "Détails...",
    cancel: "Annuler",
    save: "Enregistrer",
    clear: "Effacer",
    scan: "Scanner",
    annotate: "Annoter",
    simulate: "Simuler",
    initSystem: "Initialiser le Système",
    connectMsg: "Connectez-vous au réseau d'analyse sismique en direct pour commencer.",
    establishConn: "Établir la Connexion",
    syncing: "Synchronisation avec le Satellite...",
    simAftermath: "Conséquences Simulées",
    closeSim: "Fermer la Simulation",
    liveFeed: "Flux de Dangers en Direct",
    noHazards: "Aucun danger détecté dans le secteur actuel.",
    sigActivity: "Activité Significative (5.0+)",
    liveUsgs: "USGS en Direct",
    refresh: "Actualiser",
    mag: "MAG",
    depth: "PROF",
    time: "HEURE",
    status: "STATUT",
    awaiting: "En attente de données...",
    structIntegrity: "Intégrité Structurelle",
    safetyRecs: "Recommandations de Sécurité",
    recentAlerts: "Données Historiques",
    location: "Emplacement"
  },
  Kiswahili: {
    title: "SeismicSight",
    subtitle: "Kitengo cha Majibu ya Dharura",
    cameraOff: "Kamera Imezimwa",
    cameraOn: "Kamera Imewashwa",
    liveAnalysis: "Uchambuzi wa Moja kwa Moja",
    setApiKey: "Weka Ufunguo wa API",
    cameraDisabled: "Kamera Imezimwa",
    privacyMode: "Hali ya Faragha Imewashwa",
    enableCamera: "Washa Kamera",
    scanning: "Inachanganua Mazingira...",
    hazardDetail: "Maelezo ya Hatari",
    addHazard: "Ongeza Hatari",
    structural: "Muundo",
    falling: "Kitu Kinachoanguka",
    glass: "Kioo",
    fire: "Moto/Gesi",
    exit: "Njia ya Kutokea",
    hazardLabel: "Lebo ya Hatari",
    details: "Maelezo...",
    cancel: "Ghairi",
    save: "Hifadhi",
    clear: "Futa",
    scan: "Changanua",
    annotate: "Fafanua",
    simulate: "Iga",
    initSystem: "Anzisha Mfumo",
    connectMsg: "Unganisha kwenye mtandao wa uchambuzi wa tetemeko ili kuanza.",
    establishConn: "Anzisha Muunganisho",
    syncing: "Inasawazisha na Satelaiti...",
    simAftermath: "Matokeo Yaliyoigwa",
    closeSim: "Funga Uigaji",
    liveFeed: "Matukio ya Hatari",
    noHazards: "Hakuna hatari zilizogunduliwa.",
    sigActivity: "Matukio Muhimu (5.0+)",
    liveUsgs: "USGS Moja kwa Moja",
    refresh: "Onyesha upya",
    mag: "UKUBWA",
    depth: "KINA",
    time: "MUDA",
    status: "HALI",
    awaiting: "Inasubiri Data...",
    structIntegrity: "Uimara wa Muundo",
    safetyRecs: "Mapendekezo ya Usalama",
    recentAlerts: "Data ya Kihistoria",
    location: "Eneo"
  }
};

export default function App() {
  // --- State ---
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [seismicData, setSeismicData] = useState<SeismicData | null>(null);
  const [historicalSeismicData, setHistoricalSeismicData] = useState<SeismicData[]>([]);
  const [analysis, setAnalysis] = useState<HazardAnalysis | null>(null);
  const [simulatedImage, setSimulatedImage] = useState<string | null>(null);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedIndicator, setSelectedIndicator] = useState<HazardIndicator | null>(null);
  const [hazardLog, setHazardLog] = useState<HazardIndicator[]>([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.85);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [newAnnotationPos, setNewAnnotationPos] = useState<{x: number, y: number} | null>(null);
  const [annotationForm, setAnnotationForm] = useState({ type: 'structural' as HazardIndicator['type'], label: '', details: '' });
  const [language, setLanguage] = useState('English');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const t = (key: string) => translations[language]?.[key] || translations['English'][key] || key;

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
  const nextAudioTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const lastSimulateTimeRef = useRef<number>(0);
  const lastScanTimeRef = useRef<number>(0);
  const SIMULATE_COOLDOWN_MS = 60000; // 60 seconds
  const SCAN_COOLDOWN_MS = 30000; // 30 seconds

  // --- API Key Handling ---
  useEffect(() => {
    const checkKey = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data.apiKey) {
            sessionStorage.setItem("GEMINI_API_KEY", data.apiKey);
            setHasApiKey(true);
            return;
          }
        }
      } catch (e) {
        // Ignore fetch errors in dev mode
      }

      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else if (sessionStorage.getItem("GEMINI_API_KEY")) {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    } else {
      setShowApiKeyModal(true);
    }
  };

  const submitApiKey = () => {
    if (tempApiKey.trim()) {
      sessionStorage.setItem("GEMINI_API_KEY", tempApiKey.trim());
      setHasApiKey(true);
      setShowApiKeyModal(false);
      setTempApiKey("");
    }
  };

  const getApiKey = () => {
    return sessionStorage.getItem("GEMINI_API_KEY") || process.env.API_KEY || process.env.GEMINI_API_KEY || "";
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
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      
      const sessionPromise = ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are SeismicSight AI, an emergency response assistant. Analyze the video feed for seismic hazards and structural weaknesses. Be concise, urgent, and professional. Use the get_seismic_data tool when asked about local activity. You MUST communicate entirely in ${language}. If the user asks you to scan the room or identify hazards, you MUST call the scan_room tool. If the user asks you to simulate an earthquake or show the aftermath, you MUST call the simulate_aftermath tool. If the user asks to close or end the simulation, you MUST call the close_simulation tool. If a user asks for information about other earthquakes (e.g., specific magnitudes, times, or locations), you MUST use the query_earthquakes tool to fetch data from the USGS API. You can only provide answers for information on earthquakes from the API. If the user asks for the largest earthquake, use the query_earthquakes tool with orderBy set to 'magnitude'. If the user asks which region had the most earthquakes, use the query_earthquakes tool with a large limit (e.g., 100) and analyze the locations in the result. If the user asks to stop the live view or disconnect, you MUST call the stop_live_view tool.`,
          tools: [{
            functionDeclarations: [
              {
                name: "get_seismic_data",
                description: "Retrieves real-time seismic activity data for the current location.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    location: { type: Type.STRING, description: "The city or region to check." }
                  },
                  required: ["location"]
                }
              },
              {
                name: "query_earthquakes",
                description: "Queries the USGS Earthquake API for historical or recent earthquake data. Use this to find the largest earthquakes (orderBy: 'magnitude') or fetch a list of earthquakes to analyze regions/continents.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    minMagnitude: { type: Type.NUMBER, description: "Minimum magnitude" },
                    maxMagnitude: { type: Type.NUMBER, description: "Maximum magnitude" },
                    startTime: { type: Type.STRING, description: "Start time in ISO format (e.g., 2023-01-01)" },
                    endTime: { type: Type.STRING, description: "End time in ISO format" },
                    limit: { type: Type.NUMBER, description: "Maximum number of results to return (default 50, max 500)" },
                    orderBy: { type: Type.STRING, description: "Sort order: 'time', 'time-asc', 'magnitude', or 'magnitude-asc'" }
                  }
                }
              },
              {
                name: "scan_room",
                description: "Scans the current camera feed to identify structural hazards and risks.",
                parameters: { type: Type.OBJECT, properties: {} }
              },
              {
                name: "simulate_aftermath",
                description: "Generates a visual simulation of the room after a major earthquake.",
                parameters: { type: Type.OBJECT, properties: {} }
              },
              {
                name: "close_simulation",
                description: "Closes the current earthquake aftermath simulation and returns to the live feed.",
                parameters: { type: Type.OBJECT, properties: {} }
              },
              {
                name: "stop_live_view",
                description: "Stops the live view and disconnects the session.",
                parameters: { type: Type.OBJECT, properties: {} }
              }
            ]
          }]
        },
        callbacks: {
          onopen: () => {
            sessionPromise.then(session => {
              setStatus(AppStatus.ACTIVE);
              setupAudioStreaming(stream, session);
              startVideoStreaming(session);
            });
          },
          onmessage: async (message) => {
            if (message.serverContent?.interrupted) {
              stopAudioPlayback();
            }
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
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        name: "get_seismic_data",
                        response: { result: finalData },
                        id: call.id
                      }]
                    });
                  });
                } else if (call.name === "query_earthquakes") {
                  const args = call.args as any;
                  const results = await queryEarthquakesApi(args);
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        name: "query_earthquakes",
                        response: { result: results },
                        id: call.id
                      }]
                    });
                  });
                } else if (call.name === "scan_room") {
                  scanForHazards().then(success => {
                    sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{
                          name: "scan_room",
                          response: { result: success ? "Scanning initiated." : "Rate limited. Please wait." },
                          id: call.id
                        }]
                      });
                    });
                  });
                } else if (call.name === "simulate_aftermath") {
                  simulateAftermath().then(success => {
                    sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{
                          name: "simulate_aftermath",
                          response: { result: success ? "Simulation initiated." : "Rate limited. Please wait." },
                          id: call.id
                        }]
                      });
                    });
                  });
                } else if (call.name === "close_simulation") {
                  setSimulatedImage(null);
                  setBeforeImage(null);
                  setStatus(AppStatus.ACTIVE);
                  sounds.playCancel();
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        name: "close_simulation",
                        response: { result: "Simulation closed." },
                        id: call.id
                      }]
                    });
                  });
                } else if (call.name === "stop_live_view") {
                  disconnectLive();
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        name: "stop_live_view",
                        response: { result: "Live view stopped." },
                        id: call.id
                      }]
                    });
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

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Connection failed:", err);
      setStatus(AppStatus.ERROR);
    }
  };

  const setupAudioStreaming = (stream: MediaStream, session: any) => {
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
      session.sendRealtimeInput({
        media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
      });
    };

    sourceRef.current.connect(analyserRef.current);
    sourceRef.current.connect(processorRef.current);
    processorRef.current.connect(audioContextRef.current.destination);
  };

  const startVideoStreaming = (session: any) => {
    const sendFrame = () => {
      if (status !== AppStatus.ACTIVE || isVideoOff) return;
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 180);
          const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
          session.sendRealtimeInput({
            media: { data: base64Data, mimeType: 'image/jpeg' }
          });
        }
      }
      setTimeout(() => requestAnimationFrame(sendFrame), 1000); // 1fps for efficiency and cost reduction
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
    
    const currentTime = audioContextRef.current.currentTime;
    if (nextAudioTimeRef.current < currentTime) {
      nextAudioTimeRef.current = currentTime;
    }
    
    source.start(nextAudioTimeRef.current);
    nextAudioTimeRef.current += buffer.duration;
    
    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
    };
  };

  const stopAudioPlayback = () => {
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    });
    activeSourcesRef.current = [];
    nextAudioTimeRef.current = 0;
  };

  const disconnectLive = () => {
    stopAudioPlayback();
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {}
      sessionRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setStatus(AppStatus.IDLE);
    sounds.playCancel();
  };

  // --- Simulation Logic ---
  const simulateAftermath = async (): Promise<boolean> => {
    if (!hasApiKey) {
      handleOpenKeySelector();
      return false;
    }
    
    const now = Date.now();
    if (now - lastSimulateTimeRef.current < SIMULATE_COOLDOWN_MS) {
      const remaining = Math.ceil((SIMULATE_COOLDOWN_MS - (now - lastSimulateTimeRef.current)) / 1000);
      setError(`Rate limit: Please wait ${remaining} seconds before simulating again.`);
      return false;
    }
    lastSimulateTimeRef.current = now;

    setStatus(AppStatus.SIMULATING);
    setSimulatedImage(null);
    setBeforeImage(null);
    sounds.playShutter();
    
    abortControllerRef.current = new AbortController();

    try {
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 1024, 1024);
          const base64Image = canvasRef.current.toDataURL('image/png').split(',')[1];
          setBeforeImage(`data:image/png;base64,${base64Image}`);
          
          const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
      if (err.name === 'AbortError') return false;
      console.error("Simulation failed:", err);
      setError("Simulation failed. Please try again.");
      return false;
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setStatus(AppStatus.ACTIVE);
      }
      abortControllerRef.current = null;
    }
    return true;
  };

  const cancelSimulation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus(AppStatus.ACTIVE);
      sounds.playCancel();
    }
  };

  const scanForHazards = async (): Promise<boolean> => {
    if (!hasApiKey) {
      handleOpenKeySelector();
      return false;
    }

    const now = Date.now();
    if (now - lastScanTimeRef.current < SCAN_COOLDOWN_MS) {
      const remaining = Math.ceil((SCAN_COOLDOWN_MS - (now - lastScanTimeRef.current)) / 1000);
      setError(`Rate limit: Please wait ${remaining} seconds before scanning again.`);
      return false;
    }
    lastScanTimeRef.current = now;

    setIsScanning(true);
    isScanningRef.current = true;
    setHazardLog([]);
    setAnalysis(null);
    sounds.playScan();
    
    // Trigger a manual analysis via the live session for audio feedback
    sessionRef.current?.sendClientContent({
      turns: `I am scanning the room for hazards now. Please give a brief 1-sentence warning that the scan is commencing. Speak in ${language}.`
    });

    try {
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 1024, 1024);
          const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
          
          const ai = new GoogleGenAI({ apiKey: getApiKey() });
          const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: {
              parts: [
                { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
                { text: `Analyze this room for earthquake and structural hazards. Identify specific risks like unanchored furniture, large glass panes, heavy hanging objects, blocked exits, or structural weaknesses. Provide approximate X and Y coordinates (0-100 percentage, where 0,0 is top-left) for each hazard. IMPORTANT: All labels, details, and recommendations MUST be written in ${language}.` }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  hazards: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, description: "Must be one of: structural, falling, glass, fire, exit" },
                        label: { type: Type.STRING },
                        details: { type: Type.STRING },
                        x: { type: Type.NUMBER, description: "X coordinate percentage (0-100)" },
                        y: { type: Type.NUMBER, description: "Y coordinate percentage (0-100)" },
                        confidence: { type: Type.NUMBER, description: "Confidence score (0.0 to 1.0)" }
                      },
                      required: ["type", "label", "details", "x", "y", "confidence"]
                    }
                  },
                  recommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  structuralIntegrity: {
                    type: Type.NUMBER,
                    description: "Overall structural integrity score (0-100)"
                  }
                },
                required: ["hazards", "recommendations", "structuralIntegrity"]
              }
            }
          });

          if (!isScanningRef.current) return;

          const resultText = response.text;
          if (resultText) {
            const parsed = JSON.parse(resultText);
            
            const newIndicators: HazardIndicator[] = parsed.hazards.map((h: any, i: number) => ({
              id: `ai-${Date.now()}-${i}`,
              type: ['structural', 'falling', 'glass', 'fire', 'exit'].includes(h.type) ? h.type : 'structural',
              label: h.label,
              details: h.details,
              x: h.x,
              y: h.y,
              timestamp: new Date().toISOString(),
              confidence: h.confidence
            }));

            // Sequential detection simulation
            const filteredIndicators = newIndicators.filter(i => i.confidence >= confidenceThreshold);
            
            if (filteredIndicators.length === 0) {
              setTimeout(() => {
                setIsScanning(false);
                isScanningRef.current = false;
                sounds.playCancel();
              }, 1000);
              return true;
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
                    recommendations: parsed.recommendations,
                    structuralIntegrity: parsed.structuralIntegrity,
                    indicators: filteredIndicators
                  });
                  setIsScanning(false);
                  
                  sessionRef.current?.sendClientContent({
                    turns: `Scan complete. Found ${filteredIndicators.length} hazards including: ${filteredIndicators.map(i => i.label).join(', ')}. Give a brief 1-2 sentence safety recommendation in ${language}.`
                  });
                }
              }, (index + 1) * 1200);
            });
          }
        }
      }
    } catch (err) {
      console.error("Scan failed:", err);
      setError("Failed to analyze environment. Please try again.");
      setIsScanning(false);
      isScanningRef.current = false;
      return false;
    }
    return true;
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
      const data = await fetchRecentSeismicEvents(4);
      if (data && data.length > 0) {
        setSeismicData(data[0]);
        setHistoricalSeismicData(data.slice(1, 4));
      }
    };

    // Initial fetch
    pollSeismicData();

    // Set up interval (every 60 seconds)
    const interval = setInterval(pollSeismicData, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      stopAudioPlayback();
      if (sessionRef.current) {
        try {
          sessionRef.current.close();
        } catch (e) {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
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
              <h1 className="text-xl font-bold tracking-tighter uppercase italic">{t('title')}</h1>
              <p className="text-[10px] text-red-500 font-mono uppercase tracking-widest leading-none">{t('subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1">
              <Globe className="w-3.5 h-3.5 text-neutral-400" />
              <select 
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  // Optionally notify the live session of the language change
                  if (status === AppStatus.ACTIVE) {
                    sessionRef.current?.sendClientContent({
                      turns: `The user has changed their language preference to ${e.target.value}. Please acknowledge this change briefly in ${e.target.value}.`
                    });
                  }
                }}
                className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-white focus:outline-none cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Spanish">Español</option>
                <option value="French">Français</option>
                <option value="Kiswahili">Kiswahili</option>
                <option value="German">Deutsch</option>
                <option value="Chinese">中文</option>
                <option value="Arabic">العربية</option>
              </select>
            </div>
            
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
                    {isVideoOff ? t('cameraOff') : t('cameraOn')}
                  </span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/50 border border-red-500/30 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">{t('liveAnalysis')}</span>
                </div>
              </>
            )}
            {!hasApiKey && (
              <button 
                onClick={handleOpenKeySelector}
                className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 hover:text-yellow-400 flex items-center gap-1 transition-colors"
              >
                <Zap className="w-3 h-3" /> {t('setApiKey')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-80px)]">
        {/* Left Panel: Camera Feed */}
        <section className="relative flex flex-col gap-4">
          <div 
            className={`relative flex-1 bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl group ${isAnnotationMode ? 'cursor-crosshair' : ''}`}
            onClick={(e) => {
              if (!isAnnotationMode || isVideoOff || status !== AppStatus.ACTIVE) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setNewAnnotationPos({ x, y });
            }}
          >
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
                  <h3 className="text-lg font-bold text-white uppercase tracking-tighter italic">{t('cameraDisabled')}</h3>
                  <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest mt-2">{t('privacyMode')}</p>
                  <button 
                    onClick={toggleVideo}
                    className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all uppercase tracking-widest"
                  >
                    {t('enableCamera')}
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
                      <span className="text-xs font-bold uppercase tracking-widest">{t('scanning')}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Hazard Overlays */}
            <AnimatePresence>
              {status === AppStatus.ACTIVE && !isVideoOff && hazardLog.map((indicator) => (
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
            
            {/* New Annotation Form */}
            <AnimatePresence>
              {newAnnotationPos && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  style={{ left: `${newAnnotationPos.x}%`, top: `${newAnnotationPos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-50 w-64 bg-black/90 backdrop-blur-xl border border-blue-500/50 rounded-xl p-4 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">{t('addHazard')}</h4>
                  <div className="space-y-3">
                    <select 
                      value={annotationForm.type}
                      onChange={(e) => setAnnotationForm(prev => ({ ...prev, type: e.target.value as HazardIndicator['type'] }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="structural">{t('structural')}</option>
                      <option value="falling">{t('falling')}</option>
                      <option value="glass">{t('glass')}</option>
                      <option value="fire">{t('fire')}</option>
                      <option value="exit">{t('exit')}</option>
                    </select>
                    <input 
                      type="text"
                      placeholder={t('hazardLabel')}
                      value={annotationForm.label}
                      onChange={(e) => setAnnotationForm(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <textarea 
                      placeholder={t('details')}
                      value={annotationForm.details}
                      onChange={(e) => setAnnotationForm(prev => ({ ...prev, details: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white h-16 resize-none focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={() => setNewAnnotationPos(null)}
                        className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        {t('cancel')}
                      </button>
                      <button 
                        onClick={() => {
                          if (!annotationForm.label) return;
                          const newHazard: HazardIndicator = {
                            id: `manual-${Date.now()}`,
                            type: annotationForm.type,
                            label: annotationForm.label,
                            details: annotationForm.details,
                            x: newAnnotationPos.x,
                            y: newAnnotationPos.y,
                            timestamp: new Date().toISOString(),
                            confidence: 1.0
                          };
                          setHazardLog(prev => [newHazard, ...prev]);
                          setNewAnnotationPos(null);
                          setAnnotationForm({ type: 'structural', label: '', details: '' });
                          sounds.playSuccess();
                        }}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        {t('save')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
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
                      <h4 className="font-bold text-sm text-white uppercase tracking-tight">{t('hazardDetail')}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      {isAnnotationMode && (
                        <button 
                          onClick={() => {
                            setHazardLog(prev => prev.filter(h => h.id !== selectedIndicator.id));
                            setSelectedIndicator(null);
                            sounds.playCancel();
                          }}
                          className="p-1 hover:bg-red-500/20 rounded-md transition-colors text-red-500"
                          title="Delete Annotation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedIndicator(null)}
                        className="p-1 hover:bg-white/10 rounded-md transition-colors text-neutral-500 hover:text-white"
                      >
                        <RefreshCw className="w-4 h-4 rotate-45" />
                      </button>
                    </div>
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
                <h2 className="text-2xl font-bold mb-2">{t('initSystem')}</h2>
                <p className="text-neutral-400 text-sm mb-8 text-center max-w-xs">{t('connectMsg')}</p>
                <button 
                  onClick={connectLive}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20"
                >
                  {t('establishConn')}
                </button>
              </div>
            )}

            {status === AppStatus.CONNECTING && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                <RefreshCw className="w-12 h-12 text-red-500 animate-spin mb-4" />
                <p className="text-sm font-mono uppercase tracking-widest text-red-400">{t('syncing')}</p>
              </div>
            )}

            {/* Simulation Result Overlay */}
            <AnimatePresence>
              {simulatedImage && beforeImage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black z-40 flex flex-col md:flex-row"
                >
                  <div className="flex-1 relative border-r border-neutral-800">
                    <img src={beforeImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute top-4 left-4 bg-neutral-800/80 backdrop-blur-md px-3 py-1 rounded font-mono text-xs font-bold uppercase tracking-widest text-white border border-white/10">
                      Before
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <img src={simulatedImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute top-4 left-4 bg-red-600/80 backdrop-blur-md px-3 py-1 rounded font-mono text-xs font-bold uppercase tracking-widest text-white border border-red-500/50">
                      {t('simAftermath')}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSimulatedImage(null);
                      setBeforeImage(null);
                    }}
                    className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors text-white"
                  >
                    {t('closeSim')}
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
                <div className="w-px h-8 bg-white/20 mx-2"></div>
                <button 
                  onClick={disconnectLive}
                  className="p-3 rounded-xl transition-colors bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                  title="Disconnect"
                >
                  <Power className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4">
            {isScanning || analysis ? (
              <button 
                onClick={stopScan}
                className="flex items-center justify-center gap-2 py-4 bg-neutral-900 hover:bg-neutral-800 border border-red-900/50 text-red-500 rounded-xl font-bold text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                {t('clear')}
              </button>
            ) : (
              <button 
                disabled={status !== AppStatus.ACTIVE}
                onClick={scanForHazards}
                className="flex items-center justify-center gap-2 py-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-4 h-4 text-red-500" />
                {t('scan')}
              </button>
            )}

            <button
              disabled={status !== AppStatus.ACTIVE}
              onClick={() => {
                setIsAnnotationMode(!isAnnotationMode);
                setNewAnnotationPos(null);
              }}
              className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isAnnotationMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20' 
                  : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300'
              }`}
            >
              <Crosshair className={`w-4 h-4 ${isAnnotationMode ? 'text-white' : 'text-blue-500'}`} />
              {t('annotate')}
            </button>

            {status === AppStatus.SIMULATING ? (
              <button 
                onClick={cancelSimulation}
                className="flex items-center justify-center gap-2 py-4 bg-red-950/50 border border-red-500/50 text-red-500 rounded-xl font-bold text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t('cancel')}
              </button>
            ) : (
              <button 
                disabled={status !== AppStatus.ACTIVE}
                onClick={simulateAftermath}
                className="flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4 fill-current" />
                {t('simulate')}
              </button>
            )}
          </div>
        </section>

        {/* Right Panel: Safety Analysis */}
        <section className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          {/* Seismic Activity Card */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-[60px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                <h3 className="font-bold uppercase tracking-widest text-xs text-neutral-400">{t('sigActivity')}</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">{t('liveUsgs')}</span>
                </div>
                <button 
                  onClick={async () => {
                    setIsRefreshing(true);
                    const data = await fetchRecentSeismicEvents(4);
                    if (data && data.length > 0) {
                      setSeismicData(data[0]);
                      setHistoricalSeismicData(data.slice(1, 4));
                    }
                    sounds.playScan();
                    setIsRefreshing(false);
                  }}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/10 rounded-md transition-colors text-neutral-500 hover:text-white disabled:opacity-50"
                  title="Refresh Live Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">{t('refresh')}</span>
                </button>
              </div>
            </div>

            {seismicData ? (
              <div className="space-y-6 relative z-10">
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
                    <p className="text-[9px] text-neutral-500 uppercase font-bold mb-1">{t('depth')}</p>
                    <p className="text-xs font-mono text-white">{seismicData.depth.toFixed(1)} km</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[9px] text-neutral-500 uppercase font-bold mb-1">{t('time')} (UTC)</p>
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

                {historicalSeismicData.length > 0 && (
                  <div className="pt-4 border-t border-neutral-800/50">
                    <p className="text-[10px] text-neutral-500 uppercase font-bold mb-3 flex items-center gap-2">
                      <Activity className="w-3 h-3 text-neutral-400" /> {t('recentAlerts')}
                    </p>
                    <div className="space-y-2">
                      {historicalSeismicData.map((data, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-neutral-800/30 rounded-lg border border-neutral-800/50">
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-black italic ${
                              data.magnitude >= 7.0 ? 'text-red-500' : 
                              data.magnitude >= 6.0 ? 'text-orange-500' : 'text-yellow-500'
                            }`}>
                              {data.magnitude.toFixed(1)}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-white font-bold truncate max-w-[120px]">{data.location}</span>
                              <span className="text-[9px] text-neutral-500 font-mono">{new Date(data.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                            data.riskLevel === 'Critical' ? 'bg-red-500/10 text-red-500' :
                            data.riskLevel === 'High' ? 'bg-orange-500/10 text-orange-500' : 'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {data.riskLevel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-600">
                <RefreshCw className="w-8 h-8 mb-3 opacity-20 animate-spin-slow" />
                <p className="text-xs font-mono uppercase tracking-widest">{t('awaiting')}</p>
              </div>
            )}
          </div>

          {/* Hazard Analysis Card */}
          <div className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex flex-col overflow-hidden min-h-[400px] shrink-0">
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
                    {t('clear')}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
              {/* Live Hazard Feed */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-neutral-500 uppercase font-bold flex items-center gap-2">
                    <Layers className="w-3 h-3 text-red-500" /> {t('liveFeed')}
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
                          <p className="text-[10px] font-mono uppercase tracking-widest text-center px-4">{t('noHazards')}</p>
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
                      <p className="text-[10px] text-neutral-500 uppercase font-bold">{t('structIntegrity')}</p>
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
                      <Zap className="w-3 h-3 text-yellow-500" /> {t('safetyRecs')}
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
      {/* API Key Modal */}
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-500" />
                Set API Key
              </h2>
              <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                Please enter your Gemini API Key. It will be stored securely in your browser's session storage and will not be sent to any external servers other than Google's API.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitApiKey();
                    }}
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowApiKeyModal(false);
                      setTempApiKey("");
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitApiKey}
                    disabled={!tempApiKey.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors text-sm font-medium"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
