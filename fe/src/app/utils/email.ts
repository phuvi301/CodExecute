/**
 * Email Utilities for Sanitization and Format Validation
 */

// Format Regex enforcing user@domain.com structure
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Sanitizes email by removing leading/trailing whitespace and converting to lowercase.
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Validates whether the email adheres to standard user@domain.com format.
 */
export function validateEmailFormat(email: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeEmail(email);
  if (!sanitized) {
    return { isValid: false, error: 'Email không được để trống' };
  }
  if (!EMAIL_REGEX.test(sanitized)) {
    return { isValid: false, error: 'Địa chỉ email không đúng định dạng (ví dụ: user@domain.com)' };
  }
  return { isValid: true };
}
