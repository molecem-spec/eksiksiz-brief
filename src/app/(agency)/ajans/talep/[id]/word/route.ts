import { NextResponse } from 'next/server';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { requireAgency } from '@/lib/auth';
import { allSections, formatAnswer, hasValue, visibleFields } from '@/lib/brief';
import { loadRequestDetail } from '@/lib/queries';
import { loadSettings } from '@/lib/settings';
import { PRIORITY_META, statusLabel } from '@/lib/status';
import { formatDate, formatDateTime, safeFileName } from '@/lib/utils';
import type { Answers } from '@/types/db';

export const dynamic = 'force-dynamic';

const BRAND = '7A4FD8';
const MUTED = '6B7280';

function label(text: string) {
  return new Paragraph({
    spacing: { before: 120, after: 40 },
    children: [new TextRun({ text, bold: true, size: 18, color: MUTED })],
  });
}

function value(text: string) {
  // Cok satirli cevaplarin satir sonlari korunur.
  const lines = text.split('\n');
  return new Paragraph({
    spacing: { after: 120 },
    children: lines.flatMap((line, index) =>
      index === 0
        ? [new TextRun({ text: line, size: 22 })]
        : [new TextRun({ text: line, size: 22, break: 1 })]
    ),
  });
}

function heading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E0D4EA', space: 4 } },
    children: [new TextRun({ text, bold: true, size: 26, color: BRAND })],
  });
}

/** Ust bilgi tablosu: iki sutunlu, kenarliksiz. */
function infoTable(rows: [string, string][]) {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    rows: rows.map(
      ([key, val]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              margins: { top: 40, bottom: 40 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: key, size: 20, color: MUTED })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              margins: { top: 40, bottom: 40 },
              children: [
                new Paragraph({ children: [new TextRun({ text: val, size: 20, bold: true })] }),
              ],
            }),
          ],
        })
    ),
  });
}

/** Talebi Word belgesi olarak indirir. Ajans ici notlar dahil edilmez. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await requireAgency();

  const [detail, settings] = await Promise.all([loadRequestDetail(id), loadSettings()]);
  if (!detail) return new NextResponse('Talep bulunamadı', { status: 404 });

  const { request, brand, creator, files, comments } = detail;
  const answers = (request.answers ?? {}) as Answers;
  const publicComments = comments.filter((comment) => !comment.is_internal);

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `${settings.app_name} · Talep no #${request.ref}`,
          size: 18,
          color: MUTED,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: request.title || 'İsimsiz talep', bold: true, size: 40, color: BRAND }),
      ],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [new TextRun({ text: brand?.name ?? '', size: 22, color: MUTED })],
    }),

    infoTable([
      ['Durum', statusLabel(request.status)],
      ['Öncelik', PRIORITY_META[request.priority].label],
      ['Talebi açan', creator?.full_name || creator?.email || '—'],
      ['Talep tarihi', formatDateTime(request.submitted_at ?? request.created_at)],
      ['Yayın / etkinlik tarihi', formatDate(request.use_date)],
      ['İç teslim tarihi', formatDate(request.deadline)],
    ]),
  ];

  // Brif cevaplari: bos alanlar dokumanı sismesin diye atlanir.
  for (const section of allSections()) {
    const fields = visibleFields(section, answers).filter((field) => hasValue(answers[field.key]));
    if (fields.length === 0) continue;

    children.push(heading(section.title));
    for (const field of fields) {
      children.push(label(field.label));
      children.push(value(formatAnswer(answers[field.key])));
    }
  }

  if (files.length > 0) {
    children.push(heading('Yüklenen dosyalar'));
    for (const file of files) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: file.file_name, size: 22 }),
            new TextRun({ text: `  (${file.category})`, size: 20, color: MUTED }),
          ],
        })
      );
    }
  }

  if (publicComments.length > 0) {
    children.push(heading('Yazışmalar'));
    for (const comment of publicComments) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 20 },
          children: [
            new TextRun({
              text: `${comment.author_name} · ${formatDateTime(comment.created_at)}`,
              size: 18,
              color: MUTED,
            }),
          ],
        })
      );
      children.push(value(comment.body));
    }
  }

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Bu döküm ${formatDateTime(new Date().toISOString())} tarihinde oluşturuldu. Ajans içi notlar dahil değildir.`,
          size: 16,
          color: MUTED,
        }),
      ],
    })
  );

  const doc = new Document({
    creator: settings.app_name,
    title: request.title || 'İş talebi',
    styles: {
      default: {
        document: { run: { font: 'Calibri' } },
      },
    },
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const fileName = safeFileName(`${request.ref}-${request.title || 'talep'}`) || 'talep';

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${fileName}.docx"`,
      'Cache-Control': 'no-store',
    },
  });
}
