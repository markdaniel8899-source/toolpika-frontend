import messages from "../../../messages/admin.json";

/**
 * Admin strings.
 *
 * The dashboard has no locale prefix (admin.md §1) so it is English-only and
 * does not go through next-intl. The copy still lives in messages/admin.json
 * so no UI string is hardcoded in a component.
 */
export const adminMessages = messages;

export type AdminMessages = typeof adminMessages;
