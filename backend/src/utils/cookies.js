import { isProd } from '../config/env.js';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: WEEK,
    path: '/',
  };
}

export function setAuthCookie(res, token) {
  res.cookie('accessToken', token, cookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
}
