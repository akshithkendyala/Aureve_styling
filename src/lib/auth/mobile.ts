/**
 * Indian Mobile Number Normalization and Validation
 * Standardizes to canonical "+91XXXXXXXXXX" format
 */

export function normalizeMobileNumber(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Strip spaces, dashes, parentheses, dots
  let digits = trimmed.replace(/[\s\-\(\)\.]/g, '');

  // Handle +91 prefix
  if (digits.startsWith('+91')) {
    digits = digits.substring(3);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.substring(1);
  }

  // Must be exactly 10 digits starting with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }

  return null;
}

export function isValidIndianMobile(raw: string): boolean {
  return normalizeMobileNumber(raw) !== null;
}

export function formatMobileDisplay(mobile: string | undefined | null): string {
  if (!mobile) return '';
  const normalized = normalizeMobileNumber(mobile);
  if (!normalized) return mobile;
  // Format as +91 98765 43210
  const digits = normalized.substring(3);
  return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
}
