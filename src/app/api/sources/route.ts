import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sources } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  const allSources = await db
    .select()
    .from(sources)
    .orderBy(asc(sources.name));

  return NextResponse.json(allSources);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, websiteUrl } = body;

  if (!name) {
    return NextResponse.json({ error: 'name은 필수입니다' }, { status: 400 });
  }

  const [source] = await db
    .insert(sources)
    .values({ name, websiteUrl })
    .onConflictDoUpdate({
      target: sources.name,
      set: { websiteUrl },
    })
    .returning();

  return NextResponse.json(source, { status: 201 });
}
