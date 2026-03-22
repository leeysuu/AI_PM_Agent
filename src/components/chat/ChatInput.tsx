import { useState, type FormEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-gray-200 bg-white">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="메시지를 입력하세요..."
        disabled={disabled}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-label="채팅 메시지 입력"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        aria-label="메시지 전송"
      >
        전송
      </button>
    </form>
  );
}
