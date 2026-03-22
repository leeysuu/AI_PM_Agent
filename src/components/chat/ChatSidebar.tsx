import type { ChatMessage } from '../../types';

interface ChatSidebarProps {
  messages: ChatMessage[];
}

const typeIcons: Record<string, string> = {
  decision: '📋',
  newTask: '📌',
  risk: '⚠️',
  none: '💬',
};

const typeLabels: Record<string, string> = {
  decision: '의사결정',
  newTask: '새 태스크',
  risk: '리스크',
  none: '기타',
};

export default function ChatSidebar({ messages }: ChatSidebarProps) {
  // Show detections with confidence < 0.7
  const lowConfidenceDetections = messages
    .filter((m) => m.aiDetection && m.aiDetection.confidence < 0.7 && m.aiDetection.type !== 'none')
    .map((m) => ({ messageId: m.id, detection: m.aiDetection! }));

  return (
    <aside className="w-72 border-l border-gray-200 bg-gray-50 flex flex-col" aria-label="AI 감지 사이드바">
      <div className="p-3 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-700">🔍 AI 감지 항목</h2>
        <p className="text-xs text-gray-400 mt-0.5">확신도 낮은 감지 결과</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {lowConfidenceDetections.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">감지된 항목이 없습니다</p>
        ) : (
          lowConfidenceDetections.map(({ messageId, detection }) => (
            <div
              key={messageId}
              className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span aria-hidden="true">{typeIcons[detection.type] || '💬'}</span>
                <span className="text-xs font-medium text-gray-700">
                  {typeLabels[detection.type] || detection.type}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{detection.detail}</p>
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${detection.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  {(detection.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
