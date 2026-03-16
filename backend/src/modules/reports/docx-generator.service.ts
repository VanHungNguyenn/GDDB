import { Injectable } from '@nestjs/common';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  VerticalAlign,
  TableLayoutType,
  HeightRule,
} from 'docx';

// ─── Types ────────────────────────────────────────────────

export interface ReportData {
  student: {
    id: string;
    name: string;
    dateOfBirth: string | Date | null;
    parentName: string | null;
    parentPhone: string | null;
    className: string;
  };
  evaluation: {
    id: string;
    month: number;
    year: number;
    status: string;
    notes: string | null;
    teacherName: string;
    finalizedAt: string | Date | null;
  };
  sections: {
    domain: string;
    note: string | null;
    indicator: string | null;
  }[];
}

// ─── Template layout matching the PDF ─────────────────────

interface DomainGroup {
  groupLabel: string | null;
  domains: string[];
}

const TEMPLATE_LAYOUT: DomainGroup[] = [
  {
    groupLabel: 'Kỹ năng\nVận động',
    domains: ['Vận động thô', 'Vận động tinh'],
  },
  {
    groupLabel: null,
    domains: ['Kỹ năng Bắt chước'],
  },
  {
    groupLabel: null,
    domains: ['Luyện hơi/cơ quan cấu âm'],
  },
  {
    groupLabel: null,
    domains: ['Nhận thức'],
  },
  {
    groupLabel: 'Ngôn ngữ',
    domains: ['Ngôn ngữ thể hiện', 'Ngôn ngữ tiếp nhận'],
  },
  {
    groupLabel: 'Kỹ năng',
    domains: ['Kỹ năng tự phục vụ', 'Kỹ năng Giao tiếp - Xã hội'],
  },
  {
    groupLabel: null,
    domains: ['Tập trung chú ý – Giao tiếp mắt'],
  },
  {
    groupLabel: null,
    domains: ['Các vấn đề về hành vi'],
  },
];

// ─── Helpers ──────────────────────────────────────────────

const THIN_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function formatIndicator(indicator: string | null): string {
  switch (indicator) {
    case 'ACHIEVED':
      return '+';
    case 'NEEDS_ASSISTANCE':
      return '+/-';
    case 'NOT_ACHIEVED':
      return '-';
    default:
      return '';
  }
}

function calculateAge(dob: string | Date | null): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age.toString();
}

function textRun(text: string, options?: { bold?: boolean; size?: number; font?: string }): TextRun {
  return new TextRun({
    text,
    bold: options?.bold ?? false,
    size: options?.size ?? 22, // 11pt
    font: options?.font ?? 'Times New Roman',
  });
}

