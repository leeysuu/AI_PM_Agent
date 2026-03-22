// types/index.ts — AI 조별과제 PM 에이전트 데이터 모델

export interface Team {
  id: string;
  projectName: string;
  topic: string;
  deadline: string;              // ISO 8601 (YYYY-MM-DD)
  members: Member[];
  tasks: Task[];
  milestones: Milestone[];
  chatMessages: ChatMessage[];
  aiSuggestions: AISuggestion[];
  alerts: Alert[];
  report: Report | null;
  pointAccounts: PointAccount[];
  pointPredictions: PointPrediction[];
  settlementResult: SettlementResult | null;
  createdAt: string;             // ISO 8601
}

export interface Member {
  id: string;
  name: string;
  department: string;
  strength: string;
  assignedTasks: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  startDate: string;
  deadline: string;
  progress: number;              // 0-100
  status: 'todo' | 'inProgress' | 'done';
  difficulty: '상' | '중' | '하';
  submittedContent: string | null;
  review: Review | null;
  lastUpdated: string;
}

export interface Milestone {
  week: number;
  startDate: string;
  endDate: string;
  goals: string[];
  keyDeadlines: string[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  aiDetection: {
    type: 'decision' | 'newTask' | 'risk' | 'none';
    confidence: number;
    detail: string;
  } | null;
}

export interface AISuggestion {
  id: string;
  type: 'reassign' | 'extend' | 'reduce_scope' | 'pair_work' | 'split_task';
  content: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  previousSuggestions: string[];
  relatedTaskId: string;
  round: number;
  createdAt: string;
}

export interface Review {
  taskId: string;
  scores: {
    completeness: number;
    logic: number;
    volume: number;
    relevance: number;
    total: number;
  };
  feedback: string[];
  suggestedProgress: number;
  delayDetection: {
    expectedProgress: number;
    actualProgress: number;
    gap: number;
    severity: 'critical' | 'warning' | 'normal';
  };
}

export interface Alert {
  id: string;
  message: string;
  type: 'deadline' | 'delay' | 'nudge' | 'completion';
  target: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface Report {
  title: string;
  sections: ReportSection[];
  status: 'draft' | 'approved';
  pptSlides: PPTSlide[] | null;
}

export interface ReportSection {
  title: string;
  content: string;
  author: string;
  aiComments: string[];
}

export interface PPTSlide {
  slideNumber: number;
  title: string;
  content: string;
  keywords: string[];
  speakerNotes: string;
}

export interface MarketListing {
  id: string;
  teamId: string;
  title: string;
  subject: string;
  department: string;
  qualityScore: number;
  price: number;
  aiSummary: string;
  fullContent: string;
  reviewReport: Report;
  contributionData: {
    memberId: string;
    memberName: string;
    contribution: number;
  }[];
  salesCount: number;
  createdAt: string;
}

// ── 포인트 시스템 ──

export type PointEventType =
  | 'deposit'           // 보증금 차감
  | 'submit'            // 결과물 제출 +5
  | 'quality_bonus'     // 품질 80점 이상 +10
  | 'early_submit'      // 마감 전 제출 +3
  | 'accept_suggestion' // AI 제안 수락 후 실행 +5
  | 'constructive'      // 건설적 의견 +2
  | 'no_response'       // 3일 이상 무응답 -5
  | 'overdue'           // 마감 초과 -10
  | 'reject_streak'     // AI 제안 3회 연속 거절 -5
  | 'settlement'        // 프로젝트 종료 정산
  | 'exchange';         // 포인트 교환

export interface PointEvent {
  id: string;
  memberId: string;
  type: PointEventType;
  amount: number;         // 양수=획득, 음수=차감
  reason: string;
  createdAt: string;
}

export interface PointCertificate {
  type: 'best_collaborator' | 'quality_star' | 'deadline_master';
  projectName: string;
  issuedAt: string;       // ISO 8601
}

export interface PointAccount {
  memberId: string;
  balance: number;        // 현재 잔액
  deposit: number;        // 보증금 (20pt)
  history: PointEvent[];
  badges: string[];       // 획득한 뱃지 목록
  certificates: PointCertificate[]; // 인증서 목록
}

export interface PointPrediction {
  memberId: string;
  predictedChange: number;
  warning: string | null;
  motivationMessage: string;
}

export interface SettlementResult {
  members: {
    memberId: string;
    pointChange: number;
    reason: string;
    totalPoints: number;
    badge: string | null;
    certificate: PointCertificate | null;
  }[];
  bestCollaborator: string;  // memberId
  aiComment: string;
}

export interface ExchangeItem {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export type ExchangeItemType = 'ai_matching' | 'cover_letter' | 'collaborator_badge';

export const EXCHANGE_COSTS: Record<ExchangeItemType, number> = {
  ai_matching: 20,
  cover_letter: 15,
  collaborator_badge: 50,
};

export interface AppliedChange {
  type: 'reassign_task' | 'extend_deadline' | 'reduce_scope' | 'add_task' | 'split_task';
  taskId: string;
  details: Record<string, unknown>;
}

export type TeamAction =
  | { type: 'SET_TEAM'; payload: Team }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; updates: Partial<Task> } }
  | { type: 'UPDATE_REVIEW'; payload: { taskId: string; review: Review; suggestion?: AISuggestion } }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'ADD_DETECTION'; payload: { messageId: string; detection: ChatMessage['aiDetection'] } }
  | { type: 'ADD_SUGGESTION'; payload: AISuggestion }
  | { type: 'UPDATE_SUGGESTION'; payload: { id: string; status: AISuggestion['status']; rejectionReason?: string } }
  | { type: 'APPLY_CHANGES'; payload: AppliedChange[] }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'SET_REPORT'; payload: Report }
  | { type: 'APPROVE_REPORT' }
  | { type: 'SET_PPT_SLIDES'; payload: PPTSlide[] }
  | { type: 'ADD_MARKET_LISTING'; payload: MarketListing }
  | { type: 'LOAD_FROM_STORAGE'; payload: Team }
  | { type: 'INIT_POINT_ACCOUNTS'; payload: PointAccount[] }
  | { type: 'UPDATE_POINT_ACCOUNT'; payload: { memberId: string; updates: Partial<PointAccount> } }
  | { type: 'ADD_POINT_EVENT'; payload: PointEvent }
  | { type: 'SET_POINT_PREDICTIONS'; payload: PointPrediction[] }
  | { type: 'SET_SETTLEMENT_RESULT'; payload: SettlementResult };
