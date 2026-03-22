import { useEffect, useRef } from 'react';
import type { ChatMessage, Member } from '../../types';

interface ChatMessageListProps {
  messages: ChatMessage[];
  members: Member[];
}

function getSenderName(sender: string, members: Member[]): string {
  if (sender === 'ai') return 'AI PM';
  const member = members.find((m) => m.id === sender);
  return member ? member.name : sender;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatMessageList({ messages, members }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-8">
        아직 메시지가 없습니다. 대화를 시작해 보세요!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-label="채팅 메시지 목록">
      {messages.map((msg) => {
        const isAI = msg.sender === 'ai';
        const senderName = getSenderName(msg.sender, members);

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isAI ? 'items-center' : 'items-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                isAI
                  ? 'bg-purple-50 border border-purple-200 text-purple-900'
                  : 'bg-blue-50 border border-blue-200 text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {isAI && <span className="text-sm" aria-hidden="true">🤖</span>}
                <span className={`text-xs font-semibold ${isAI ? 'text-purple-700' : 'text-blue-700'}`}>
                  {senderName}
                </span>
                <span className="text-xs text-gray-400">{formatTimestamp(msg.timestamp)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
