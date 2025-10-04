import { NextRequest, NextResponse } from 'next/server';
import { loadSession } from '@/utils/sessionStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = loadSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      translations: session.translations,
      createdAt: session.createdAt,
      lastUpdated: session.lastUpdated,
      totalTranslations: session.translations.length
    });

  } catch (error) {
    console.error('Error retrieving session:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
} 