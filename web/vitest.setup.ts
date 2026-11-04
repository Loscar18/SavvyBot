/**
 * Vitest setup file
 * Configure global test environment
 */

import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Mock environment variables
process.env.ENCRYPTION_KEY = "test_encryption_key_32_bytes_long_123456";
process.env.DATABASE_URL = "postgresql://localhost:5432/test_db";
process.env.REDIS_URL = "redis://localhost:6379/0";
process.env.NODE_ENV = "test";

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress console output during tests
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

afterEach(() => {
  // Clean up after each test
  cleanup();
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Reset all modules
  vi.resetModules();
});

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock: Storage = {
  length: 0,
  clear: vi.fn(),
  getItem: vi.fn(),
  key: vi.fn(),
  removeItem: vi.fn(),
  setItem: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock: Storage = {
  length: 0,
  clear: vi.fn(),
  getItem: vi.fn(),
  key: vi.fn(),
  removeItem: vi.fn(),
  setItem: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock window properties
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000",
    origin: "http://localhost:3000",
    pathname: "/",
    search: "",
    hash: "",
    reload: vi.fn(),
    replace: vi.fn(),
    assign: vi.fn(),
  },
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true,
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
  observe(element: Element) {}
  unobserve(element: Element) {}
  disconnect() {}
  root: Element | null = null;
  rootMargin: string = "";
  thresholds: ReadonlyArray<number> = [];
  takeRecords(): IntersectionObserverEntry[] { return []; }
}
global.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {}
  observe(target: Element) {}
  unobserve(target: Element) {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;

// Mock getComputedStyle
Object.defineProperty(window, "getComputedStyle", {
  value: vi.fn().mockImplementation(() => ({
    getPropertyValue: vi.fn().mockReturnValue("0px"),
  })),
  writable: true,
});

// Mock performance
Object.defineProperty(window, "performance", {
  value: {
    now: vi.fn().mockReturnValue(0),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntries: vi.fn().mockReturnValue([]),
  },
  writable: true,
});

// Mock requestAnimationFrame
Object.defineProperty(window, "requestAnimationFrame", {
  value: vi.fn().mockImplementation((cb) => {
    return setTimeout(cb, 0);
  }),
  writable: true,
});

// Mock cancelAnimationFrame
Object.defineProperty(window, "cancelAnimationFrame", {
  value: vi.fn().mockImplementation((id) => {
    return clearTimeout(id);
  }),
  writable: true,
});

// Mock scrollTo
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

// Mock navigator
Object.defineProperty(window, "navigator", {
  value: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    platform: "Win32",
    language: "es-ES",
    languages: ["es-ES", "es", "en"],
    onLine: true,
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(""),
    },
    serviceWorker: {
      register: vi.fn(),
      getRegistrations: vi.fn().mockResolvedValue([]),
    },
    storage: {
      estimate: vi.fn().mockResolvedValue({
        quota: 1000000000,
        usage: 0,
      }),
      persist: vi.fn().mockResolvedValue(true),
    },
    deviceMemory: 8,
    hardwareConcurrency: 4,
    maxTouchPoints: 0,
    connection: {
      effectiveType: "4g",
      rtt: 50,
      downlink: 10,
      saveData: false,
    },
  },
  writable: true,
});

