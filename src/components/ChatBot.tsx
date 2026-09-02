import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, Loader2, Bot, User, Trash2 } from 'lucide-react';
import type { ChatMessage } from '../types';

export function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'model',
    text: 'Olá! Sou seu assistente financeiro. Como posso ajudar com seu orçamento hoje?'
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: 'user' as const, text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: messages.map(m => ({ role: m.role, text: m.text })),
          message: input
        }),
      });
      const data = await res.json();
      if (data.text) {
        setMessages([...newMessages, { role: 'model', text: data.text }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playTTS = async (text: string, id: string) => {
    if (playingAudio === id) return; // Prevent double play
    setPlayingAudio(id);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(data.audio);
        audio.onended = () => setPlayingAudio(null);
        audio.play();
      } else {
        setPlayingAudio(null);
      }
    } catch (err) {
      console.error(err);
      setPlayingAudio(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Bot className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-white">Assistente IA</h2>
        </div>
        <button 
          onClick={() => setMessages([{ role: 'model', text: 'Olá! Sou seu assistente financeiro. Como posso ajudar com seu orçamento hoje?' }])}
          className="text-slate-500 hover:text-red-400 transition-colors"
          title="Limpar chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-blue-500/20 text-blue-400'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className="flex flex-col gap-1">
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 border border-white/5 text-slate-200 rounded-tl-none'}`}>
                  {msg.text}
                </div>
                {msg.role === 'model' && (
                  <button 
                    onClick={() => playTTS(msg.text, String(i))}
                    className={`self-start flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors ${playingAudio === String(i) ? 'text-blue-400 bg-blue-500/20' : 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10'}`}
                  >
                    {playingAudio === String(i) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                    Ouvir
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-white/10 border border-white/5 text-slate-400 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> Digitando...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte sobre seus gastos..."
            className="w-full pl-5 pr-14 py-4 bg-white/5 border border-white/10 rounded-full text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-slate-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
