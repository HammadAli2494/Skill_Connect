import bcrypt from 'bcryptjs';

const ROUNDS = 12;

export function hashPassword(password) {
  return bcrypt.hash(password, ROUNDS);
}

export function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
