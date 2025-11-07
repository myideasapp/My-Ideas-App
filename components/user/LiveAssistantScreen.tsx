import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, LiveSession, Blob } from "@google/genai";
import { ChevronLeft, Phone } from 'lucide-react';
import type { UserScreen } from '../../types';

// --- Audio Helper Functions for Gemini Live API (Raw PCM) ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
// --- End Audio Helper Functions ---

interface LiveAssistantScreenProps {
  setScreen: (screen: UserScreen) => void;
  t: { [key: string]: string };
}

type SessionStatus = 'connecting' | 'listening' | 'speaking' | 'ended' | 'error';

const Avatar: React.FC<{ status: SessionStatus }> = ({ status }) => {
  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';

  return (
    <div className="relative w-64 h-80 flex items-center justify-center">
      <style>
        {`
          @keyframes talk-animation {
            0%, 100% { height: 4px; transform: scaleY(1); }
            50% { height: 18px; transform: scaleY(1.2); }
          }
          .mouth-speak {
            animation: talk-animation 0.35s infinite ease-in-out;
          }
           @keyframes head-move-speak {
            0%, 100% { transform: translateY(0) rotate(-1deg); }
            50% { transform: translateY(2px) rotate(1deg); }
          }
          .head-speak {
            animation: head-move-speak 1.5s infinite ease-in-out;
          }
          @keyframes idle-breath {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .body-idle {
             animation: idle-breath 4s infinite ease-in-out;
          }
          @keyframes listen-pulse {
            0% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.05); opacity: 0.5; }
            100% { transform: scale(1); opacity: 0.3; }
          }
          .pulse-bg {
            animation: listen-pulse 2.5s infinite ease-in-out;
          }
          @keyframes eye-blink {
             0%, 95%, 100% { transform: scaleY(1); }
             97.5% { transform: scaleY(0.1); }
          }
          .eye-blink {
             animation: eye-blink 5s infinite;
          }
        `}
      </style>
      {/* Pulsing background */}
      <div className={`absolute -inset-2 rounded-full bg-blue-500 transition-colors duration-500 ${isListening ? 'pulse-bg' : 'opacity-0 scale-95'}`} />
      
       {/* Body Container */}
      <div className={`relative w-48 transition-transform duration-300 ${status !== 'speaking' ? 'body-idle' : ''}`}>
        
        {/* Head */}
        <div className={`relative w-48 h-48 rounded-full bg-gradient-to-br from-indigo-300 to-purple-300 flex items-center justify-center shadow-inner overflow-hidden z-10 ${isSpeaking ? 'head-speak' : ''}`}>
            {/* Face elements */}
            <div className="relative w-full h-full">
            {/* Hair */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[110%] h-[60%] bg-[#3a322e] rounded-b-full" />
            {/* Eyes */}
            <div className="absolute top-[35%] w-full flex justify-center gap-8">
                <div className="w-5 h-7 bg-white rounded-full flex items-center justify-center shadow-md eye-blink">
                    <div className="w-2.5 h-4 bg-gray-800 rounded-full" />
                </div>
                <div className="w-5 h-7 bg-white rounded-full flex items-center justify-center shadow-md eye-blink" style={{animationDelay: '0.1s'}}>
                    <div className="w-2.5 h-4 bg-gray-800 rounded-full" />
                </div>
            </div>
            {/* Mouth */}
            <div className={`absolute bottom-[20%] left-1/2 -translate-x-1/2 w-10 bg-[#2c2522]/80 transition-all duration-200 rounded-lg ${isSpeaking ? 'mouth-speak' : 'h-1'}`} />
            </div>
        </div>
        
        {/* Neck */}
        <div className="absolute top-[168px] left-1/2 -translate-x-1/2 w-12 h-10 bg-gradient-to-b from-indigo-200 to-purple-200 z-0" />
        
        {/* Shoulders */}
        <div className="absolute top-[180px] left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-gray-700 to-gray-800 rounded-t-[50%] shadow-lg" />
      </div>
    </div>
  );
};


const LiveAssistantScreen: React.FC<LiveAssistantScreenProps> = ({ setScreen, t }) => {
  const [status, setStatus] = useState<SessionStatus>('connecting');
  
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);


  const handleEndSession = useCallback(() => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    if (inputStreamRef.current) {
        inputStreamRef.current.getTracks().forEach(track => track.stop());
        inputStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    setStatus('ended');
    setScreen('assistant');
  }, [setScreen]);

  useEffect(() => {
    const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    outputAudioContextRef.current = outCtx;

    const startSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        inputStreamRef.current = stream;

        const inputCtx = new(window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        inputAudioContextRef.current = inputCtx;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        sessionPromiseRef.current = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              setStatus('listening');
              const source = inputCtx.createMediaStreamSource(stream);
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              scriptProcessorRef.current = processor;

              processor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromiseRef.current?.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              source.connect(processor);
              processor.connect(inputCtx.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              const outputAudioContext = outputAudioContextRef.current;
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio && outputAudioContext) {
                setStatus('speaking');
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) {
                        setStatus('listening');
                    }
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(source => source.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setStatus('listening');
              }
            },
            onerror: (e: ErrorEvent) => {
              console.error('Session error:', e);
              setStatus('error');
            },
            onclose: (e: CloseEvent) => {
                if (status !== 'ended') {
                    setStatus('ended');
                }
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            systemInstruction: "You are a professional, friendly, and empathetic AI assistant. Your expertise is in application development. When a user speaks to you, respond in a natural, conversational manner, just like a human. Infuse your responses with a warm and helpful tone. Provide clear and concise answers, but feel free to engage in a friendly, human-like conversation. Always answer in the same language as the user's question.",
          },
        });
      } catch (error) {
        console.error('Error starting recording:', error);
        setStatus('error');
        alert('Could not start recording. Please ensure you have given microphone permissions.');
      }
    };

    startSession();

    return () => {
        handleEndSession();
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
        }
    }
  }, [handleEndSession]);

  const getStatusInfo = () => {
    switch(status) {
        case 'connecting': return 'Connecting...';
        case 'listening': return 'Listening...';
        case 'speaking': return 'Speaking...';
        case 'ended': return 'Session Ended';
        case 'error': return 'Connection Error';
        default: return '';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-blue-900 text-white flex flex-col z-50 overflow-hidden">
        <div className="p-4 flex items-center justify-between flex-shrink-0">
            <button onClick={handleEndSession} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold">Live Assistant</h1>
            <div className="w-10"></div>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center p-4">
            <Avatar status={status} />
            <p className="mt-6 text-2xl font-semibold tracking-wider h-8">{getStatusInfo()}</p>
        </div>
        
        <div className="p-4 flex justify-center flex-shrink-0">
            <button onClick={handleEndSession} className="bg-red-600 p-4 rounded-full shadow-lg hover:bg-red-700 transition-transform transform hover:scale-105">
                <Phone size={32} />
            </button>
        </div>
    </div>
  );
};

export default LiveAssistantScreen;