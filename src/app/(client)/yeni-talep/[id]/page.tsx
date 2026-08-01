import { notFound, redirect } from 'next/navigation';
import { requireClient } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Answers, BriefRequest, RequestFieldFlag, RequestFile } from '@/types/db';
import BriefWizard from './BriefWizard';

export const metadata = { title: 'İş talebi formu · Eksiksiz Brif' };
export const dynamic = 'force-dynamic';

export default async function EditRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireClient();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from('requests')
    .select('*, brand:brands(id, name)')
    .eq('id', id)
    .maybeSingle();

  if (!request) notFound();

  // Iletilmis talep formda duzenlenemez; detay ekranina gonderilir.
  if (request.status !== 'draft' && request.status !== 'info_needed') {
    redirect(`/talep/${id}`);
  }

  const [{ data: files }, { data: flags }] = await Promise.all([
    supabase.from('request_files').select('*').eq('request_id', id).order('created_at'),
    supabase.from('request_field_flags').select('*').eq('request_id', id).eq('resolved', false),
  ]);

  return (
    <BriefWizard
      request={request as BriefRequest & { brand: { id: string; name: string } | null }}
      initialAnswers={(request.answers ?? {}) as Answers}
      files={(files ?? []) as RequestFile[]}
      flags={(flags ?? []) as RequestFieldFlag[]}
    />
  );
}
