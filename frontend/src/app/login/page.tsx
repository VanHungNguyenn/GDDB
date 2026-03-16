'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { Eye, EyeOff, GraduationCap } from 'lucide-react'
import { useState } from 'react'

export default function LoginPage() {
	const { login } = useAuth()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setLoading(true)
		try {
			await login(email, password)
		} catch {
			setError('Email hoặc mật khẩu không đúng')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-slate-50 p-4'>
			<Card className='w-full max-w-md'>
				<CardHeader className='text-center'>
					<div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20'>
						<GraduationCap className='h-6 w-6 text-white' />
					</div>
					<CardTitle className='text-xl'>Tâm Anh</CardTitle>
					<CardDescription>
						Hệ thống đánh giá giáo dục đặc biệt
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-5'>
						<div className='space-y-4'>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								type='email'
								placeholder='teacher1@example.com'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className='space-y-4'>
							<Label htmlFor='password'>Mật khẩu</Label>
							<div className='relative'>
								<Input
									id='password'
									type={showPassword ? 'text' : 'password'}
									placeholder='Nhập mật khẩu'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className='pr-10'
								/>
								<button
									type='button'
									onClick={() => setShowPassword(!showPassword)}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer'
									tabIndex={-1}
								>
									{showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
								</button>
							</div>
						</div>
						{error && (
							<p className='text-sm text-destructive'>{error}</p>
						)}
						<Button
							type='submit'
							className='w-full'
							disabled={loading}
						>
							{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
