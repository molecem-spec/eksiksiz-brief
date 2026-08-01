import { createClient } from '@/lib/supabase/server';
import type { CommentItem } from '@/components/CommentThread';
import type { TimelineItem } from '@/components/Timeline';
import type { BriefRequest, Brand, Profile, RequestFieldFlag, RequestFile } from '@/types/db';

export interface RequestDetail {
  request: BriefRequest;
  brand: Pick<Brand, 'id' | 'name'> | null;
  creator: Pick<Profile, 'id' | 'full_name' | 'email' | 'team_name'> | null;
  assignee: Pick<Profile, 'id' | 'full_name'> | null;
  files: RequestFile[];
  comments: CommentItem[];
  flags: RequestFieldFlag[];
  events: TimelineItem[];
}

/**
 * Talep detayini ilgili kayitlariyla yukler.
 * Gorunurluk RLS tarafindan belirlenir: musteri kullanicisi ic notlari ve
 * ajans ici hareketleri hic gormez.
 */
export async function loadRequestDetail(id: string): Promise<RequestDetail | null> {
  const supabase = await createClient();

  const { data: request } = await supabase
    .from('requests')
    .select('*, brand:brands(id, name)')
    .eq('id', id)
    .maybeSingle();

  if (!request) return null;

  const [{ data: files }, { data: comments }, { data: flags }, { data: events }] =
    await Promise.all([
      supabase.from('request_files').select('*').eq('request_id', id).order('created_at'),
      supabase
        .from('request_comments')
        .select('*')
        .eq('request_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('request_field_flags')
        .select('*')
        .eq('request_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('request_events')
        .select('*')
        .eq('request_id', id)
        .order('created_at', { ascending: false }),
    ]);

  // Yorum ve hareket sahiplerinin adlarini tek sorguda cek.
  const personIds = new Set<string>();
  for (const comment of comments ?? []) if (comment.author_id) personIds.add(comment.author_id);
  for (const event of events ?? []) if (event.actor_id) personIds.add(event.actor_id);
  if (request.created_by) personIds.add(request.created_by);
  if (request.assigned_to) personIds.add(request.assigned_to);

  const { data: people } = personIds.size
    ? await supabase
        .from('profiles')
        .select('id, full_name, email, role, team_name')
        .in('id', Array.from(personIds))
    : { data: [] };

  const peopleMap = new Map((people ?? []).map((p: any) => [p.id, p]));
  const nameOf = (personId: string | null) => {
    if (!personId) return 'Sistem';
    const person = peopleMap.get(personId);
    return person?.full_name || person?.email || 'Bilinmeyen kullanıcı';
  };

  return {
    request: request as BriefRequest,
    brand: (request as any).brand ?? null,
    creator: request.created_by ? (peopleMap.get(request.created_by) ?? null) : null,
    assignee: request.assigned_to ? (peopleMap.get(request.assigned_to) ?? null) : null,
    files: (files ?? []) as RequestFile[],
    comments: (comments ?? []).map((comment: any) => ({
      id: comment.id,
      body: comment.body,
      is_internal: comment.is_internal,
      created_at: comment.created_at,
      author_name: nameOf(comment.author_id),
      author_team: peopleMap.get(comment.author_id)?.team_name ?? null,
      author_role: peopleMap.get(comment.author_id)?.role ?? null,
    })),
    flags: (flags ?? []) as RequestFieldFlag[],
    events: (events ?? []).map((event: any) => ({
      ...event,
      actor_name: nameOf(event.actor_id),
    })),
  };
}
