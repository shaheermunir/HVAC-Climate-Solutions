import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  X,
  Send,
  Phone,
  Calendar,
  AlertTriangle,
  Bot,
  User,
  ShieldCheck,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
}

export const AiChatWidget: React.FC = () => {
  const { isAiChatOpen, setIsAiChatOpen, settings, openBookingModal, openEmergencyModal } = useApp();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm your Virtual Climate Assistant. I can help answer HVAC questions, troubleshoot nonhazardous cooling/heating symptoms, calculate home sizing estimates, or guide you to booking. How can I assist you today?",
      time: 'Just now',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const phone = settings?.primaryPhone || '(800) 555-0199';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    'My AC is blowing warm air',
    'Why is my evaporator coil frozen?',
    'What size HVAC for a 2,200 sq ft home?',
    'How much do heat pump tax credits save?',
  ];

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history format
      const history = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.reply || 'I am ready to help. Would you like to schedule an appointment with a certified technician?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: `Our diagnostic system is temporarily offline. For immediate assistance, please call our 24/7 service center directly at ${phone}.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAiChatOpen) {
    return (
      <button
        onClick={() => setIsAiChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-blue-700 hover:bg-blue-800 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95 group focus:outline-hidden"
        aria-label="Open HVAC AI Assistant"
      >
        <Sparkles className="w-5 h-5 text-amber-300" />
        <span className="font-bold text-xs pr-1">HVAC Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[560px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-slate-100 font-heading">Climate Assistant</h3>
              <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-blue-950 text-blue-300 border border-blue-800 rounded">
                Gemini 3.8
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Certified NATE-aligned knowledge</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsAiChatOpen(false)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-amber-50 px-3 py-1.5 border-b border-amber-200 text-[10px] text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Nonhazardous advisory only. Never touch live electrical or gas lines.</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'model' && (
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl p-3 leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-700 text-white rounded-br-xs'
                  : 'bg-slate-100 text-slate-900 rounded-bl-xs'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div className={`text-[9px] mt-1 text-right ${m.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                {m.time}
              </div>
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-slate-400 text-xs pl-2">
            <Bot className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>Analyzing climate systems...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 overflow-x-auto whitespace-nowrap space-x-1.5 flex text-[11px]">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:border-blue-300 transition-colors shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-200 bg-white space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about AC, heat pumps, or pricing..."
            className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Live Escalation Bar */}
        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
          <button
            onClick={() => {
              setIsAiChatOpen(false);
              openBookingModal();
            }}
            className="text-blue-700 hover:underline flex items-center gap-1 font-semibold"
          >
            <Calendar className="w-3 h-3" />
            <span>Book Online</span>
          </button>
          <a
            href={`tel:${phone.replace(/\D/g, '')}`}
            className="text-slate-700 hover:text-blue-700 flex items-center gap-1 font-semibold"
          >
            <Phone className="w-3 h-3 text-slate-400" />
            <span>Call Live Specialist: {phone}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
