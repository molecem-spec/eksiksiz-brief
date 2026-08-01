export type UserRole = 'agency' | 'client';

export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'info_needed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Company {
  id: string;
  name: string;
  contact_email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Brand {
  id: string;
  company_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  company_id: string | null;
  is_active: boolean;
  created_at: string;
}

/** Form cevaplari: alan anahtari -> deger */
export type Answers = Record<string, string | string[] | boolean | null>;

export interface BriefRequest {
  id: string;
  ref: number;
  company_id: string;
  brand_id: string;
  created_by: string | null;
  title: string;
  project_type: string;
  status: RequestStatus;
  priority: RequestPriority;
  use_date: string | null;
  deadline: string | null;
  answers: Answers;
  assigned_to: string | null;
  agency_note: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestFile {
  id: string;
  request_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  category: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface RequestComment {
  id: string;
  request_id: string;
  author_id: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface RequestFieldFlag {
  id: string;
  request_id: string;
  field_key: string;
  field_label: string;
  note: string | null;
  resolved: boolean;
  created_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface RequestEvent {
  id: string;
  request_id: string;
  actor_id: string | null;
  type: string;
  detail: Record<string, any>;
  client_visible: boolean;
  created_at: string;
}

/** Liste ekranlarinda kullanilan, iliskileri gomulu talep kaydi */
export interface RequestListItem extends BriefRequest {
  brand: Pick<Brand, 'id' | 'name'> | null;
  company: Pick<Company, 'id' | 'name'> | null;
  assignee: Pick<Profile, 'id' | 'full_name'> | null;
}
