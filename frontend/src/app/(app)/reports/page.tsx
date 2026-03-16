'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	downloadDocx,
	downloadPdf,
	useClasses,
	useReport,
	useStudents,
} from '@/hooks/use-api'
import { Download, FileText } from 'lucide-react'
import { useState } from 'react'

const MONTHS = [
	'Tháng 1',
	'Tháng 2',
	'Tháng 3',
	'Tháng 4',
	'Tháng 5',
	'Tháng 6',
	'Tháng 7',
	'Tháng 8',
	'Tháng 9',
	'Tháng 10',
	'Tháng 11',
	'Tháng 12',
]

const STATUS_DISPLAY: Record<string, string> = {
	FINALIZED: 'Đã hoàn tất',
	DRAFT: 'Bản nháp',
}

const INDICATOR_DISPLAY: Record<
	string,
	{ label: string; variant: 'success' | 'warning' | 'destructive' }
> = {
	ACHIEVED: { label: '+', variant: 'success' },
	NEEDS_ASSISTANCE: { label: '+/-', variant: 'warning' },
	NOT_ACHIEVED: { label: '-', variant: 'destructive' },
}

export default function ReportsPage() {
	const now = new Date()
	const { data: classes } = useClasses()
	const [classId, setClassId] = useState('')
	const [studentId, setStudentId] = useState('')
	const [year, setYear] = useState(now.getFullYear())
	const [month, setMonth] = useState(now.getMonth() + 1)
	const [downloading, setDownloading] = useState<'docx' | 'pdf' | null>(null)

	const { data: studentsResult } = useStudents(classId || undefined)
	const {
		data: report,
		isLoading,
		isError,
	} = useReport(studentId || undefined, year, month)

	const handleDownload = async (format: 'docx' | 'pdf') => {
		if (!studentId) return
		setDownloading(format)
		try {
			if (format === 'pdf') {
				await downloadPdf(studentId, year, month)
			} else {
				await downloadDocx(studentId, year, month)
			}
		} catch {
			alert('Không thể tải báo cáo')
		} finally {
			setDownloading(null)
		}
	}

	return (
		<div>
			<h1 className='text-2xl font-bold'>Báo cáo</h1>
			<p className='mb-6 text-muted-foreground'>
				Xem trước và tải báo cáo đánh giá
			</p>

			{/* Filters */}
			<div className='mb-8 flex flex-wrap items-end gap-4'>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-medium'>Lớp</label>
					<Select
						value={classId}
						onValueChange={(v) => {
							setClassId(v)
							setStudentId('')
						}}
					>
						<SelectTrigger className='w-48'>
							<SelectValue placeholder='Chọn lớp' />
						</SelectTrigger>
						<SelectContent>
							{classes?.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-medium'>Học sinh</label>
					<Select
						value={studentId}
						onValueChange={setStudentId}
						disabled={!classId}
					>
						<SelectTrigger className='w-52'>
							<SelectValue placeholder='Chọn học sinh' />
						</SelectTrigger>
						<SelectContent>
							{studentsResult?.data.map((s) => (
								<SelectItem key={s.id} value={s.id}>
									{s.lastName} {s.firstName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-medium'>Tháng</label>
					<Select
						value={month.toString()}
						onValueChange={(v) => setMonth(Number(v))}
					>
						<SelectTrigger className='w-36'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{MONTHS.map((m, i) => (
								<SelectItem
									key={i + 1}
									value={(i + 1).toString()}
								>
									{m}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-medium'>Năm</label>
					<Select
						value={year.toString()}
						onValueChange={(v) => setYear(Number(v))}
					>
						<SelectTrigger className='w-24'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[
								now.getFullYear() - 1,
								now.getFullYear(),
								now.getFullYear() + 1,
							].map((y) => (
								<SelectItem key={y} value={y.toString()}>
									{y}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Report preview */}
			{!studentId && (
				<p className='text-muted-foreground'>
					Chọn lớp và học sinh để xem trước báo cáo.
				</p>
			)}

			{studentId && isLoading && (
				<div className='space-y-4'>
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className='h-20 animate-pulse rounded-lg bg-muted'
						/>
					))}
				</div>
			)}

			{studentId && isError && (
				<p className='text-muted-foreground'>
					Không tìm thấy đánh giá cho {MONTHS[month - 1]} {year}.
				</p>
			)}

			{report && (
				<div className='space-y-6'>
					{/* Student info card */}
					<Card>
						<CardHeader className='flex flex-row items-center justify-between'>
							<div>
								<CardTitle>{report.student.name}</CardTitle>
								<p className='text-sm text-muted-foreground'>
									{report.student.className} | Trị liệu viên:{' '}
									{report.evaluation.teacherName}
								</p>
							</div>
							<div className='flex items-center gap-3'>
								<Badge
									variant={
										report.evaluation.status === 'FINALIZED'
											? 'success'
											: 'warning'
									}
								>
									{STATUS_DISPLAY[report.evaluation.status] ??
										report.evaluation.status}
								</Badge>
								<Button
									onClick={() => handleDownload('docx')}
									disabled={downloading !== null}
								>
									<Download className='mr-2 h-4 w-4' />
									{downloading === 'docx' ? 'Đang tải...' : 'Tải DOCX'}
								</Button>
								<Button
									variant='outline'
									onClick={() => handleDownload('pdf')}
									disabled={downloading !== null}
								>
									<Download className='mr-2 h-4 w-4' />
									{downloading === 'pdf' ? 'Đang tải...' : 'Tải PDF'}
								</Button>
							</div>
						</CardHeader>
					</Card>

					{/* Sections */}
					<div className='flex flex-col gap-2'>
						{report.sections.map((section, i) => (
							<Card key={i}>
								<CardContent className='flex items-start gap-4 p-4'>
									<FileText className='mt-0.5 h-5 w-5 shrink-0 text-muted-foreground' />
									<div className='min-w-0 flex-1'>
										<div className='flex items-center justify-between'>
											<p className='font-medium'>
												{section.domain}
											</p>
											{section.indicator && (
												<Badge
													variant={
														INDICATOR_DISPLAY[
															section.indicator
														]?.variant
													}
												>
													{
														INDICATOR_DISPLAY[
															section.indicator
														]?.label
													}
												</Badge>
											)}
										</div>
										{section.note && (
											<p className='mt-1 text-sm text-muted-foreground whitespace-pre-wrap'>
												{section.note}
											</p>
										)}
										{!section.note &&
											!section.indicator && (
												<p className='mt-1 text-sm italic text-muted-foreground'>
													Chưa đánh giá
												</p>
											)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{/* General notes */}
					{report.evaluation.notes && (
						<Card>
							<CardHeader>
								<CardTitle className='text-base'>
									Ghi chú chung
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-sm whitespace-pre-wrap'>
									{report.evaluation.notes}
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			)}
		</div>
	)
}
