import fs from 'fs';
import path from 'path';

interface TranslationEntry {
  timestamp: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface SessionData {
  sessionId: string;
  translations: TranslationEntry[];
  createdAt: string;
  lastUpdated: string;
}

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');

// Ensure sessions directory exists
function ensureSessionsDir() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

// Get session file path
function getSessionFilePath(sessionId: string): string {
  return path.join(SESSIONS_DIR, `${sessionId}.json`);
}

// Load session data
export function loadSession(sessionId: string): SessionData | null {
  try {
    ensureSessionsDir();
    const filePath = getSessionFilePath(sessionId);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as SessionData;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
}

// Save session data
export function saveSession(sessionData: SessionData): void {
  try {
    ensureSessionsDir();
    const filePath = getSessionFilePath(sessionData.sessionId);
    fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

// Add translation to session
export function addTranslationToSession(
  sessionId: string,
  originalText: string,
  translatedText: string,
  sourceLanguage: string,
  targetLanguage: string
): void {
  const session = loadSession(sessionId) || {
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
  
  saveSession(session);
}

// Get translation context for OpenAI (legacy - kept for compatibility)
export function getTranslationContext(sessionId: string, maxEntries: number = 5): string {
  const session = loadSession(sessionId);

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
export function getConversationHistory(sessionId: string, maxEntries: number = 10): Array<{role: 'user' | 'assistant', content: string}> {
  const session = loadSession(sessionId);

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

// Clean up old sessions (optional utility)
export function cleanupOldSessions(maxAgeHours: number = 24): void {
  try {
    ensureSessionsDir();
    const files = fs.readdirSync(SESSIONS_DIR);
    const now = new Date();
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(SESSIONS_DIR, file);
        const stats = fs.statSync(filePath);
        const ageHours = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60);
        
        if (ageHours > maxAgeHours) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old session: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
} 