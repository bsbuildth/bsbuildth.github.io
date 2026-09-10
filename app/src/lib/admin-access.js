export const hasAdminClaim = (claims) => claims?.admin === true;

const TRANSITIONAL_ADMIN_EMAILS = new Set(['songyos2528@gmail.com']);

export const hasAdminAccess = (claims, email = '') => (
  hasAdminClaim(claims) || TRANSITIONAL_ADMIN_EMAILS.has(String(email).trim().toLowerCase())
);
