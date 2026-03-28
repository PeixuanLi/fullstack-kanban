import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  // schema 文件路径（相对本配置文件）
  schema: 'prisma/schema.prisma',
  // 迁移配置
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
