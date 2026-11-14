/**
 * Server-side input validation and sanitization utilities
 */

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  // Strip non-digits
  const digits = phone.replace(/\D/g, '');
  // Must be valid US phone number (10 digits, or 11 digits starting with 1)
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

export function validateZipCode(zip: string): boolean {
  if (!zip || typeof zip !== 'string') return false;
  return /^\d{5}(-\d{4})?$/.test(zip.trim());
}

export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags and content
    .replace(/<[^>]*>/g, '') // Strip remaining HTML tags
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '') // Strip control characters
    .trim();
}

export function validateDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime());
}

export function validateRating(rating: any): number {
  const num = parseInt(rating, 10);
  if (isNaN(num)) return 5;
  return Math.min(5, Math.max(1, num));
}

export function validateRequiredFields(obj: Record<string, any>, required: string[]): string | null {
  for (const field of required) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      return `Field "${field}" is required and cannot be empty.`;
    }
  }
  return null;
}
