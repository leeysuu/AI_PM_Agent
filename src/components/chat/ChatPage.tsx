import { useState, useCallback } from 'react';
import { useTeamContext } from '../../context/TeamContext';
import { useChat } from '../../hooks/useChat';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import ChatSidebar from './ChatSidebar';

export default function ChatPage() {
  const { team } = useTeamContext();
  const { messages, sending, sendMessage } = useChat();
  const [selectedSender, setSelectedSender] = useState<string>('');

  const members = team?.members ?? [];

  const handleSend = useCallback(
    async (content: string) => {
      if (!selectedSender) return;
      await sendMessage(content, selectedSender);
    },
    [selectedSender, sendMessage],
  );

  if (!team) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 p-8">
        팀을 먼저 생성해 주세요.
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with member selector */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
          <h1 className="text-sm font-semibold text-gray-700">💬 팀 채팅</h1>
          <select
            value={selectedSender}
            onChange={(e) => setSelectedSender(e.target.value)}
            className="ml-auto text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="발신자 선택"
          >
            <option value="">발신자 선택</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Message list */}
        <ChatMessageList messages={messages} members={members} />

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          disabled={sending || !selectedSender}
        />
      </div>

      {/* Sidebar */}
      <ChatSidebar messages={messages} />
    </div>
  );
}
