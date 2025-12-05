import { NextResponse } from 'next/server';
import { listSessions } from '@/lib/db/sessions';

export async function GET() {
  try {
    const sessions = await listSessions(20);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error listing sessions:', error);
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}

