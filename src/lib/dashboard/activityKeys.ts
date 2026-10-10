/**
 * The activities the API writes and the placeholders each one's text may use (the API's
 * `ACTIVITY_REGISTRY`, gradfolio-api `src/api/activities/utils/activity-registry.ts`). The
 * dictionary has one string per key; `locales.test.ts` checks each fills exactly these
 * placeholders. A key not listed here is shown as a neutral line, never as the raw key.
 */
export const ACTIVITY_PARAMS = {
  projectCreated: ["projectName"],
  projectPublished: ["projectName"],
  projectDeleted: ["projectName"],
  newSkill: ["skillName"],
  teamInvited: ["projectName", "memberName"],
  teamMemberJoined: ["projectName", "memberName"],
  teamMemberDeclined: ["projectName", "memberName"],
  teamLeft: ["projectName", "memberName"],
  teamJoined: ["projectName"],
} as const;

export type ActivityKey = keyof typeof ACTIVITY_PARAMS;

export const isActivityKey = (key: string): key is ActivityKey =>
  Object.hasOwn(ACTIVITY_PARAMS, key);