// Mock custom elements
Object.defineProperty(window, "customElements", {
  value: {
    define: vi.fn(),
    get: vi.fn(),
    whenDefined: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

// Mock WebSocket
class MockWebSocket {
  constructor(url: string, protocols?: string | string[]) {}
  readyState = 1; // OPEN
  send(data: any) {}
  close(code?: number, reason?: string) {}
  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  binaryType: BinaryType = "blob";
  bufferedAmount: number = 0;
  extensions: string = "";
  protocol: string = "";
  url: string = "";
}
global.WebSocket = MockWebSocket;

// Mock EventSource for SSE
class MockEventSource {
  constructor(url: string, eventSourceInitDict?: EventSourceInit) {}
  readyState = 1; // OPEN
  url: string = "";
  withCredentials: boolean = false;
  onopen: ((this: EventSource, ev: Event) => any) | null = null;
  onmessage: ((this: EventSource, ev: MessageEvent) => any) | null = null;
  onerror: ((this: EventSource, ev: Event) => any) | null = null;
  close() {}
}
global.EventSource = MockEventSource;

// Mock AbortController
class MockAbortController {
  signal = {
    aborted: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onabort: null,
  };
  abort() {}
}
global.AbortController = MockAbortController;

// Mock Blob
class MockBlob {
  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {}
  size: number = 0;
  type: string = "";
  slice(start?: number, end?: number, contentType?: string): Blob {
    return new MockBlob();
  }
  stream(): ReadableStream<Uint8Array> {
    return new ReadableStream();
  }
  text(): Promise<string> {
    return Promise.resolve("");
  }
  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }
}
global.Blob = MockBlob;

// Mock File
class MockFile extends MockBlob {
  constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
    super(fileBits, options);
    this.name = fileName;
    this.lastModified = Date.now();
  }
  name: string = "";
  lastModified: number = 0;
}
global.File = MockFile;

// Mock FormData
class MockFormData {
  private data: Record<string, any> = {};
  
  append(name: string, value: any, fileName?: string) {
    this.data[name] = value;
  }
  
  delete(name: string) {
    delete this.data[name];
  }
  
  get(name: string): any {
    return this.data[name];
  }
  
  getAll(name: string): any[] {
    return [this.data[name]];
  }
  
  has(name: string): boolean {
    return name in this.data;
  }
  
  set(name: string, value: any, fileName?: string) {
    this.data[name] = value;
  }
  
  forEach(callback: (value: any, key: string, parent: FormData) => void) {
    Object.entries(this.data).forEach(([key, value]) => {
      callback(value, key, this);
    });
  }
  
  entries(): IterableIterator<[string, any]> {
    return Object.entries(this.data).values();
  }
  
  keys(): IterableIterator<string> {
    return Object.keys(this.data).values();
  }
  
  values(): IterableIterator<any> {
    return Object.values(this.data).values();
  }
}
global.FormData = MockFormData;

// Mock URL
class MockURL {
  constructor(url: string, base?: string) {}
  hash: string = "";
  host: string = "localhost";
  hostname: string = "localhost";
  href: string = "http://localhost";
  origin: string = "http://localhost";
  pathname: string = "/";
  port: string = "3000";
  protocol: string = "http:";
  search: string = "";
  searchParams: URLSearchParams = new URLSearchParams();
  username: string = "";
  password: string = "";
  
  toString(): string {
    return this.href;
  }
  
  toJSON(): string {
    return this.href;
  }
}
global.URL = MockURL;

// Mock URLSearchParams
class MockURLSearchParams {
  private params: Record<string, string> = {};
  
  append(name: string, value: string) {
    this.params[name] = value;
  }
  
  delete(name: string) {
    delete this.params[name];
  }
  
  get(name: string): string | null {
    return this.params[name] || null;
  }
  
  getAll(name: string): string[] {
    return [this.params[name]];
  }
  
  has(name: string): boolean {
    return name in this.params;
  }
  
  set(name: string, value: string) {
    this.params[name] = value;
  }
  
  sort() {}
  
  toString(): string {
    return Object.entries(this.params)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
  }
  
  forEach(callback: (value: string, name: string, searchParams: URLSearchParams) => void) {
    Object.entries(this.params).forEach(([name, value]) => {
      callback(value, name, this);
    });
  }
  
  keys(): IterableIterator<string> {
    return Object.keys(this.params).values();
  }
  
  values(): IterableIterator<string> {
    return Object.values(this.params).values();
  }
  
  entries(): IterableIterator<[string, string]> {
    return Object.entries(this.params).values();
  }
}
global.URLSearchParams = MockURLSearchParams;

// Mock Headers
class MockHeaders {
  private headers: Record<string, string> = {};
  
  append(name: string, value: string) {
    this.headers[name.toLowerCase()] = value;
  }
  
  delete(name: string) {
    delete this.headers[name.toLowerCase()];
  }
  
  get(name: string): string | null {
    return this.headers[name.toLowerCase()] || null;
  }
  
  has(name: string): boolean {
    return name.toLowerCase() in this.headers;
  }
  
  set(name: string, value: string) {
    this.headers[name.toLowerCase()] = value;
  }
  
  forEach(callback: (value: string, name: string, headers: Headers) => void) {
    Object.entries(this.headers).forEach(([name, value]) => {
      callback(value, name, this);
    });
  }
  
  keys(): IterableIterator<string> {
    return Object.keys(this.headers).values();
  }
  
  values(): IterableIterator<string> {
    return Object.values(this.headers).values();
  }
  
  entries(): IterableIterator<[string, string]> {
    return Object.entries(this.headers).values();
  }
}
global.Headers = MockHeaders;

// Mock Request
class MockRequest {
  constructor(input: RequestInfo, init?: RequestInit) {}
  method: string = "GET";
  url: string = "";
  headers: Headers = new MockHeaders();
  body: ReadableStream<Uint8Array> | null = null;
  bodyUsed: boolean = false;
  cache: RequestCache = "default";
  credentials: RequestCredentials = "same-origin";
  destination: RequestDestination = "";
  integrity: string = "";
  keepalive: boolean = false;
  mode: RequestMode = "cors";
  redirect: RequestRedirect = "follow";
  referrer: string = "";
  referrerPolicy: ReferrerPolicy = "no-referrer-when-downgrade";
  signal: AbortSignal = new MockAbortController().signal;
  
  clone(): Request {
    return new MockRequest(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
    });
  }
  
  json(): Promise<any> {
    return Promise.resolve({});
  }
  
  text(): Promise<string> {
    return Promise.resolve("");
  }
  
  formData(): Promise<FormData> {
    return Promise.resolve(new MockFormData());
  }
  
  blob(): Promise<Blob> {
    return Promise.resolve(new MockBlob());
  }
  
  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }
}
global.Request = MockRequest;

