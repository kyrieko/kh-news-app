import { NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.label));

  return NextResponse.json(allCategories);
}
