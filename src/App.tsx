import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Link as LinkIcon, User, Navigation, Info, AlertTriangle, Flame } from 'lucide-react';

// --- Sound Manager (Web Audio API) ---
const playSound = (type: 'connect' | 'burn' | 'track') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'connect') {
    // Paper tearing / magic snap
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'burn') {
    // Sizzling noise (White noise approximation)
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 2);
    noise.start(now);
    noise.stop(now + 2);
  } else if (type === 'track') {
    // Subtle sonar ping
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  }
};

interface Location {
  lat: number;
  lng: number;
  timestamp: number;
}

const App: React.FC = () => {
  const [peerId, setPeerId] = useState<string>('');
  const [targetPeerId, setTargetPeerId] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [myLocation, setMyLocation] = useState<Location | null>(null);
  const [targetLocation, setTargetLocation] = useState<Location | null>(null);
  const [bearing, setBearing] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLobby, setIsLobby] = useState<boolean>(true);
  
  // Visual Effects State
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [embers, setEmbers] = useState<{id: number, left: number}[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<any>(null);

  useEffect(() => {
    // Generate a random pirate-y name/id
    const adjectives = ['StrawHat', 'Iron', 'Red', 'Gold', 'Black', 'Silver', 'Dread'];
    const names = ['Luffy', 'Zoro', 'Nami', 'Usopp', 'Sanji', 'Chopper', 'Robin', 'Franky', 'Brook', 'Jinbe'];
    const randomId = `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${names[Math.floor(Math.random() * names.length)]}-${Math.floor(Math.random() * 999)}`;
    
    const peer = new Peer(randomId);
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;
      setupConnection(conn);
    });

    // Start geolocation
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now()
        };
        setMyLocation(loc);
        if (connRef.current && connRef.current.open) {
          connRef.current.send({ type: 'location', data: loc });
        }
      },
      (err) => {
        setError("Location permission denied. This Vivre Card won't move!");
        console.error(err);
      },
      { enableHighAccuracy: true }
    );

    return () => {
      peer.destroy();
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const setupConnection = (conn: any) => {
    conn.on('open', () => {
      playSound('connect');
      setConnected(true);
      setIsLobby(false);
      setIsBurning(false); // Reset burn state
      if (myLocation) {
        conn.send({ type: 'location', data: myLocation });
      }
    });

    conn.on('data', (payload: any) => {
      if (payload.type === 'location') {
        setTargetLocation(payload.data);
      }
    });

    conn.on('close', () => {
      triggerBurnEffect();
    });
  };

  const triggerBurnEffect = () => {
    playSound('burn');
    setIsBurning(true);
    setConnected(false);
    
    // Generate embers
    const newEmbers = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100
    }));
    setEmbers(newEmbers);

    // Wait for animation to finish before going back to lobby
    setTimeout(() => {
      setIsLobby(true);
      setTargetLocation(null);
      setEmbers([]);
      setIsBurning(false);
    }, 3500);
  };

  const connectToPeer = () => {
    if (!targetPeerId) return;
    const conn = peerRef.current?.connect(targetPeerId);
    if (conn) {
      connRef.current = conn;
      setupConnection(conn);
    }
  };

  useEffect(() => {
    if (myLocation && targetLocation) {
      playSound('track');
      const b = calculateBearing(myLocation.lat, myLocation.lng, targetLocation.lat, targetLocation.lng);
      const d = calculateDistance(myLocation.lat, myLocation.lng, targetLocation.lat, targetLocation.lng);
      setBearing(b);
      setDistance(d);
    }
  }, [myLocation, targetLocation]);

  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 relative font-pirate">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10"><Compass size={120} /></div>
        <div className="absolute bottom-10 right-10 rotate-12"><Navigation size={120} /></div>
      </div>

      <AnimatePresence mode="wait">
        {isLobby && !isBurning ? (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="z-10 bg-[#2a2118] p-8 rounded-lg shadow-2xl border-4 border-[#8b4513] max-w-md w-full"
          >
            <h1 className="text-4xl text-[#f4e4bc] mb-6 text-center border-b-2 border-[#8b4513] pb-2">Vivre Card</h1>
            
            <div className="mb-6 bg-[#3d2e20] p-4 rounded border border-[#5d4037]">
              <p className="text-[#a1887f] text-sm uppercase mb-1">Your Life Paper ID</p>
              <div className="flex items-center justify-between">
                <code className="text-xl text-[#ffcc80]">{peerId || 'Generating...'}</code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(peerId);
                    playSound('track');
                  }}
                  className="p-2 hover:bg-[#5d4037] rounded transition-colors"
                >
                  <LinkIcon size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[#a1887f] text-sm uppercase mb-1">Target Card ID</label>
                <input 
                  type="text" 
                  value={targetPeerId}
                  onChange={(e) => setTargetPeerId(e.target.value)}
                  placeholder="Enter friend's ID..."
                  className="w-full bg-[#1a120b] border border-[#8b4513] p-3 rounded text-[#f4e4bc] focus:outline-none focus:ring-2 focus:ring-[#8b4513]"
                />
              </div>
              <button 
                onClick={connectToPeer}
                disabled={!targetPeerId}
                className="w-full bg-[#8b4513] hover:bg-[#a0522d] disabled:opacity-50 text-white font-bold py-3 rounded-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Navigation size={20} />
                CONNECT LIVES
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="mt-6 text-[#795548] text-xs text-center flex items-center justify-center gap-2">
              <Info size={14} />
              Share your ID with a friend to track each other.
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="tracking"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="z-10 flex flex-col items-center"
          >
            <div className="text-center mb-8">
              <p className="text-[#8d6e63] uppercase text-sm tracking-widest mb-1">
                {isBurning ? "LIFE FORCE FADING..." : "Tracking Life Force"}
              </p>
              <h2 className="text-2xl text-[#f4e4bc]">{targetPeerId}</h2>
              {!isBurning && <p className="text-[#795548]">{Math.round(distance / 1000)} km away</p>}
            </div>

            {/* THE VIVRE CARD */}
            <motion.div 
              style={{ rotate: isBurning ? 0 : bearing }}
              animate={isBurning ? { rotate: [0, 10, -10, 0], scale: [1, 0.9, 0.8] } : {
                x: [0, 2, -2, 0],
                y: [0, -2, 2, 0],
              }}
              transition={{
                duration: isBurning ? 0.5 : 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-64 h-80 flex items-center justify-center"
            >
              {/* Paper Layers */}
              <div className={`vivre-card-paper torn-edge w-48 h-60 flex flex-col items-center justify-center p-6 text-[#5d4037] ${isBurning ? 'burning' : ''}`}>
                <div className="opacity-40"><User size={48} /></div>
                <div className="mt-4 text-center">
                  <p className="text-[8px] uppercase tracking-tighter opacity-60 mb-2">Grand Line Registry</p>
                  <div className="h-0.5 w-12 bg-[#8b4513] opacity-20 mb-2" />
                  <p className="font-bold text-lg leading-tight">{targetPeerId.split('-')[1]}</p>
                </div>
                
                {/* Visuals */}
                {!isBurning && (
                   <div className="absolute bottom-4 left-2 w-8 h-8 bg-[#8b4513] opacity-5 rounded-full blur-md" />
                )}
                
                {/* Ash Particles */}
                {isBurning && embers.map((ember) => (
                  <div 
                    key={ember.id} 
                    className="ember" 
                    style={{ left: `${ember.left}%`, bottom: '0', animationDelay: `${Math.random() * 0.5}s` }} 
                  />
                ))}
              </div>

              {/* Indicator Arrow (Hide when burning) */}
              {!isBurning && (
                <div className="absolute top-0 -translate-y-4">
                   <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                   >
                     <Navigation size={32} className="text-[#8b4513] fill-[#8b4513]" />
                   </motion.div>
                </div>
              )}
            </motion.div>

            <div className="h-16 mt-12 flex items-center justify-center">
              {isBurning ? (
                 <div className="text-red-500 font-bold flex items-center gap-2 animate-pulse">
                   <Flame /> LINK SEVERED
                 </div>
              ) : (
                <button 
                  onClick={() => {
                     triggerBurnEffect();
                     // Actually close connection
                     if(connRef.current) connRef.current.close();
                  }}
                  className="text-[#8d6e63] hover:text-[#f4e4bc] transition-colors border-b border-transparent hover:border-[#f4e4bc]"
                >
                  DISCONNECT
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 text-[10px] text-[#5d4037] opacity-50">
        VER: 1.1.0 // P2P_CONNECTION: {connected ? 'ACTIVE' : 'IDLE'}
      </div>
    </div>
  );
};

export default App;