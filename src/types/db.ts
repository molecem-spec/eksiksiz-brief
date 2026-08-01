export type UserRole = 'agency' | 'client';

export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'info_needed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';

/** Marka = müşteri. Sistemde tek seviye vardır. */
export interface Brand {
  id: string;
  name: string;
  contact_email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  /** Kişinin bağlı olduğu ekip, örn. "18.12 Art Ekibi" */
  team_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

/** Form cevaplari: alan anahtari -> deger */
export type Answers = Record<string, string | string[] | boolean | null>;

export interface BriefRequest {
  id: string;
  ref: number;
  brand_id: string;
  created_by: string | null;
  title: string;
  status: RequestStatus;
  priority: RequestPriority;
  /** Yayın / etkinlik tarihi (müşteri girer) */
  use_date: string | null;
  /** Ajansın belirlediği iç teslim tarihi (müşteri görmez) */
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
  assignee: Pick<Profile, 'id' | 'full_name'> | null;
}

/** Giris ekrani metinleri ve gorseli */
export interface SiteSettings {
  id: number;
  app_name: string;
  login_title: string;
  login_intro: string;
  login_image_path: string | null;
  updated_at: string;
  updated_by: string | null;
}
