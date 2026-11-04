// Utility functions for SavvyBot

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// CSS UTILITIES
// ============================================

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================
// DATE & TIME UTILITIES
// ============================================

/**
 * Format date relative to now
 */
export function formatDateRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "hace unos segundos";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `hace ${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `hace ${diffInDays}d`;
  }

  return formatDate(d);
}

/**
 * Format date as DD/MM/YYYY
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${formatDate(d)} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Format time only
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Get timezone offset in hours
 */
export function getTimezoneOffset(timezone: string = "Europe/Madrid"): number {
  try {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      timeZoneName: "short",
    };
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    
    // Extract offset from timezone abbreviation (e.g., "GMT+2")
    if (tzPart?.value.includes("+") || tzPart?.value.includes("-")) {
      const offsetStr = tzPart.value.replace(/GMT/i, "");
      const offsetHours = parseInt(offsetStr, 10);
      return offsetHours;
    }
    
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Convert date to timezone
 */
export function convertToTimezone(date: Date, timezone: string = "Europe/Madrid"): Date {
  try {
    const dateStr = date.toISOString();
    const localDate = new Date(dateStr);
    
    // This is a simplified approach
    // In production, use a library like date-fns-tz or luxon
    return localDate;
  } catch {
    return date;
  }
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Truncate string
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) {
    return str;
  }
  return str.slice(0, length) + "...";
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Generate a random color
 */
export function getRandomColor(): string {
  const colors = [
    "#FF7A29", // Orange
    "#FFB366", // Light orange
    "#4A90E2", // Blue
    "#7ED321", // Green
    "#BD10E0", // Purple
    "#F8E71C", // Yellow
    "#50E3C2", // Teal
    "#D0021B", // Red
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Sanitize HTML
 */
export function sanitizeHtml(html: string): string {
  // Simple sanitization - in production, use DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "");
}

/**
 * Escape special characters
 */
export function escapeSpecialChars(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================
// NUMBER UTILITIES
// ============================================

/**
 * Format number with locale
 */
export function formatNumber(num: number, locale: string = "es-ES"): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency: string = "EUR",
  locale: string = "es-ES"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(num: number, decimals: number = 2, locale: string = "es-ES"): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num / 100);
}

/**
 * Clamp number between min and max
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

// ============================================
// ARRAY UTILITIES
// ============================================

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Remove duplicates from array
 */
export function removeDuplicates<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Shuffle array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// OBJECT UTILITIES
// ============================================

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends object, U extends object>(target: T, source: U): T & U {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (output[key] && typeof output[key] === "object" && !Array.isArray(output[key])) {
        output[key] = deepMerge(output[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }
  return output as T & U;
}

/**
 * Pick properties from object
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit properties from object
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

// ============================================
// URL UTILITIES
// ============================================

/**
 * Get query parameter from URL
 */
export function getQueryParam(url: string, param: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get(param);
  } catch {
    return null;
  }
}

/**
 * Set query parameter in URL
 */
export function setQueryParam(url: string, param: string, value: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set(param, value);
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Remove query parameter from URL
 */
export function removeQueryParam(url: string, param: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete(param);
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if string is valid UUID
 */
export function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Check if string is valid phone number
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Check if string contains only numbers
 */
export function isNumeric(str: string): boolean {
  return /^\d+$/.test(str);
}

// ============================================
// STORAGE UTILITIES
// ============================================

/**
 * Get value from localStorage
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Set value in localStorage
 */
export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore errors
  }
}

/**
 * Remove value from localStorage
 */
export function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

/**
 * Clear localStorage
 */
export function clearLocalStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.clear();
  } catch {
    // Ignore errors
  }
}

// ============================================
// SESSION STORAGE UTILITIES
// ============================================

/**
 * Get value from sessionStorage
 */
export function getSessionStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Set value in sessionStorage
 */
export function setSessionStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore errors
  }
}

// ============================================
// DEVICE UTILITIES
// ============================================

/**
 * Check if running on mobile device
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if running on touch device
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return /Android/.test(navigator.userAgent);
}

// ============================================
// BROWSER UTILITIES
// ============================================

/**
 * Scroll to top of page
 */
export function scrollToTop(smooth: boolean = true): void {
  if (typeof window === "undefined") {
    return;
  }
  window.scrollTo({
    top: 0,
    behavior: smooth ? "smooth" : "auto",
  });
}

/**
 * Scroll to element
 */
export function scrollToElement(
  element: HTMLElement | string,
  options?: ScrollIntoViewOptions
): void {
  if (typeof window === "undefined") {
    return;
  }
  
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (el) {
    el.scrollIntoView(options);
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  }
}

/**
 * Download file
 */
export function downloadFile(url: string, filename: string): void {
  if (typeof window === "undefined") {
    return;
  }
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Open URL in new tab
 */
export function openInNewTab(url: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

// ============================================
// ERROR UTILITIES
// ============================================

/**
 * Get error message from error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Error desconocido";
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = 2 } = options;
  
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    await sleep(delay);
    return retry(fn, { retries: retries - 1, delay: delay * backoff, backoff });
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  // CSS
  cn,
  
  // Date & Time
  formatDateRelative,
  formatDate,
  formatDateTime,
  formatTime,
  getTimezoneOffset,
  convertToTimezone,
  
  // String
  truncate,
  capitalize,
  getInitials,
  generateId,
  getRandomColor,
  sanitizeHtml,
  escapeSpecialChars,
  
  // Number
  formatNumber,
  formatCurrency,
  formatPercentage,
  clamp,
  
  // Array
  chunkArray,
  removeDuplicates,
  shuffleArray,
  
  // Object
  deepClone,
  deepMerge,
  pick,
  omit,
  
  // URL
  getQueryParam,
  setQueryParam,
  removeQueryParam,
  isValidUrl,
  
  // Validation
  isValidEmail,
  isValidUuid,
  isValidPhone,
  isNumeric,
  
  // Storage
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
  getSessionStorage,
  setSessionStorage,
  
  // Device
  isMobile,
  isTouchDevice,
  isIOS,
  isAndroid,
  
  // Browser
  scrollToTop,
  scrollToElement,
  copyToClipboard,
  downloadFile,
  openInNewTab,
  
  // Error
  getErrorMessage,
  sleep,
  retry,
};
