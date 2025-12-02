import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldSessions } from '@/utils/sessionStorage';

export async function POST(request: NextRequest) {
  try {
    const { maxAgeHours = 24 } = await request.json();
    
    await cleanupOldSessions(maxAgeHours);
    
    return NextResponse.json({ 
      message: `Cleaned up sessions older than ${maxAgeHours} hours`,
      maxAgeHours 
    });

  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    return NextResponse.json({ error: 'Failed to clean up sessions' }, { status: 500 });
  }
} 