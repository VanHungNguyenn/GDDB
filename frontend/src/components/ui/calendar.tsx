'use client'

import { cn } from '@/lib/utils'
import { setMonth, setYear } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'
import { DayPicker, useDayPicker, type MonthCaptionProps } from 'react-day-picker'
import { vi } from 'react-day-picker/locale'

import 'react-day-picker/style.css'

const MONTHS_VI = [
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

const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: THIS_YEAR - 1923 + 6 }, (_, i) => 1924 + i)

const selectCls =
	'appearance-none rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-800 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-slate-300 transition-colors'

const navBtnCls =
	'inline-flex items-center justify-center rounded-md w-7 h-7 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'

function CalendarCaption({ calendarMonth }: MonthCaptionProps) {
	const { goToMonth, nextMonth, previousMonth } = useDayPicker()
	const date = calendarMonth.date

	return (
		<div className='flex items-center justify-between px-0.5 mb-1'>
			<button
				type='button'
				disabled={!previousMonth}
				onClick={() => previousMonth && goToMonth(previousMonth)}
				className={navBtnCls}
				aria-label='Tháng trước'
			>
				<ChevronLeft className='h-4 w-4' />
			</button>

			<div className='flex items-center gap-1.5'>
				<select
					value={date.getMonth()}
					onChange={(e) => goToMonth(setMonth(date, +e.target.value))}
					className={selectCls}
					aria-label='Chọn tháng'
				>
					{MONTHS_VI.map((label, idx) => (
						<option key={idx} value={idx}>
							{label}
						</option>
					))}
				</select>

				<select
					value={date.getFullYear()}
					onChange={(e) => goToMonth(setYear(date, +e.target.value))}
					className={selectCls}
					aria-label='Chọn năm'
				>
					{YEARS.map((y) => (
						<option key={y} value={y}>
							{y}
						</option>
					))}
				</select>
			</div>

			<button
				type='button'
				disabled={!nextMonth}
				onClick={() => nextMonth && goToMonth(nextMonth)}
				className={navBtnCls}
				aria-label='Tháng sau'
			>
				<ChevronRight className='h-4 w-4' />
			</button>
		</div>
	)
}

function Calendar({
	className,
	classNames,
	...props
}: React.ComponentProps<typeof DayPicker>) {
	return (
		<DayPicker
			locale={vi}
			className={cn('p-3', className)}
			classNames={classNames}
			components={{
				MonthCaption: CalendarCaption,
				Nav: () => <></>,
			}}
			{...props}
		/>
	)
}
Calendar.displayName = 'Calendar'

export { Calendar }
