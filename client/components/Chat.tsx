import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../lib/api';

interface ChatProps {
  gameId?: string;
  gameType?: string; // 'ai', 'private', 'public'
}

interface ChatMessage {
  user: string;
  message: string;
  timestamp: number;
}

const QUICK_MESSAGES = ['Good luck', 'Good game', 'Thank you'];

export default function Chat({ gameId, gameType }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameId) return;
    const socket = getSocket();

    const handleChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chatMessage', handleChatMessage);
    return () => {
      socket.off('chatMessage', handleChatMessage);
    };
  }, [gameId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim() || !gameId) return;
    const socket = getSocket();
    socket.emit('chatMessage', { gameId, message: text });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage(input);
    }
  };

  if (!gameId) return null;

  const isFreeChat = gameType === 'private';

  return (
    <div className="mt-4 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-3">
      <div className="h-32 overflow-y-auto mb-2 space-y-1 text-sm">
        {messages.map((msg, i) => (
          <div key={i}>
            <span className="font-bold text-gray-700 dark:text-gray-300">
              {msg.user}:
            </span>{' '}
            <span className="text-gray-600 dark:text-gray-400">{msg.message}</span>
            <span className="text-xs text-gray-400 ml-2">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isFreeChat ? (
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
            placeholder="Введите сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
            onClick={() => sendMessage(input)}
          >
            Отправить
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {QUICK_MESSAGES.map((msg) => (
            <button
              key={msg}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs"
              onClick={() => sendMessage(msg)}
            >
              {msg}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}