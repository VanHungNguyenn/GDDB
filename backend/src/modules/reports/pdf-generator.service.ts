import { Injectable } from '@nestjs/common'
import { ReportData, TEMPLATE_LAYOUT } from './docx-generator.service'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake/src/printer')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vfs: Record<string, string> = require('pdfmake/build/vfs_fonts')

const robotoFonts = {
	Roboto: {
		normal:      Buffer.from(vfs['Roboto-Regular.ttf'],      'base64'),
		bold:        Buffer.from(vfs['Roboto-Medium.ttf'],        'base64'),
		italics:     Buffer.from(vfs['Roboto-Italic.ttf'],        'base64'),
		bolditalics: Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64'),
	},
}

// ─── Dimensions ───────────────────────────────────────────

// A4, 40 pt margins each side → 515 pt usable
const TOTAL_W = 515
const W_GROUP  = Math.round(TOTAL_W * 1100 / 9800) // ~58
const W_DOMAIN = Math.round(TOTAL_W * 1500 / 9800) // ~79
const W_EVAL   = Math.round(TOTAL_W * 1500 / 9800) // ~79
const W_CONTENT = TOTAL_W - W_GROUP - W_DOMAIN - W_EVAL

// Signature column
const W_SIG = Math.floor(TOTAL_W / 3)

// ─── Style helpers ────────────────────────────────────────

const BORDER_ALL: [boolean, boolean, boolean, boolean] = [true, true, true, true]
const BORDER_NONE: [boolean, boolean, boolean, boolean] = [false, false, false, false]
const BORDER_BOTTOM: [boolean, boolean, boolean, boolean] = [false, false, false, true]

function cell(
	content: object | string,
	opts: {
		colSpan?: number
		rowSpan?: number
		border?: [boolean, boolean, boolean, boolean]
		fillColor?: string
		alignment?: string
		bold?: boolean
		fontSize?: number
		margin?: [number, number, number, number]
		noWrap?: boolean
	} = {},
): object {
	const base: Record<string, unknown> = {
		border: opts.border ?? BORDER_ALL,
		...(opts.fillColor ? { fillColor: opts.fillColor } : {}),
		...(opts.colSpan ? { colSpan: opts.colSpan } : {}),
		...(opts.rowSpan ? { rowSpan: opts.rowSpan } : {}),
	}

	if (typeof content === 'string') {
		return {
			...base,
			text: content,
			alignment: opts.alignment ?? 'left',
			bold: opts.bold ?? false,
			fontSize: opts.fontSize ?? 11,
			margin: opts.margin ?? [4, 4, 4, 4],
		}
	}
	return { ...base, ...content }
}

function placeholder(): object {
	return { text: '', border: BORDER_NONE }
}

