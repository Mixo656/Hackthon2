/**
 * Local storage service for stress sessions.
 * Replaces base44 entity storage with browser localStorage.
 */

const STORAGE_KEY = 'smartcalm_sessions';

function getSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export const StressSessionStore = {
  /**
   * Create a new stress session and persist it.
   * Automatically adds `id` and `created_date`.
   */
  create(data) {
    const sessions = getSessions();
    const session = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2),
      created_date: new Date().toISOString(),
      ...data,
    };
    sessions.unshift(session); // newest first
    saveSessions(sessions);
    return session;
  },

  /**
   * List sessions, newest first. Optional limit.
   */
  list(limit = 50) {
    const sessions = getSessions();
    return sessions.slice(0, limit);
  },

  /**
   * Get a single session by id.
   */
  get(id) {
    return getSessions().find(s => s.id === id) ?? null;
  },

  /**
   * Delete a session by id.
   */
  delete(id) {
    const sessions = getSessions().filter(s => s.id !== id);
    saveSessions(sessions);
  },

  /**
   * Clear all sessions.
   */
  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
