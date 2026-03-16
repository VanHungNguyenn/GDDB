'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	useClasses,
	useCreateClass,
	useCreateStudent,
	useDeleteClass,
	useDeleteStudent,
	useStudents,
	useUpdateClass,
	useUpdateStudent,
} from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import type { Class, Student } from '@/types'
import {
	Calendar,
	MoreHorizontal,
	Pencil,
	Phone,
	Plus,
	School,
	Trash2,
	User2,
	Users,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function ClassesAndStudentsPage() {
	const { user } = useAuth()
	const { data: classes, isLoading: classesLoading } = useClasses()
	const createClass = useCreateClass()
	const updateClass = useUpdateClass()
	const deleteClass = useDeleteClass()

	const createStudent = useCreateStudent()
	const updateStudent = useUpdateStudent()
	const deleteStudent = useDeleteStudent()

	// ── State ──
	const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
	const activeClassId = selectedClassId ?? classes?.[0]?.id ?? null
	const { data: studentsResult, isLoading: studentsLoading } = useStudents(
		activeClassId ?? undefined,
	)

	// Class dialog
	const [classDialogOpen, setClassDialogOpen] = useState(false)
	const [editingClass, setEditingClass] = useState<Class | null>(null)
	const [className, setClassName] = useState('')

	// Student dialog
	const [studentDialogOpen, setStudentDialogOpen] = useState(false)
	const [editingStudent, setEditingStudent] = useState<Student | null>(null)
	const [studentForm, setStudentForm] = useState({
		firstName: '',
		lastName: '',
		dateOfBirth: '',
		parentName: '',
		parentPhone: '',
	})

	// Context menu for classes
	const [menuClassId, setMenuClassId] = useState<string | null>(null)
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(e.target as Node)
			) {
				setMenuClassId(null)
			}
		}
		document.addEventListener('mousedown', handleClick)
		return () => document.removeEventListener('mousedown', handleClick)
	}, [])

	const selectedClass = classes?.find((c) => c.id === activeClassId)

	// ── Class handlers ──
	const openCreateClass = () => {
		setEditingClass(null)
		setClassName('')
		setClassDialogOpen(true)
	}

	const openEditClass = (cls: Class) => {
		setEditingClass(cls)
		setClassName(cls.name)
		setClassDialogOpen(true)
		setMenuClassId(null)
	}

	const handleClassSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (editingClass) {
			await updateClass.mutateAsync({
				id: editingClass.id,
				name: className,
			})
		} else {
			await createClass.mutateAsync({ name: className })
		}
		setClassDialogOpen(false)
	}

	const handleDeleteClass = async (id: string) => {
		setMenuClassId(null)
		if (
			confirm(
				'Bạn có chắc chắn? Thao tác này sẽ xóa lớp và tất cả học sinh trong lớp.',
			)
		) {
			await deleteClass.mutateAsync(id)
			if (activeClassId === id) {
				setSelectedClassId(null)
			}
		}
	}

	// ── Student handlers ──
	const openCreateStudent = () => {
		setEditingStudent(null)
		setStudentForm({
			firstName: '',
			lastName: '',
			dateOfBirth: '',
			parentName: '',
			parentPhone: '',
		})
		setStudentDialogOpen(true)
	}

	const openEditStudent = (s: Student) => {
		setEditingStudent(s)
		setStudentForm({
			firstName: s.firstName,
			lastName: s.lastName,
			dateOfBirth: s.dateOfBirth?.split('T')[0] ?? '',
			parentName: s.parentName ?? '',
			parentPhone: s.parentPhone ?? '',
		})
		setStudentDialogOpen(true)
	}

	const handleStudentSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const payload = {
			firstName: studentForm.firstName,
			lastName: studentForm.lastName,
			...(studentForm.dateOfBirth && {
				dateOfBirth: studentForm.dateOfBirth,
			}),
			...(studentForm.parentName && {
				parentName: studentForm.parentName,
			}),
			...(studentForm.parentPhone && {
				parentPhone: studentForm.parentPhone,
			}),
		}
		if (editingStudent) {
			await updateStudent.mutateAsync({
				id: editingStudent.id,
				...payload,
			})
		} else if (activeClassId) {
			await createStudent.mutateAsync({
				...payload,
				classId: activeClassId,
			})
		}
		setStudentDialogOpen(false)
	}

	const handleDeleteStudent = async (id: string) => {
		if (confirm('Xóa học sinh này và tất cả đánh giá của họ?')) {
			await deleteStudent.mutateAsync(id)
		}
	}

	const setStudentField = (key: string, value: string) =>
		setStudentForm((prev) => ({ ...prev, [key]: value }))

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight text-slate-900'>
						Lớp học & Học sinh
					</h1>
					<p className='text-[14px] text-slate-500'>
						Chọn lớp để xem và quản lý danh sách học sinh
					</p>
				</div>
			</div>

			{/* Master-detail layout */}
			<div className='grid gap-6 lg:grid-cols-[320px_1fr]'>
				{/* ═══ Left: Class list ═══ */}
				<div className='space-y-3'>
					<div className='flex items-center justify-between'>
						<h2 className='text-sm font-semibold text-slate-700'>
							Danh sách lớp
						</h2>
						<button
							onClick={openCreateClass}
							className='inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 cursor-pointer'
						>
							<Plus className='h-3.5 w-3.5' />
							Thêm lớp
						</button>
					</div>

					{classesLoading ? (
						<div className='space-y-2'>
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className='h-16 animate-pulse rounded-xl bg-slate-100'
								/>
							))}
						</div>
					) : classes?.length === 0 ? (
						<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center'>
							<School className='mb-3 h-8 w-8 text-slate-300' />
							<p className='text-sm font-medium text-slate-500'>
								Chưa có lớp học nào
							</p>
							<button
								onClick={openCreateClass}
								className='mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline cursor-pointer'
							>
								<Plus className='h-3.5 w-3.5' />
								Tạo lớp đầu tiên
							</button>
						</div>
					) : (
						<div className='space-y-1'>
							{classes?.map((cls) => {
								const isSelected = cls.id === activeClassId
								return (
									<div key={cls.id} className='relative'>
										<button
											onClick={() =>
												setSelectedClassId(cls.id)
											}
											className={cn(
												'flex w-full items-center gap-3 rounded-xl py-3 pr-10 pl-3.5 text-left transition-all duration-200 cursor-pointer',
												isSelected
													? 'bg-indigo-50 shadow-sm shadow-indigo-500/5 border-l-[3px] border-indigo-600'
													: 'hover:bg-slate-50 border-l-[3px] border-transparent',
											)}
										>
											<div
												className={cn(
													'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
													isSelected
														? 'bg-indigo-100 text-indigo-600'
														: 'bg-slate-100 text-slate-400',
												)}
											>
												<School className='h-4 w-4' />
											</div>
											<div className='min-w-0 flex-1'>
												<p
													className={cn(
														'truncate text-[13px] font-semibold transition-colors',
														isSelected
															? 'text-indigo-700'
															: 'text-slate-700',
													)}
												>
													{cls.name}
												</p>
												<p className='text-[11px] text-slate-400'>
													{cls._count.students} học
													sinh
													{cls.teacher &&
														user?.role ===
															'ADMIN' && (
															<span>
																{' '}
																·{' '}
																{
																	cls.teacher
																		.lastName
																}{' '}
																{
																	cls.teacher
																		.firstName
																}
															</span>
														)}
												</p>
											</div>
										</button>

										{/* 3-dot menu */}
										<div
											className={cn(
												'absolute right-2 top-1/2 -translate-y-1/2',
												menuClassId === cls.id &&
													'z-50',
											)}
										>
											<button
												onClick={(e) => {
													e.stopPropagation()
													setMenuClassId(
														menuClassId === cls.id
															? null
															: cls.id,
													)
												}}
												className={cn(
													'rounded-md p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 cursor-pointer',
													menuClassId === cls.id &&
														'bg-slate-100 text-slate-600',
													isSelected
														? 'opacity-100'
														: 'opacity-0 group-hover:opacity-100',
												)}
												style={{
													opacity:
														menuClassId ===
															cls.id || isSelected
															? 1
															: undefined,
												}}
											>
												<MoreHorizontal className='h-4 w-4' />
											</button>

											{menuClassId === cls.id && (
												<div
													ref={menuRef}
													className='absolute right-0 top-8 z-50 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10'
												>
													<button
														onClick={() =>
															openEditClass(cls)
														}
														className='flex w-full items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer'
													>
														<Pencil className='h-3.5 w-3.5 text-slate-400' />
														Đổi tên
													</button>
													<button
														onClick={() =>
															handleDeleteClass(
																cls.id,
															)
														}
														className='flex w-full items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer'
													>
														<Trash2 className='h-3.5 w-3.5' />
														Xóa lớp
													</button>
												</div>
											)}
										</div>
									</div>
								)
							})}
						</div>
					)}
				</div>

				{/* ═══ Right: Student list ═══ */}
				<Card className='border-slate-200/40'>
					<CardHeader className='flex flex-row items-center justify-between'>
						<div>
							<CardTitle>
								{selectedClass
									? selectedClass.name
									: 'Chọn lớp'}
							</CardTitle>
							{selectedClass && (
								<p className='mt-1 text-[13px] text-slate-500'>
									{selectedClass._count.students} học sinh
								</p>
							)}
						</div>
						{activeClassId && (
							<Button
								onClick={openCreateStudent}
								className='gap-1.5 rounded-xl bg-indigo-600 shadow-sm shadow-indigo-500/20 hover:bg-indigo-700'
							>
								<Plus className='h-4 w-4' />
								Thêm học sinh
							</Button>
						)}
					</CardHeader>
					<CardContent>
						{!activeClassId ? (
							<div className='flex flex-col items-center justify-center py-16 text-center'>
								<div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50'>
									<Users className='h-7 w-7 text-slate-300' />
								</div>
								<p className='text-sm font-medium text-slate-500'>
									Chọn một lớp ở bên trái để xem danh sách học
									sinh
								</p>
							</div>
						) : studentsLoading ? (
							<div className='space-y-2'>
								{[1, 2, 3, 4].map((i) => (
									<div
										key={i}
										className='h-18 animate-pulse rounded-xl bg-slate-50'
									/>
								))}
							</div>
						) : studentsResult?.data.length === 0 ? (
							<div className='flex flex-col items-center justify-center py-16 text-center'>
								<div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50'>
									<Users className='h-7 w-7 text-slate-300' />
								</div>
								<p className='text-sm font-medium text-slate-500'>
									Chưa có học sinh trong lớp này
								</p>
								<button
									onClick={openCreateStudent}
									className='mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline cursor-pointer'
								>
									<Plus className='h-3.5 w-3.5' />
									Thêm học sinh đầu tiên
								</button>
							</div>
						) : (
							<div className='space-y-1'>
								{studentsResult?.data.map((s) => (
									<div
										key={s.id}
										className='group flex items-center justify-between rounded-xl p-3.5 transition-all duration-200 hover:bg-slate-50/80'
									>
										<div className='flex items-center gap-3.5'>
											{/* Avatar */}
											<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-600'>
												{s.lastName?.charAt(0) ?? '?'}
											</div>
											<div>
												<p className='text-[14px] font-semibold text-slate-800'>
													{s.lastName} {s.firstName}
												</p>
												<div className='mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-slate-400'>
													{s.dateOfBirth && (
														<span className='flex items-center gap-1'>
															<Calendar className='h-3 w-3' />
															{new Date(
																s.dateOfBirth,
															).toLocaleDateString(
																'vi-VN',
															)}
														</span>
													)}
													{s.parentName && (
														<span className='flex items-center gap-1'>
															<User2 className='h-3 w-3' />
															{s.parentName}
														</span>
													)}
													{s.parentPhone && (
														<span className='flex items-center gap-1'>
															<Phone className='h-3 w-3' />
															{s.parentPhone}
														</span>
													)}
												</div>
											</div>
										</div>

										<div className='flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
											<button
												onClick={() =>
													openEditStudent(s)
												}
												className='rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer'
											>
												<Pencil className='h-3.5 w-3.5' />
											</button>
											<button
												onClick={() =>
													handleDeleteStudent(s.id)
												}
												className='rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 cursor-pointer'
											>
												<Trash2 className='h-3.5 w-3.5' />
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* ═══ Class Dialog ═══ */}
			<Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingClass ? 'Chỉnh sửa lớp' : 'Tạo lớp mới'}
						</DialogTitle>
						<DialogDescription>
							{editingClass
								? 'Cập nhật tên lớp học.'
								: 'Nhập tên cho lớp học mới.'}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleClassSubmit} className='space-y-5'>
						<div className='space-y-4'>
							<Label htmlFor='className'>Tên lớp</Label>
							<Input
								id='className'
								value={className}
								onChange={(e) => setClassName(e.target.value)}
								placeholder='VD: Lớp Mặt Trời'
								required
							/>
						</div>
						<div className='flex justify-end gap-2'>
							<Button
								type='button'
								variant='outline'
								onClick={() => setClassDialogOpen(false)}
							>
								Hủy
							</Button>
							<Button
								type='submit'
								disabled={
									createClass.isPending ||
									updateClass.isPending
								}
							>
								{editingClass ? 'Lưu' : 'Tạo'}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* ═══ Student Dialog ═══ */}
			<Dialog
				open={studentDialogOpen}
				onOpenChange={setStudentDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingStudent
								? 'Chỉnh sửa học sinh'
								: 'Thêm học sinh'}
						</DialogTitle>
						<DialogDescription>
							{editingStudent
								? 'Cập nhật thông tin học sinh.'
								: 'Thêm học sinh mới vào lớp.'}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleStudentSubmit} className='space-y-5'>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-4'>
								<Label>Họ</Label>
								<Input
									value={studentForm.lastName}
									onChange={(e) =>
										setStudentField(
											'lastName',
											e.target.value,
										)
									}
									required
								/>
							</div>
							<div className='space-y-4'>
								<Label>Tên</Label>
								<Input
									value={studentForm.firstName}
									onChange={(e) =>
										setStudentField(
											'firstName',
											e.target.value,
										)
									}
									required
								/>
							</div>
						</div>
						<div className='space-y-4'>
							<Label>Ngày sinh</Label>
							<DatePicker
								value={studentForm.dateOfBirth}
								onChange={(v) =>
									setStudentField('dateOfBirth', v)
								}
							/>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-4'>
								<Label>Tên phụ huynh</Label>
								<Input
									value={studentForm.parentName}
									onChange={(e) =>
										setStudentField(
											'parentName',
											e.target.value,
										)
									}
								/>
							</div>
							<div className='space-y-4'>
								<Label>SĐT phụ huynh</Label>
								<Input
									value={studentForm.parentPhone}
									onChange={(e) =>
										setStudentField(
											'parentPhone',
											e.target.value,
										)
									}
								/>
							</div>
						</div>
						<div className='flex justify-end gap-2'>
							<Button
								type='button'
								variant='outline'
								onClick={() => setStudentDialogOpen(false)}
							>
								Hủy
							</Button>
							<Button
								type='submit'
								disabled={
									createStudent.isPending ||
									updateStudent.isPending
								}
							>
								{editingStudent ? 'Lưu' : 'Tạo'}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	)
}
