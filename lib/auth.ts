export function validateLicenseKey(key: string): boolean {
  const keys = process.env.LICENSE_KEYS ?? "";
  const validKeys = keys.split(",").map(k => k.trim()).filter(Boolean);
  return validKeys.includes(key.trim());
}

export function requireAuth(licenseKey: string | undefined) {
  if (!licenseKey) return "請輸入授權碼";
  if (!validateLicenseKey(licenseKey)) return "授權碼無效或已過期";
  return null;
}