function centeredParagraph(text: string, options?: { bold?: boolean; size?: number; spacing?: number }): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: options?.spacing ?? 0 },
    children: [textRun(text, { bold: options?.bold, size: options?.size })],
  });
}

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class DocxGeneratorService {
  async generateEvaluationDocx(data: ReportData): Promise<Buffer> {
    const sectionsByDomain: Record<string, { note: string | null; indicator: string | null }> = {};
    for (const s of data.sections) {
      sectionsByDomain[s.domain] = { note: s.note, indicator: s.indicator };
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, bottom: 720, left: 1080, right: 1080 },
            },
          },
          children: [
            ...this.buildHeader(data),
            this.buildTable(sectionsByDomain),
            ...this.buildFooter(data),
          ],
        },
      ],
    });

    return Buffer.from(await Packer.toBuffer(doc));
  }

  // ─── Header ───────────────────────────────────────────

  private buildHeader(data: ReportData): Paragraph[] {
    const age = calculateAge(data.student.dateOfBirth);

    return [
      // Center name
      centeredParagraph('TRUNG TÂM GIÁO DỤC TRẺ ĐẶC BIỆT TÂM ANH', {
        bold: true,
        size: 26,
      }),
      // Address
      centeredParagraph('Địa chỉ: Tổ 7, xã Lộc Thái 3, xã Lộc Ninh, tỉnh Đồng Nai', {
        size: 20,
        spacing: 100,
      }),
      // Title
      centeredParagraph(
        `KẾ HOẠCH GIÁO DỤC CÁ NHÂN THÁNG ${data.evaluation.month} NĂM ${data.evaluation.year}`,
        { bold: true, size: 28, spacing: 200 },
      ),
      // Student info
      new Paragraph({
        spacing: { after: 60 },
        children: [
          textRun('Họ và tên học sinh: ', {}),
          textRun(data.student.name, { bold: true }),
          textRun(`          Tuổi: ${age}`, {}),
        ],
      }),
      // Therapist info
      new Paragraph({
        spacing: { after: 60 },
        children: [
          textRun('Họ và tên trị liệu viên: ', {}),
          textRun(data.evaluation.teacherName, { bold: true }),
        ],
      }),
      // Legend
      new Paragraph({
        spacing: { after: 200 },
        alignment: AlignmentType.CENTER,
        children: [
          textRun('Ghi chú: ', { size: 20 }),
          textRun('+ ', { bold: true, size: 20 }),
          textRun('(Đã hoàn thành) ; ', { size: 20 }),
          textRun('+/- ', { bold: true, size: 20 }),
          textRun('(Thực hiện cần trợ giúp); ', { size: 20 }),
          textRun('- ', { bold: true, size: 20 }),
          textRun('(Chưa hoàn thành)', { size: 20 }),
        ],
      }),
    ];
  }

  // ─── Main evaluation table ────────────────────────────

  private buildTable(
    sectionsByDomain: Record<string, { note: string | null; indicator: string | null }>,
  ): Table {
    const rows: TableRow[] = [];

    // Header row
    rows.push(
      new TableRow({
        tableHeader: true,
        children: [
          this.headerCell('Lĩnh vực can thiệp', 2600),
          this.headerCell('Nội dung can thiệp', 5400),
          this.headerCell('Đánh giá', 1500),
        ],
      }),
    );

    // Build domain rows following the PDF layout
    for (const group of TEMPLATE_LAYOUT) {
      if (group.groupLabel && group.domains.length > 1) {
        // Grouped domains: first row has group label with rowSpan
        for (let i = 0; i < group.domains.length; i++) {
          const domainName = group.domains[i];
          const section = sectionsByDomain[domainName] || { note: null, indicator: null };

          const cells: TableCell[] = [];

          if (i === 0) {
            // Group label cell — spans all domain rows in this group
            cells.push(
              new TableCell({
                rowSpan: group.domains.length,
                width: { size: 1100, type: WidthType.DXA },
                borders: THIN_BORDER,
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: group.groupLabel.split('\n').flatMap((line, idx, arr) => {
                      const parts: TextRun[] = [textRun(line, { bold: true, size: 22 })];
                      if (idx < arr.length - 1) parts.push(new TextRun({ break: 1 }));
                      return parts;
                    }),
                  }),
                ],
              }),
            );
          }

          // Domain name cell
          cells.push(
            new TableCell({
              width: { size: 1500, type: WidthType.DXA },
              borders: THIN_BORDER,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [textRun(domainName, { bold: true, size: 21 })],
                }),
              ],
            }),
          );

          // Content cell
          cells.push(this.contentCell(section.note, 5400));

          // Indicator cell
          cells.push(this.indicatorCell(section.indicator, 1500));

          rows.push(
            new TableRow({
              height: { value: 1100, rule: HeightRule.ATLEAST },
              children: cells,
            }),
          );
        }
      } else {
        // Standalone domain: domain name spans cols 1+2
        const domainName = group.domains[0];
        const section = sectionsByDomain[domainName] || { note: null, indicator: null };

        rows.push(
          new TableRow({
            height: { value: 1100, rule: HeightRule.ATLEAST },
            children: [
              new TableCell({
                columnSpan: 2,
                width: { size: 2600, type: WidthType.DXA },
                borders: THIN_BORDER,
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [textRun(domainName, { bold: true, size: 21 })],
                  }),
                ],
              }),
              this.contentCell(section.note, 5400),
              this.indicatorCell(section.indicator, 1500),
            ],
          }),
        );
      }
    }

    return new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 9500, type: WidthType.DXA },
      rows,
    });
  }

  // ─── Footer ───────────────────────────────────────────

  private buildFooter(data: ReportData): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Signature row
    paragraphs.push(new Paragraph({ spacing: { before: 300 } }));
    paragraphs.push(
      new Paragraph({
        spacing: { after: 600 },
        children: [
          textRun('        Phụ huynh', { bold: true }),
          textRun('                         Trị liệu viên', { bold: true }),
          textRun('                    Phụ trách chuyên môn', { bold: true }),
        ],
      }),
    );

    // Notes section
    paragraphs.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [
          textRun(
            'Những lưu ý/đóng góp ý kiến của Phụ huynh học sinh/ Giáo viên/ Trị liệu viên:',
            { bold: true },
          ),
        ],
      }),
    );

    // Evaluation notes or blank lines
    const notesText = data.evaluation.notes || '';
    if (notesText) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [textRun(notesText)],
        }),
      );
    }

    // Add dotted lines for handwriting space
    for (let i = 0; i < 5; i++) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            textRun(
              '......................................................................................................................' +
              '......................................................................................................................',
              { size: 20 },
            ),
          ],
        }),
      );
    }

    return paragraphs;
  }

  // ─── Cell helpers ─────────────────────────────────────

  private headerCell(text: string, width: number): TableCell {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: THIN_BORDER,
      verticalAlign: VerticalAlign.CENTER,
      shading: { fill: 'F2F2F2' },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [textRun(text, { bold: true, size: 22 })],
        }),
      ],
    });
  }

  private contentCell(note: string | null, width: number): TableCell {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: THIN_BORDER,
      verticalAlign: VerticalAlign.TOP,
      children: [
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [textRun(note || '', { size: 21 })],
        }),
      ],
    });
  }

  private indicatorCell(indicator: string | null, width: number): TableCell {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: THIN_BORDER,
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [textRun(formatIndicator(indicator), { bold: true, size: 24 })],
        }),
      ],
    });
  }
}
