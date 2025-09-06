import React from 'react';

/**
 * Safe rendering utilities to prevent "Objects are not valid as a React child" errors
 */

/**
 * Safely converts any value to a string for React rendering
 * Returns empty string for null/undefined, stringified version for objects
 */
export function safeStringify(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  // For objects, arrays, etc., return a safe string representation
  try {
    return JSON.stringify(value);
  } catch (error) {
    return '[Object]';
  }
}

/**
 * Safe theme property access with fallback
 */
export function safeThemeColor(theme: any, path: string, fallback: string = '#000000'): string {
  if (!theme) return fallback;
  
  const keys = path.split('.');
  let current = theme;
  
  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return fallback;
    }
    current = current[key];
  }
  
  return typeof current === 'string' ? current : fallback;
}

/**
 * Safe object property access for React rendering
 */
export function safeProperty<T>(obj: any, key: string, fallback: T): T {
  if (!obj || typeof obj !== 'object') {
    return fallback;
  }
  
  const value = obj[key];
  return value !== null && value !== undefined ? value : fallback;
}

/**
 * Type guard to check if value is safe for React rendering
 */
export function isSafeToRender(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    React.isValidElement(value)
  );
}