// Mock Response
class MockResponse {
  constructor(body?: BodyInit, init?: ResponseInit) {}
  type: ResponseType = "default";
  url: string = "";
  redirected: boolean = false;
  status: number = 200;
  ok: boolean = true;
  statusText: string = "OK";
  headers: Headers = new MockHeaders();
  body: ReadableStream<Uint8Array> | null = null;
  bodyUsed: boolean = false;
  
  static error(): Response {
    return new MockResponse(null, { status: 0, statusText: "Error" });
  }
  
  static json(data: any, init?: ResponseInit): Response {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  }
  
  static redirect(url: string, status: number): Response {
    return new MockResponse(null, {
      status,
      headers: {
        "Location": url,
      },
    });
  }
  
  clone(): Response {
    return new MockResponse(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    });
  }
  
  json(): Promise<any> {
    return Promise.resolve({});
  }
  
  text(): Promise<string> {
    return Promise.resolve("");
  }
  
  formData(): Promise<FormData> {
    return Promise.resolve(new MockFormData());
  }
  
  blob(): Promise<Blob> {
    return Promise.resolve(new MockBlob());
  }
  
  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }
}
global.Response = MockResponse;

// Export mocks for tests to use
export {
  mockFetch,
  localStorageMock,
  sessionStorageMock,
  MockIntersectionObserver,
  MockResizeObserver,
  MockEventSource,
  MockAbortController,
  MockBlob,
  MockFile,
  MockFormData,
  MockURL,
  MockURLSearchParams,
  MockHeaders,
  MockRequest,
  MockResponse,
};
