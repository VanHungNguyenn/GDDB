'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import * as React from 'react'

interface DatePickerProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	disabled?: boolean
}

export function DatePicker({
	value,
	onChange,
	placeholder = 'Chọn ngày',
	disabled,
}: DatePickerProps) {
	const [open, setOpen] = React.useState(false)

	const date = value ? new Date(value + 'T00:00:00') : undefined

	const handleSelect = (day: Date | undefined) => {
		if (day) {
			const yyyy = day.getFullYear()
			const mm = String(day.getMonth() + 1).padStart(2, '0')
			const dd = String(day.getDate()).padStart(2, '0')
			onChange(`${yyyy}-${mm}-${dd}`)
		} else {
			onChange('')
		}
		setOpen(false)
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type='button'
					variant='outline'
					disabled={disabled}
					className={cn(
						'w-full justify-start text-left font-normal h-10',
						!date && 'text-muted-foreground',
					)}
				>
					<CalendarIcon className='mr-2 h-4 w-4 shrink-0' />
					{date
						? format(date, 'dd/MM/yyyy', { locale: vi })
						: placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-auto p-0' align='start'>
				<Calendar
					mode='single'
					selected={date}
					onSelect={handleSelect}
					defaultMonth={date}
					captionLayout='dropdown'
				/>
			</PopoverContent>
		</Popover>
	)
}
