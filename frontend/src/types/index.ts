export interface User {
  id: string;
  name?: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AnalysisSession {
  id: string;
  title?: string;
  status: string;
  dataset_id?: string;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'ai' | 'error' | 'system';
  content: string;
  generated_code?: string;
  images?: string[];
  execution_status?: string;
  created_at: string;
}

export interface Dataset {
  id: string;
  name: string;
  original_filename: string;
  file_format: string;
  file_size: number;
  row_count?: number;
  col_count?: number;
  status: string;
  created_at: string;
}

export interface AnalysisResponse {
  message: string;
  insights?: any;
  ai_code_written?: string;
  images?: string[];
  session_id: string;
}

export interface ChatRequest {
  prompt: string;
  context?: string;
  session_id?: string;
}

export interface ChatResponse {
  response: string;
}
