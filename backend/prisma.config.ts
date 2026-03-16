import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Ép load file .env ở thư mục gốc ngay lập tức
config()

export default defineConfig({
	// Sử dụng đường dẫn tương đối từ thư mục gốc
	schema: './prisma/schema.prisma',

	datasource: {
		// Sử dụng trực tiếp từ process.env
		url: process.env.DATABASE_URL,
	},

	migrations: {
		seed: 'npx ts-node prisma/seed.ts',
	},
})
