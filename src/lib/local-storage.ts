// Local storage utilities with type safety

export class LocalStorage {
  static get<T>(key: string, defaultValue: T | null = null): T | null {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }

  static remove(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.clear();
  }
}

// Specific helpers for common use cases
export const recentlyViewed = {
  key: 'recently_viewed_content',
  maxItems: 10,

  add(contentId: string, contentData?: { title: string; thumbnailUrl?: string; merchantId: string; slug: string }) {
    const items = this.getAll();
    // Remove if already exists
    const filtered = items.filter(item => item.id !== contentId);
    // Add to beginning
    const newItems = [{ id: contentId, ...contentData, viewedAt: Date.now() }, ...filtered].slice(0, this.maxItems);
    LocalStorage.set(this.key, newItems);
  },

  getAll(): Array<{ id: string; title?: string; thumbnailUrl?: string; merchantId: string; slug: string; viewedAt: number }> {
    return LocalStorage.get(this.key, []);
  },

  clear() {
    LocalStorage.remove(this.key);
  },
};

export const bookmarks = {
  key: 'bookmarked_content',

  add(contentId: string, contentData?: { title: string; thumbnailUrl?: string; merchantId: string; slug: string }) {
    const items = this.getAll();
    if (!items.find(item => item.id === contentId)) {
      LocalStorage.set(this.key, [...items, { id: contentId, ...contentData, bookmarkedAt: Date.now() }]);
    }
  },

  remove(contentId: string) {
    const items = this.getAll();
    LocalStorage.set(this.key, items.filter(item => item.id !== contentId));
  },

  getAll(): Array<{ id: string; title?: string; thumbnailUrl?: string; merchantId: string; slug: string; bookmarkedAt: number }> {
    return LocalStorage.get(this.key, []);
  },

  isBookmarked(contentId: string): boolean {
    return this.getAll().some(item => item.id === contentId);
  },

  clear() {
    LocalStorage.remove(this.key);
  },
};

