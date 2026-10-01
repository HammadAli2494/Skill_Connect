import { User } from '../models/User.js';
import { ProviderProfile } from '../models/ProviderProfile.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { setAuthCookie, clearAuthCookie } from '../utils/cookies.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { createRawToken, hashToken, signAccessToken } from '../utils/tokens.js';
import { env } from '../config/env.js';
import { resetEmail, sendEmail, verificationEmail } from '../services/mailer.js';

const GENERIC_LOGIN = 'Invalid email or password.';
const GENERIC_RESET = 'If an account exists for that email, a reset link is on its way.';

async function issueVerification(user) {
  const raw = createRawToken();
  user.emailVerificationTokenHash = hashToken(raw);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  const link = `${env.frontendUrl}/verify-email?token=${raw}`;
  const mail = verificationEmail(user.name, link);
  return sendEmail({ to: user.email, ...mail });
}

export const register = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email.toLowerCase() }).select('_id');
  if (existing) {
    throw new ApiError(409, 'An account with that email already exists.');
  }

  const passwordHash = await hashPassword(req.body.password);
  const user = await User.create({
    name: req.body.name,
    email: req.body.email.toLowerCase(),
    passwordHash,
    role: req.body.role,
    phone: req.body.phone || '',
  });

  const emailResult = await issueVerification(user);
  setAuthCookie(res, signAccessToken(user._id));
  res.status(201).json({
    success: true,
    data: { user: user.toPublic(), emailNotice: emailResult?.notice || '' },
  });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) throw new ApiError(401, GENERIC_LOGIN);

  const matches = await comparePassword(req.body.password, user.passwordHash);
  if (!matches) throw new ApiError(401, GENERIC_LOGIN);

  setAuthCookie(res, signAccessToken(user._id));
  res.json({ success: true, data: { user: user.toPublic() } });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, data: { loggedOut: true } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublic() } });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(req.body.token),
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationTokenHash +emailVerificationExpires');

  if (!user) throw new ApiError(400, 'This verification link is invalid or has expired.');

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  res.json({ success: true, data: { user: user.toPublic() } });
});

export const resendVerification = asyncHandler(async (req, res) => {
  if (req.user.isEmailVerified) {
    res.json({ success: true, data: { sent: false } });
    return;
  }
  const user = await User.findById(req.user._id).select(
    '+emailVerificationTokenHash +emailVerificationExpires'
  );
  const emailResult = await issueVerification(user);
  res.json({
    success: true,
    data: { sent: Boolean(emailResult?.delivered), emailNotice: emailResult?.notice || '' },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select(
    '+passwordResetTokenHash +passwordResetExpires'
  );
  if (user && user.isActive) {
    const raw = createRawToken();
    user.passwordResetTokenHash = hashToken(raw);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const link = `${env.frontendUrl}/reset-password?token=${raw}`;
    const mail = resetEmail(user.name, link);
    await sendEmail({ to: user.email, ...mail });
  }
  res.json({ success: true, message: GENERIC_RESET });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(req.body.token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordHash +passwordResetTokenHash +passwordResetExpires');

  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired.');

  user.passwordHash = await hashPassword(req.body.password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  clearAuthCookie(res);
  res.json({ success: true, data: { reset: true } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  const matches = await comparePassword(req.body.currentPassword, user.passwordHash);
  if (!matches) throw new ApiError(400, 'Current password is incorrect.');
  user.passwordHash = await hashPassword(req.body.newPassword);
  await user.save();
  res.json({ success: true, data: { changed: true } });
});

export const updateMe = asyncHandler(async (req, res) => {
  if (req.body.name) req.user.name = req.body.name;
  if (req.body.phone !== undefined) req.user.phone = req.body.phone;
  await req.user.save();
  res.json({ success: true, data: { user: req.user.toPublic() } });
});

export async function loadProviderProfile(userId) {
  return ProviderProfile.findOne({ user: userId });
}
