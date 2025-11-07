
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Send, Bot, Volume2, Copy, ThumbsUp, Check, Loader2, Mic } from 'lucide-react';
import type { UserScreen } from '../../types';

interface AssistantScreenProps {
  t: { [key: string]: string };
  setScreen: (screen: UserScreen) => void;
}

type Message = {
  role: 'user' | 'model';
  text: string;
};

// --- Audio Helper Functions for TTS ---
function decodeFromBase64(base64: string) {
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
// --- End Audio Helper Functions ---

const AssistantScreen: React.FC<AssistantScreenProps> = ({ t, setScreen }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isSpeechLoading, setIsSpeechLoading] = useState<number | null>(null);
  const [outputAudioContext, setOutputAudioContext] = useState<AudioContext | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const newChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are an expert AI assistant specializing in application development. Your goal is to provide clear, concise, and helpful answers to questions about how to build applications. Keep your responses short and to the point. Answer in the same language as the user's question.",
      },
    });
    setChat(newChat);
    setMessages([{ role: 'model', text: t.welcome_assistant }]);

    const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    setOutputAudioContext(outCtx);

    return () => {
        if (currentAudioSource.current) {
            currentAudioSource.current.stop();
        }
        outCtx.close();
    }
  }, [t.welcome_assistant]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !chat) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chat.sendMessageStream({ message: input });
      let modelResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of response) {
        modelResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = modelResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSpeak = async (text: string, index: number) => {
    if (currentAudioSource.current) {
      currentAudioSource.current.stop();
      currentAudioSource.current = null;
    }

    if (speakingIndex === index) {
      setSpeakingIndex(null);
      return;
    }
    
    if (!outputAudioContext) return;
    if (outputAudioContext.state === 'suspended') {
      outputAudioContext.resume();
    }

    setIsSpeechLoading(index);
    setSpeakingIndex(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBytes = decodeFromBase64(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, outputAudioContext, 24000, 1);
        
        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContext.destination);
        
        source.onended = () => {
          setSpeakingIndex(null);
          currentAudioSource.current = null;
        };
        
        source.start();
        currentAudioSource.current = source;
        setSpeakingIndex(index);
      }
    } catch (err) {
      console.error("Error generating speech:", err);
      alert("Sorry, could not generate audio.");
    } finally {
      setIsSpeechLoading(null);
    }
  };

  const handleLike = (index: number) => {
    setLikedMessages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        return newSet;
    });
  };

  const TypingIndicator = () => (
    <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot size={24} className="text-gray-600" />
        </div>
        <div className="bg-gray-200 rounded-2xl p-3 flex items-center gap-2 rounded-bl-none">
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
        </div>
    </div>
  );

  return (
    <div>
      <div className="bg-white shadow-md p-4">
        <h1 className="text-2xl font-bold text-purple-600">🤖 {t.assistant}</h1>
      </div>
      
      <div className="w-full max-w-3xl mx-auto px-4 py-4">
        <div className="space-y-4 mb-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot size={24} className="text-gray-600" />
                    </div>
                  )}
                  <div className={`rounded-2xl p-3 whitespace-pre-wrap max-w-lg ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
              </div>
              {msg.role === 'model' && msg.text && (
                <div className="flex items-center gap-3 mt-2" style={{ paddingLeft: '52px' }}>
                    <button onClick={() => handleCopy(msg.text, index)} className="text-gray-500 hover:text-blue-600 transition-colors" title="Copy">
                        {copiedIndex === index ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                    </button>
                    <button onClick={() => handleSpeak(msg.text, index)} className="text-gray-500 hover:text-blue-600 transition-colors w-5 h-5 flex items-center justify-center" title="Speak">
                        {isSpeechLoading === index ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} className={speakingIndex === index ? 'text-blue-600 animate-pulse' : ''} />}
                    </button>
                    <button onClick={() => handleLike(index)} className="text-gray-500 hover:text-blue-600 transition-colors" title="Like">
                        <ThumbsUp size={18} className={likedMessages.has(index) ? 'text-blue-600 fill-blue-200' : ''} />
                    </button>
                </div>
              )}
            </div>
          ))}
          {loading && <TypingIndicator />}
        </div>
        <div ref={messagesEndRef} />
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-white border rounded-full p-1 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.ask_anything_dev}
            className="flex-grow px-4 py-2 bg-transparent focus:outline-none disabled:bg-gray-100/50 rounded-full"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setScreen('live-assistant')}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Start voice chat"
          >
            <Mic size={20} />
          </button>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssistantScreen;
