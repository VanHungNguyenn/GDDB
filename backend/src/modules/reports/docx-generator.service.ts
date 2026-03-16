import { Injectable } from '@nestjs/common'
import {
	AlignmentType,
	BorderStyle,
	Document,
	HeightRule,
	LeaderType,
	Packer,
	Paragraph,
	Table,
	TableCell,
	TableLayoutType,
	TableRow,
	TabStopType,
	TextRun,
	VerticalAlign,
	WidthType,
} from 'docx'

// ─── Types ────────────────────────────────────────────────

export interface ReportData {
	student: {
		id: string
		name: string
		dateOfBirth: string | Date | null
		parentName: string | null
		parentPhone: string | null
		className: string
	}
	evaluation: {
		id: string
		month: number
		year: number
		status: string
		notes: string | null
		teacherName: string
		finalizedAt: string | Date | null
	}
	sections: {
		domain: string
		note: string | null
		indicator: string | null
	}[]
}

// ─── Template layout ──────────────────────────────────────

interface DomainGroup {
	groupLabel: string | null
	domains: string[]
}

export const TEMPLATE_LAYOUT: DomainGroup[] = [
	{
		groupLabel: 'Kỹ năng\nVận động',
		domains: ['Vận động thô', 'Vận động tinh'],
	},
	{ groupLabel: null, domains: ['Kỹ năng Bắt chước'] },
	{ groupLabel: null, domains: ['Luyện hơi/cơ quan cấu âm'] },
	{ groupLabel: null, domains: ['Nhận thức'] },
	{
		groupLabel: 'Ngôn ngữ',
		domains: ['Ngôn ngữ thể hiện', 'Ngôn ngữ tiếp nhận'],
	},
	{
		groupLabel: 'Kỹ năng',
		domains: ['Kỹ năng tự phục vụ', 'Kỹ năng Giao tiếp - Xã hội'],
	},
	{ groupLabel: null, domains: ['Tập trung chú ý – Giao tiếp mắt'] },
	{ groupLabel: null, domains: ['Các vấn đề về hành vi'] },
]

// ─── Dimensions ───────────────────────────────────────────

// A4: 11907 × 16839 twips  |  margins ≈ 1 cm top/bottom, 1.5 cm left/right
const PAGE_MARGIN = { top: 568, bottom: 568, left: 851, right: 851 }

// Table column widths (DXA).  Total = 9800 twips.
const W_GROUP = 1100 // "Kỹ năng Vận động"
const W_DOMAIN = 1500 // "Vận động thô"
const W_CONTENT = 5700 // "Nội dung can thiệp"
const W_EVAL = 1500 // "Đánh giá"
const W_TOTAL = W_GROUP + W_DOMAIN + W_CONTENT + W_EVAL // 9800
const W_LINH_VUC = W_GROUP + W_DOMAIN // 2600 (spans 2 cols)

const ROW_HEIGHT = 1500 // twips ≈ 2.65 cm  (3 lines of handwriting space)

// Right-edge tab-stop positions (relative to left margin)
const TAB_CONTENT = W_CONTENT - 160 // inside content cell
const TAB_FOOTER = W_TOTAL - 100 // full page width inside footer

// ─── Borders ──────────────────────────────────────────────

const THIN_BORDER = {
	top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
	bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
	left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
	right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
}

