
import { API_CONFIG } from '../config/api';

interface RequestOptions extends RequestInit {
  retries?: number;
  cacheTTL?: number; // Time to live in seconds
}

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class HttpClient {
  private static cache = new Map<string, CacheEntry<any>>();

  private static async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static getUrl(endpoint: string): string {
    const cleanBase = API_CONFIG.BASE_URL.replace(/\/+$/, '');
    const cleanPath = endpoint.replace(/^\/+/, '');
    return `${cleanBase}/${cleanPath}`;
  }

  public static async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { retries = API_CONFIG.RETRY_ATTEMPTS, cacheTTL, ...fetchOptions } = options;
    const url = endpoint.startsWith('http') ? endpoint : this.getUrl(endpoint);

    // Check Cache
    if (cacheTTL && options.method === 'GET') {
      const cached = this.cache.get(url);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(fetchOptions.headers as Record<string, string>),
      };

      // Only add Content-Type if we have a body or it's explicitly strictly required
      // Many servers (FastAPI, etc) throw 422 if Content-Type is present on GET
      if (options.method !== 'GET' && options.method !== 'HEAD') {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers,
      });

      clearTimeout(id);

      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '1') * 1000;
          await this.delay(retryAfter || API_CONFIG.RETRY_DELAY);
          return this.request<T>(endpoint, { ...options, retries: retries - 1 });
        }
        if (response.status >= 500 && retries > 0) {
          await this.delay(API_CONFIG.RETRY_DELAY * (API_CONFIG.RETRY_ATTEMPTS - retries + 1));
          return this.request<T>(endpoint, { ...options, retries: retries - 1 });
        }
        // Graceful fallback for 422/404 if needed, but throwing for now to let components handle
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Set Cache
      if (cacheTTL && options.method === 'GET') {
        this.cache.set(url, {
          data,
          expiry: Date.now() + (cacheTTL * 1000)
        });
      }

      return data as T;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      if (retries > 0 && error.name !== 'AbortError') {
        await this.delay(API_CONFIG.RETRY_DELAY * (API_CONFIG.RETRY_ATTEMPTS - retries + 1));
        return this.request<T>(endpoint, { ...options, retries: retries - 1 });
      }
      throw error;
    }
  }

  public static async get<T>(endpoint: string, params?: Record<string, any>, cacheTTL: number = 0): Promise<T> {
    let url = endpoint;
    if (params) {
      const queryString = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString();
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}${queryString}`;
    }
    return this.request<T>(url, { method: 'GET', cacheTTL });
  }

  public static async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  
  public static clearCache() {
    this.cache.clear();
  }
}
