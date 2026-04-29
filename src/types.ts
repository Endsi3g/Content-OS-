export type AssetStatus = 
  | 'inbox' 
  | 'to_classify' 
  | 'ready_clipping' 
  | 'processing' 
  | 'received' 
  | 'review' 
  | 'approved' 
  | 'published';

export interface Workspace {
  id: string;
  name: string;
  icon: string;
}

export interface Asset {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  client: string;
  campaign: string;
  status: AssetStatus;
  duration: string;
  createdAt: string;
  order: number;
  thumbnailUrl?: string;
  videoUrl?: string;
}

export type ClipStatus = 'pending' | 'approved' | 'rejected';

export interface Clip {
  id: string;
  assetId: string;
  title: string;
  duration: string;
  status: ClipStatus;
  hook: string;
  createdAt: string;
  comments?: string;
  thumbnailUrl?: string;
  platform?: string;
}

export interface Script {
  id: string;
  title: string;
  content: string;
  assetId?: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChangelogCategory = 'feature' | 'bugfix' | 'chat';

export interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  category: ChangelogCategory;
  date: string;
  author?: string;
}

export type DocType = 'sop' | 'brief' | 'template';

export type Role = string;

export interface CustomRole {
  id: string;
  name: string;
  allowedViews: string[]; // e.g., 'overview', 'analytics', 'scripts', etc.
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  bio?: string;
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  type: DocType;
  content: string;
  lastUpdated: string;
  fileUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}