const NO_BORDER = {
	top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
	bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
	left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
	right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

// Signature-line cell: invisible except for a bottom underline
const SIG_LINE_BORDER = {
	...NO_BORDER,
	bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
}

// ─── Helpers ──────────────────────────────────────────────

interface RunOpts {
	bold?: boolean
	italics?: boolean
	size?: number
}

function run(text: string, opts: RunOpts = {}): TextRun {
	return new TextRun({
		text,
		font: 'Times New Roman',
		bold: opts.bold ?? false,
		italics: opts.italics ?? false,
		size: opts.size ?? 22, // 11 pt
	})
}

function para(
	children: TextRun[],
	align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
	spacingAfter = 0,
): Paragraph {
	return new Paragraph({
		alignment: align,
		spacing: { after: spacingAfter },
		children,
	})
}

/** A paragraph containing a right-justified tab with dot leaders.
 *  Produces a perfectly continuous "............" line. */
function dotLine(tabPosition: number, spacingAfter = 160): Paragraph {
	return new Paragraph({
		tabStops: [
			{
				type: TabStopType.RIGHT,
				position: tabPosition,
				leader: LeaderType.DOT,
			},
		],
		spacing: { after: spacingAfter },
		children: [
			new TextRun({ text: '\t', font: 'Times New Roman', size: 20 }),
		],
	})
}

function formatIndicator(indicator: string | null): string {
	switch (indicator) {
		case 'ACHIEVED':
			return '+'
		case 'NEEDS_ASSISTANCE':
			return '+/-'
		case 'NOT_ACHIEVED':
			return '-'
		default:
			return ''
	}
}

function calculateAge(dob: string | Date | null): string {
	if (!dob) return ''
	const birth = new Date(dob)
	const now = new Date()
	let age = now.getFullYear() - birth.getFullYear()
	if (
		now.getMonth() - birth.getMonth() < 0 ||
		(now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
	)
		age--
	return age.toString()
}

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class DocxGeneratorService {
	async generateEvaluationDocx(data: ReportData): Promise<Buffer> {
		const byDomain: Record<
			string,
			{ note: string | null; indicator: string | null }
		> = {}
		for (const s of data.sections)
			byDomain[s.domain] = { note: s.note, indicator: s.indicator }

		const doc = new Document({
			sections: [
				{
					properties: {
						page: {
							size: { width: 11907, height: 16839 },
							margin: PAGE_MARGIN,
						},
					},
					children: [
						...this.buildHeader(data),
						this.buildTable(byDomain),
						...this.buildFooter(data),
					],
				},
			],
		})

		return Buffer.from(await Packer.toBuffer(doc))
	}

	// ─── Header ───────────────────────────────────────────

	private buildHeader(data: ReportData): Paragraph[] {
		const age = calculateAge(data.student.dateOfBirth)

		return [
			// Institution name — bold, 13 pt, centered
			para(
				[
					run('TRUNG TÂM GIÁO DỤC TRẺ ĐẶC BIỆT TÂM ANH', {
						bold: true,
						size: 26,
					}),
				],
				AlignmentType.CENTER,
			),
			// Address — italic, 10 pt, centered
			para(
				[
					run(
						'Địa chỉ: Tổ 7, xã Lộc Thái 3, xã Lộc Ninh, tỉnh Đồng Nai',
						{ italics: true, size: 20 },
					),
				],
				AlignmentType.CENTER,
				200, // ← more gap before title
			),
			// Report title — bold, 14 pt, centered
			para(
				[
					run(
						`KẾ HOẠCH GIÁO DỤC CÁ NHÂN THÁNG ${data.evaluation.month} NĂM ${data.evaluation.year}`,
						{ bold: true, size: 28 },
					),
				],
				AlignmentType.CENTER,
				400, // ← more gap before student info
			),
			// Student name + age
			new Paragraph({
				spacing: { after: 100 },
				children: [
					run('Họ và tên học sinh: '),
					run(data.student.name, { bold: true }),
					run('          Tuổi: '),
					run(age, { bold: true }),
				],
			}),
			// Therapist name
			new Paragraph({
				spacing: { after: 100 },
				children: [
					run('Họ và tên trị liệu viên: '),
					run(data.evaluation.teacherName, { bold: true }),
				],
			}),
			// Legend
			new Paragraph({
				spacing: { after: 200 },
				children: [
					run('Ghi chú: ', { size: 20 }),
					run('+', { bold: true, size: 20 }),
					run(' (Đã hoàn thành); ', { size: 20 }),
					run('+/-', { bold: true, size: 20 }),
					run(' (Thực hiện cần trợ giúp); ', { size: 20 }),
					run('-', { bold: true, size: 20 }),
					run(' (Chưa hoàn thành)', { size: 20 }),
				],
			}),
		]
	}

	// ─── Main evaluation table ────────────────────────────

	private buildTable(
		byDomain: Record<
			string,
			{ note: string | null; indicator: string | null }
		>,
	): Table {
		const rows: TableRow[] = []

		// Header row  — "Lĩnh vực can thiệp" has columnSpan:2 to cover W_GROUP + W_DOMAIN
		rows.push(
			new TableRow({
				tableHeader: true,
				children: [
					this.headerCell('Lĩnh vực can thiệp', W_LINH_VUC, 2),
					this.headerCell('Nội dung can thiệp', W_CONTENT),
					this.headerCell('Đánh giá', W_EVAL),
				],
			}),
		)

		// Data rows
		for (const group of TEMPLATE_LAYOUT) {
			if (group.groupLabel && group.domains.length > 1) {
				// Grouped rows: first row carries the rowSpan group-label cell
				for (let i = 0; i < group.domains.length; i++) {
					const domainName = group.domains[i]
					const section = byDomain[domainName] ?? {
						note: null,
						indicator: null,
					}
					const cells: TableCell[] = []

					if (i === 0) {
						cells.push(
							new TableCell({
								rowSpan: group.domains.length,
								width: { size: W_GROUP, type: WidthType.DXA },
								borders: THIN_BORDER,
								verticalAlign: VerticalAlign.CENTER,
								children: [
									new Paragraph({
										alignment: AlignmentType.CENTER,
										children: group
											.groupLabel!.split('\n')
											.flatMap((line, idx, arr) => {
												const parts: TextRun[] = [
													run(line, {
														bold: true,
														size: 22,
													}),
												]
												if (idx < arr.length - 1)
													parts.push(
														new TextRun({
															break: 1,
														}),
													)
												return parts
											}),
									}),
								],
							}),
						)
					}

					cells.push(
						new TableCell({
							width: { size: W_DOMAIN, type: WidthType.DXA },
							borders: THIN_BORDER,
							verticalAlign: VerticalAlign.CENTER,
							children: [
								para(
									[run(domainName, { bold: true, size: 21 })],
									AlignmentType.CENTER,
								),
							],
						}),
					)

					cells.push(this.contentCell(section.note))
					cells.push(this.indicatorCell(section.indicator))

					rows.push(
						new TableRow({
							height: {
								value: ROW_HEIGHT,
								rule: HeightRule.ATLEAST,
							},
							children: cells,
						}),
					)
				}
			} else {
				// Standalone rows: domain name spans group + domain columns
				const domainName = group.domains[0]
				const section = byDomain[domainName] ?? {
					note: null,
					indicator: null,
				}

				rows.push(
					new TableRow({
						height: { value: ROW_HEIGHT, rule: HeightRule.ATLEAST },
						children: [
							new TableCell({
								columnSpan: 2,
								width: {
									size: W_LINH_VUC,
									type: WidthType.DXA,
								},
								borders: THIN_BORDER,
								verticalAlign: VerticalAlign.CENTER,
								children: [
									para(
										[
											run(domainName, {
												bold: true,
												size: 21,
											}),
										],
										AlignmentType.CENTER,
									),
								],
							}),
							this.contentCell(section.note),
							this.indicatorCell(section.indicator),
						],
					}),
				)
			}
		}

		return new Table({
			// Explicitly declare 4 column widths so Word builds the correct TBLGRID
			// (required for rowSpan / columnSpan to render properly)
			columnWidths: [W_GROUP, W_DOMAIN, W_CONTENT, W_EVAL],
			layout: TableLayoutType.FIXED,
			width: { size: W_TOTAL, type: WidthType.DXA },
			rows,
		})
	}

	// ─── Footer ───────────────────────────────────────────

	private buildFooter(data: ReportData): (Paragraph | Table)[] {
		const items: (Paragraph | Table)[] = []

		// ── Signature block (3-column borderless table) ──
		// No spacer paragraph — gap is built into the label cells via spacing.before
		const W_SIG = Math.floor(W_TOTAL / 3) // ≈ 3267 each
		items.push(
			new Table({
				columnWidths: [W_SIG, W_SIG, W_TOTAL - W_SIG * 2],
				layout: TableLayoutType.FIXED,
				width: { size: W_TOTAL, type: WidthType.DXA },
				rows: [
					// Row 1: role name labels
					new TableRow({
						height: { value: 380, rule: HeightRule.ATLEAST },
						children: [
							this.sigLabelCell('Phụ huynh', W_SIG),
							this.sigLabelCell('Trị liệu viên', W_SIG),
							this.sigLabelCell(
								'Phụ trách chuyên môn',
								W_TOTAL - W_SIG * 2,
							),
						],
					}),
					// Row 2: blank signing space — bottom border = signature line
					new TableRow({
						height: { value: 2200, rule: HeightRule.EXACT },
						children: [
							new TableCell({
								borders: SIG_LINE_BORDER,
								children: [new Paragraph({})],
							}),
							new TableCell({
								borders: {
									...SIG_LINE_BORDER,
									left: NO_BORDER.left,
									right: NO_BORDER.right,
								},
								children: [new Paragraph({})],
							}),
							new TableCell({
								borders: SIG_LINE_BORDER,
								children: [new Paragraph({})],
							}),
						],
					}),
				],
			}),
		)

		// Gap before notes heading
		items.push(new Paragraph({ spacing: { before: 400 } }))

		// Notes heading
		items.push(
			new Paragraph({
				spacing: { after: 120 },
				children: [
					run(
						'Những lưu ý/đóng góp ý kiến của Phụ huynh học sinh/ Giáo viên/ Trị liệu viên:',
						{ bold: true },
					),
				],
			}),
		)

		// Evaluation notes text (if any)
		if (data.evaluation.notes) {
			items.push(
				new Paragraph({
					spacing: { after: 80 },
					children: [run(data.evaluation.notes)],
				}),
			)
		}

		// Continuous dotted write-in lines via tab-stop leaders (no wrapping gaps)
		const lineCount = data.evaluation.notes ? 4 : 5
		for (let i = 0; i < lineCount; i++) {
			items.push(dotLine(TAB_FOOTER, 200))
		}

		return items
	}

	// ─── Cell builders ────────────────────────────────────

	private headerCell(
		text: string,
		width: number,
		colSpan?: number,
	): TableCell {
		return new TableCell({
			columnSpan: colSpan,
			width: { size: width, type: WidthType.DXA },
			borders: THIN_BORDER,
			verticalAlign: VerticalAlign.CENTER,
			shading: { fill: 'F2F2F2' },
			children: [
				para(
					[run(text, { bold: true, size: 22 })],
					AlignmentType.CENTER,
				),
			],
		})
	}

	private contentCell(note: string | null): TableCell {
		const children: Paragraph[] = []

		if (note?.trim()) {
			// Text exists — show it with padding only, no dot lines
			children.push(
				new Paragraph({
					spacing: { before: 100, after: 100 },
					children: [run(note.trim(), { size: 21 })],
				}),
			)
		} else {
			// Empty — show 3 dot-leader lines as write-in space
			for (let i = 0; i < 3; i++) {
				children.push(dotLine(TAB_CONTENT, 120))
			}
		}

		return new TableCell({
			width: { size: W_CONTENT, type: WidthType.DXA },
			borders: THIN_BORDER,
			margins: { top: 80, bottom: 80, left: 100, right: 100 },
			verticalAlign: VerticalAlign.TOP,
			children,
		})
	}

	private indicatorCell(indicator: string | null): TableCell {
		const symbol = formatIndicator(indicator)
		return new TableCell({
			width: { size: W_EVAL, type: WidthType.DXA },
			borders: THIN_BORDER,
			verticalAlign: VerticalAlign.CENTER,
			children: [
				para(
					[
						run(symbol || '......', {
							bold: !!symbol,
							size: symbol ? 26 : 20,
						}),
					],
					AlignmentType.CENTER,
				),
			],
		})
	}

	private sigLabelCell(text: string, width: number): TableCell {
		return new TableCell({
			width: { size: width, type: WidthType.DXA },
			borders: NO_BORDER,
			children: [
				new Paragraph({
					alignment: AlignmentType.CENTER,
					spacing: { before: 200, after: 0 },
					children: [run(text, { bold: true })],
				}),
			],
		})
	}
}
