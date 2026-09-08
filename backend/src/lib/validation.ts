export const STATUSES = ["applied", "phone_screen", "interview", "offer", "rejected", "other"] as const;
export const CONTACT_METHODS = ["none", "email", "mail", "fax"] as const;

// Max length per field — generous enough for real use, small enough that a
// caller can't stuff megabytes into a single DynamoDB item.
const STRING_FIELD_LIMITS: Record<string, number> = {
  company: 200,
  role: 200,
  url: 2000,
  notes: 2000,
  dateApplied: 100,
  activity: 500,
  employerAddress: 300,
  employerCityStateZip: 200,
  employerPhone: 50,
  contactValue: 300,
  personContacted: 200,
};

/**
 * Validates whichever of the known fields are present in body. Used for both
 * create (all fields optional except company, checked separately by the
 * caller) and update (only the fields being changed need to be valid).
 */
export function validateFields(body: Record<string, unknown>): string[] {
  const errors: string[] = [];

  for (const [field, maxLength] of Object.entries(STRING_FIELD_LIMITS)) {
    const value = body[field];
    if (value === undefined) continue;
    if (typeof value !== "string") {
      errors.push(`${field} must be a string`);
      continue;
    }
    if (value.length > maxLength) {
      errors.push(`${field} must be at most ${maxLength} characters`);
    }
  }

  if (body.status !== undefined && !(STATUSES as readonly unknown[]).includes(body.status)) {
    errors.push(`status must be one of: ${STATUSES.join(", ")}`);
  }

  if (body.contactMethod !== undefined && !(CONTACT_METHODS as readonly unknown[]).includes(body.contactMethod)) {
    errors.push(`contactMethod must be one of: ${CONTACT_METHODS.join(", ")}`);
  }

  return errors;
}
