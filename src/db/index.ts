import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 서버리스 환경에서 연결 누수 방지를 위해 max: 1 설정
const client = postgres(process.env.DATABASE_URL!, { max: 1 });

export const db = drizzle(client, { schema });
