'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    fullName: string;
    companyName: string;
    role: string;
  };
}

export default function ChatBox({ loadId, currentUserId }: { loadId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastSyncRef = useRef<string | null>(null);

  const fetchMessages = async () => {
    try {
      const url = lastSyncRef.current 
        ? `/api/chat?loadId=${loadId}&lastSync=${encodeURIComponent(lastSyncRef.current)}`
        : `/api/chat?loadId=${loadId}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const newMessages: Message[] = data.messages;
        
        if (newMessages.length > 0) {
          lastSyncRef.current = newMessages[newMessages.length - 1].createdAt;
          
          setMessages(prev => {
            const all = [...prev, ...newMessages];
            const uniqueMap = new Map(all.map(m => [m.id, m]));
            return Array.from(uniqueMap.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    lastSyncRef.current = null; // Reset on loadId change
    setMessages([]);
    setLoading(true);
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Smart polling every 10 seconds
    return () => clearInterval(interval);
  }, [loadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const textToSend = newMessage;
    setNewMessage(''); // Optimistic clear

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loadId, content: textToSend })
      });

      if (!res.ok) throw new Error('Failed to send message');
      
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
    } catch (error) {
      toast.error('Failed to send message.');
      setNewMessage(textToSend); // Restore on error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-bold text-gray-800">Live Chat</h3>
        <span className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Connected
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
            <p>No messages yet.</p>
            <p>Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => {
              const isMe = msg.senderId === currentUserId;
              const showName = i === 0 || messages[i - 1].senderId !== msg.senderId;

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showName && !isMe && (
                    <span className="text-[10px] font-bold text-gray-500 ml-1 mb-1">
                      {msg.sender.companyName || msg.sender.fullName} ({msg.sender.role})
                    </span>
                  )}
                  <div 
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                      isMe 
                        ? 'bg-brand-600 text-white rounded-br-sm' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className={`text-[9px] text-gray-400 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            disabled={sending}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:hover:bg-brand-600 text-white p-2.5 rounded-xl transition-colors shadow-sm"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
