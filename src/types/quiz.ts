export type Role = 'teacher' | 'student';

export type QuestionType = 'multiple_choice' | 'true_false' | 'image' | 'audio' | 'video';

export type OptionColor = 'red' | 'blue' | 'yellow' | 'green';

export interface Option {
  id: string;
  question_id?: string;
  option_text: string;
  option_color: OptionColor;
  is_correct: boolean;
  order_index: number;
}

export interface Question {
  id: string;
  quiz_id?: string;
  question_text: string;
  question_type: QuestionType;
  media_url?: string;
  media_type?: 'image' | 'audio' | 'video' | 'none';
  timer_seconds: number;
  explanation?: string;
  order_index: number;
  options: Option[];
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  code: string;
  status: 'draft' | 'published';
  cover_image?: string;
  default_timer: number;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_name: string;
  student_id?: string;
  total_score: number;
  correct_count: number;
  total_questions: number;
  accuracy_percentage: number;
  time_taken_seconds: number;
  completed_at: string;
  answers?: StudentAnswer[];
}

export interface StudentAnswer {
  question_id: string;
  selected_option_id: string;
  is_correct: boolean;
  points_earned: number;
  response_time_ms: number;
}

export interface LeaderboardEntry {
  id: string;
  quiz_id: string;
  student_name: string;
  score: number;
  rank: number;
  is_current_user?: boolean;
}

export interface UserProfile {
  id: string;
  role: Role;
  name: string;
  avatar: string;
}

export interface LobbyPlayer {
  id: string;
  quiz_id: string;
  student_name: string;
  avatar: string;
}

export type LiveQuizSessionStatus = 'waiting' | 'live' | 'finished';

export interface LiveQuizSession {
  id: string;
  quiz_id: string;
  host_id?: string | null;
  status: LiveQuizSessionStatus;
  created_at: string;
}

export interface LiveQuizParticipant {
  id: string;
  session_id: string;
  quiz_id: string;
  student_id?: string | null;
  student_name: string;
  avatar?: string | null;
  joined_at: string;
}
