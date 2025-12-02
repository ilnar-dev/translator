import { neon } from '@neondatabase/serverless';

interface TranslationEntry {
  timestamp: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface SessionData {
  sessionId: string;
  translations: TranslationEntry[];
  createdAt: string;
  lastUpdated: string;
}

const SESSION_EXPIRATION_HOURS = 24;

type SessionRow = {
  session_id: string;
  translations: string | TranslationEntry[] | null;
  created_at: string;
  last_updated: string;
};

let sqlClient: ReturnType<typeof neon> | null = null;

function getSqlClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Please configure Neon Postgres connection string.');
  }
  if (!sqlClient) {
    sqlClient = neon(connectionString);
  }
  return sqlClient;
}

export async function loadSession(sessionId: string): Promise<SessionData | null> {
  try {
    const sql = getSqlClient();
    const rows = await sql`
      SELECT session_id, translations, created_at, last_updated
      FROM sessions
      WHERE session_id = ${sessionId}
      AND (last_updated >= NOW() - ${SESSION_EXPIRATION_HOURS} * INTERVAL '1 hour')
    ` as SessionRow[];

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    const translationArray =
      typeof row.translations === 'string'
        ? (JSON.parse(row.translations) as TranslationEntry[])
        : row.translations ?? [];

    return {
      sessionId: row.session_id,
      translations: translationArray,
      createdAt: row.created_at,
      lastUpdated: row.last_updated
    };
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
}

export async function saveSession(sessionData: SessionData): Promise<void> {
  try {
    const sql = getSqlClient();
    const translationsJson = JSON.stringify(sessionData.translations);
    await sql`
      INSERT INTO sessions (session_id, translations, created_at, last_updated)
      VALUES (${sessionData.sessionId}, ${translationsJson}::jsonb, ${sessionData.createdAt}, ${sessionData.lastUpdated})
      ON CONFLICT (session_id)
      DO UPDATE SET
        translations = EXCLUDED.translations,
        last_updated = EXCLUDED.last_updated
    `;
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

// Add translation to session
export async function addTranslationToSession(
  sessionId: string,
  originalText: string,
  translatedText: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<void> {
  const session = (await loadSession(sessionId)) || {
    sessionId,
    translations: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  const translationEntry: TranslationEntry = {
    timestamp: new Date().toISOString(),
    originalText,
    translatedText,
    sourceLanguage,
    targetLanguage
  };

  session.translations.push(translationEntry);
  session.lastUpdated = new Date().toISOString();
  
  await saveSession(session);
}

// Get translation context for OpenAI (legacy - kept for compatibility)
export async function getTranslationContext(sessionId: string, maxEntries: number = 5): Promise<string> {
  const session = await loadSession(sessionId);

  if (!session || session.translations.length === 0) {
    return '';
  }

  // Get the most recent translations
  const recentTranslations = session.translations
    .slice(-maxEntries)
    .map(entry =>
      `Original (${entry.sourceLanguage}): "${entry.originalText}" → Translated (${entry.targetLanguage}): "${entry.translatedText}"`
    )
    .join('\n');

  return `Previous translations in this conversation:\n${recentTranslations}\n\n`;
}

// Get conversation history as OpenAI messages format
export async function getConversationHistory(sessionId: string, maxEntries: number = 10): Promise<Array<{role: 'user' | 'assistant', content: string}>> {
  const session = await loadSession(sessionId);

  if (!session || session.translations.length === 0) {
    return [];
  }

  // Get the most recent translations and format them as conversation
  const messages: Array<{role: 'user' | 'assistant', content: string}> = [];

  const recentTranslations = session.translations.slice(-maxEntries);

  recentTranslations.forEach(entry => {
    messages.push({
      role: 'user',
      content: entry.originalText
    });
    messages.push({
      role: 'assistant',
      content: entry.translatedText
    });
  });

  return messages;
}

export async function cleanupOldSessions(maxAgeHours: number = 24): Promise<void> {
  try {
    const sql = getSqlClient();
    await sql`
      DELETE FROM sessions
      WHERE last_updated < NOW() - (${maxAgeHours} * INTERVAL '1 hour')
    `;
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
} 