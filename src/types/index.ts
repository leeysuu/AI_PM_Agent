<<<<<<< HEAD
=======
// types/index.ts — AI 조별과제 PM 에이전트 데이터 모델

>>>>>>> origin/main
export interface Team {
  id: string;
  projectName: string;
  topic: string;
<<<<<<< HEAD
  deadline: string;
=======
  deadline: string;              // ISO 8601 (YYYY-MM-DD)
>>>>>>> origin/main
  members: Member[];
  tasks: Task[];
  milestones: Milestone[];
  chatMessages: ChatMessage[];
  aiSuggestions: AISuggestion[];
  alerts: Alert[];
  report: Report | null;
<<<<<<< HEAD
  createdAt: string;
=======
  createdAt: string;             // ISO 8601
>>>>>>> origin/main
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
<<<<<<< HEAD
  progress: number;
=======
  progress: number;              // 0-100
>>>>>>> origin/main
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
<<<<<<< HEAD
  contributionData: { memberId: string; memberName: string; contribution: number }[];
=======
  contributionData: {
    memberId: string;
    memberName: string;
    contribution: number;
  }[];
>>>>>>> origin/main
  salesCount: number;
  createdAt: string;
}

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
  | { type: 'LOAD_FROM_STORAGE'; payload: Team };
