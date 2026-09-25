import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a 6-digit numeric PIN securely before storing in database
 */
export async function hashPin(pin: string): Promise<string> {
  if (!/^\d{6}$/.test(pin)) {
    throw new Error('PIN must be exactly 6 digits');
  }
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Verify a plain 6-digit PIN against the stored hash
 */
export async function verifyPin(pin: string, pinHash: string): Promise<boolean> {
  if (!pin || !pinHash) return false;
  return bcrypt.compare(pin, pinHash);
}

/**
 * Validate PIN format
 */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Validate Indian mobile number format (10 digits, optionally with +91)
 */
export function normalizeMobileNumber(mobile: string): string {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.substring(2);
  }
  return cleaned;
}
