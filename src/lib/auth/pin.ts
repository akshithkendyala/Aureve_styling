import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Validate Indian mobile number format (10 digits, optionally with +91)
 */
export function normalizeMobileNumber(mobile: string): string {
  if (!mobile) return '';
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Validate PIN format (exactly 6 numeric digits)
 */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin || '');
}

/**
 * Hash a 6-digit numeric PIN securely before storing
 */
export async function hashPin(pin: string): Promise<string> {
  if (!isValidPinFormat(pin)) {
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
 * Deterministically map a mobile number to a Supabase Auth email
 */
export function mobileToSupabaseEmail(mobile: string): string {
  const clean = normalizeMobileNumber(mobile);
  return `user_${clean}@aureve.app`;
}

/**
 * Deterministically map a 6-digit PIN to a secure password for Supabase Auth
 */
export function pinToSupabasePassword(pin: string): string {
  return `AurevePIN#${pin}#SecurityKey2026!`;
}
