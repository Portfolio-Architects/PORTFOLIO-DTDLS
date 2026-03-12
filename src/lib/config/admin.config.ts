/**
 * @module admin.config
 * @description Admin authorization configuration.
 * Architecture Layer: Config (externalized constants)
 * 
 * Rationale: Admin emails were hardcoded in DashboardFacade.
 * Extracting to a config module enables:
 * - Easy modification without touching business logic
 * - Future migration to environment variables or remote config
 */

/** Authorized admin email addresses */
export const ADMIN_EMAILS: readonly string[] = ['ocs5672@gmail.com'];

/**
 * Checks if a given email belongs to an admin user.
 * @param email - The user's email address (nullable)
 * @returns true if the email is in the admin list
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}