function formatIndicator(indicator: string | null): string {
	switch (indicator) {
		case 'ACHIEVED': return '+'
		case 'NEEDS_ASSISTANCE': return '+/-'
		case 'NOT_ACHIEVED': return '-'
		default: return ''
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
export class PdfGeneratorService {
	private printer: typeof PdfPrinter

	constructor() {
		this.printer = new PdfPrinter(robotoFonts)
	}

	async generateEvaluationPdf(data: ReportData): Promise<Buffer> {
		const byDomain: Record<string, { note: string | null; indicator: string | null }> = {}
		for (const s of data.sections)
			byDomain[s.domain] = { note: s.note, indicator: s.indicator }

		const docDef = {
			pageSize: 'A4',
			pageMargins: [40, 40, 40, 40],
			defaultStyle: { font: 'Roboto', fontSize: 11 },
			content: [
				...this.buildHeader(data),
				this.buildTable(byDomain),
				...this.buildFooter(data),
			],
		}

		return new Promise<Buffer>((resolve, reject) => {
			const chunks: Buffer[] = []
			const stream = this.printer.createPdfKitDocument(docDef)
			stream.on('data', (chunk: Buffer) => chunks.push(chunk))
			stream.on('end', () => resolve(Buffer.concat(chunks)))
			stream.on('error', reject)
			stream.end()
		})
	}

	// ─── Header ─────────────────────────────────────────

	private buildHeader(data: ReportData): object[] {
		const age = calculateAge(data.student.dateOfBirth)
		return [
			{
				text: 'TRUNG TÂM GIÁO DỤC TRẺ ĐẶC BIỆT TÂM ANH',
				fontSize: 13,
				bold: true,
				alignment: 'center',
			},
			{
				text: 'Địa chỉ: Tổ 7, xã Lộc Thái 3, xã Lộc Ninh, tỉnh Đồng Nai',
				fontSize: 10,
				italics: true,
				alignment: 'center',
				margin: [0, 0, 0, 8],
			},
			{
				text: `KẾ HOẠCH GIÁO DỤC CÁ NHÂN THÁNG ${data.evaluation.month} NĂM ${data.evaluation.year}`,
				fontSize: 14,
				bold: true,
				alignment: 'center',
				margin: [0, 0, 0, 14],
			},
			{
				text: [
					{ text: 'Họ và tên học sinh: ' },
					{ text: data.student.name, bold: true },
					{ text: '          Tuổi: ' },
					{ text: age, bold: true },
				],
				margin: [0, 0, 0, 4],
			},
			{
				text: [
					{ text: 'Họ và tên trị liệu viên: ' },
					{ text: data.evaluation.teacherName, bold: true },
				],
				margin: [0, 0, 0, 4],
			},
			{
				text: [
					{ text: 'Ghi chú: ', fontSize: 10 },
					{ text: '+', bold: true, fontSize: 10 },
					{ text: ' (Đã hoàn thành) ; ', fontSize: 10 },
					{ text: '+/-', bold: true, fontSize: 10 },
					{ text: ' (Thực hiện cần trợ giúp); ', fontSize: 10 },
					{ text: '-', bold: true, fontSize: 10 },
					{ text: ' (Chưa hoàn thành)', fontSize: 10 },
				],
				margin: [0, 0, 0, 10],
			},
		]
	}

	// ─── Main table ─────────────────────────────────────

	private buildTable(
		byDomain: Record<string, { note: string | null; indicator: string | null }>,
	): object {
		const tableRows: object[][] = []

		// Header row
		tableRows.push([
			cell('Lĩnh vực can thiệp', {
				colSpan: 2,
				fillColor: '#F2F2F2',
				bold: true,
				alignment: 'center',
			}),
			placeholder(),
			cell('Nội dung can thiệp', {
				fillColor: '#F2F2F2',
				bold: true,
				alignment: 'center',
			}),
			cell('Đánh giá', {
				fillColor: '#F2F2F2',
				bold: true,
				alignment: 'center',
			}),
		])

		for (const group of TEMPLATE_LAYOUT) {
			if (group.groupLabel && group.domains.length > 1) {
				for (let i = 0; i < group.domains.length; i++) {
					const domainName = group.domains[i]
					const section = byDomain[domainName] ?? { note: null, indicator: null }
					const row: object[] = []

					if (i === 0) {
						row.push(
							cell(
								{
									stack: group.groupLabel.split('\n').map((line) => ({
										text: line,
										bold: true,
										fontSize: 11,
										alignment: 'center',
									})),
									margin: [4, 4, 4, 4],
								},
								{ rowSpan: group.domains.length },
							),
						)
					} else {
						row.push(placeholder())
					}

					row.push(
						cell(domainName, { bold: true, fontSize: 10.5, alignment: 'center' }),
					)
					row.push(this.contentCell(section.note))
					row.push(this.indicatorCell(section.indicator))
					tableRows.push(row)
				}
			} else {
				const domainName = group.domains[0]
				const section = byDomain[domainName] ?? { note: null, indicator: null }
				tableRows.push([
					cell(domainName, {
						colSpan: 2,
						bold: true,
						fontSize: 10.5,
						alignment: 'center',
					}),
					placeholder(),
					this.contentCell(section.note),
					this.indicatorCell(section.indicator),
				])
			}
		}

		return {
			table: {
				widths: [W_GROUP, W_DOMAIN, W_CONTENT, W_EVAL],
				body: tableRows,
			},
			layout: {
				hLineWidth: () => 0.5,
				vLineWidth: () => 0.5,
				hLineColor: () => '#000000',
				vLineColor: () => '#000000',
			},
		}
	}

	private contentCell(note: string | null): object {
		if (note?.trim()) {
			return {
				text: note.trim(),
				fontSize: 10.5,
				border: BORDER_ALL,
				margin: [4, 4, 4, 4],
			}
		}
		// Empty cell — draw 3 horizontal lines as write-in space
		return {
			border: BORDER_ALL,
			margin: [4, 6, 4, 6],
			stack: [
				{ canvas: [{ type: 'line', x1: 0, y1: 10, x2: W_CONTENT - 16, y2: 10, lineWidth: 0.3, dash: { length: 1, space: 2 } }] },
				{ canvas: [{ type: 'line', x1: 0, y1: 10, x2: W_CONTENT - 16, y2: 10, lineWidth: 0.3, dash: { length: 1, space: 2 } }] },
				{ canvas: [{ type: 'line', x1: 0, y1: 10, x2: W_CONTENT - 16, y2: 10, lineWidth: 0.3, dash: { length: 1, space: 2 } }] },
			],
		}
	}

	private indicatorCell(indicator: string | null): object {
		const symbol = formatIndicator(indicator)
		return {
			text: symbol || '......',
			bold: !!symbol,
			fontSize: symbol ? 13 : 10,
			alignment: 'center',
			border: BORDER_ALL,
			margin: [4, 4, 4, 4],
		}
	}

	// ─── Footer ─────────────────────────────────────────

	private buildFooter(data: ReportData): object[] {
		const items: object[] = []

		// Signature table
		items.push({
			margin: [0, 16, 0, 0],
			table: {
				widths: [W_SIG, W_SIG, TOTAL_W - W_SIG * 2],
				body: [
					// Row 1: labels
					[
						{ text: 'Phụ huynh', bold: true, alignment: 'center', border: BORDER_NONE, margin: [4, 0, 4, 0] },
						{ text: 'Trị liệu viên', bold: true, alignment: 'center', border: BORDER_NONE, margin: [4, 0, 4, 0] },
						{ text: 'Phụ trách chuyên môn', bold: true, alignment: 'center', border: BORDER_NONE, margin: [4, 0, 4, 0] },
					],
					// Row 2: signing space with bottom line
					[
						{ text: '', border: BORDER_BOTTOM, margin: [4, 55, 4, 4] },
						{ text: '', border: BORDER_BOTTOM, margin: [4, 55, 4, 4] },
						{ text: '', border: BORDER_BOTTOM, margin: [4, 55, 4, 4] },
					],
				],
			},
			layout: {
				hLineWidth: (i: number, node: { table: { body: object[][] } }) =>
					i === node.table.body.length ? 1 : 0,
				vLineWidth: () => 0,
				hLineColor: () => '#000000',
			},
		})

		// Notes heading
		items.push({
			text: 'Những lưu ý/đóng góp ý kiến của Phụ huynh học sinh/ Giáo viên/ Trị liệu viên:',
			bold: true,
			margin: [0, 14, 0, 4],
		})

		if (data.evaluation.notes) {
			items.push({
				text: data.evaluation.notes,
				margin: [0, 0, 0, 4],
			})
		}

		// Dotted write-in lines
		const lineCount = data.evaluation.notes ? 4 : 5
		for (let i = 0; i < lineCount; i++) {
			items.push({
				canvas: [{
					type: 'line',
					x1: 0, y1: 8,
					x2: TOTAL_W, y2: 8,
					lineWidth: 0.5,
					dash: { length: 1, space: 2 },
				}],
				margin: [0, 0, 0, 8],
			})
		}

		return items
	}
}
