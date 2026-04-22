/**
 * useTraditionalValidation.ts
 * Submit-only validation hook for the Traditional Form.
 * Deliberately NO inline validation — shows all errors only on submit.
 * This is intentionally bad UX to contrast with the AI form.
 */

/**
 * Validate all fields from the traditional form.
 * Returns a dict of fieldId → error message (empty = no error).
 */
export function validateTraditionalForm(
  values: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {};

  // First Name
  if (!values['firstName']?.trim()) {
    errors['firstName'] = 'This field is required.';
  }

  // Last Name
  if (!values['lastName']?.trim()) {
    errors['lastName'] = 'This field is required.';
  }

  // Email
  const emailVal = values['email']?.trim() ?? '';
  if (!emailVal) {
    errors['email'] = 'This field is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    errors['email'] = 'Please enter a valid email address.';
  }

  // Confirm Email — must match email
  const confirmEmailVal = values['confirmEmail']?.trim() ?? '';
  if (!confirmEmailVal) {
    errors['confirmEmail'] = 'This field is required.';
  } else if (confirmEmailVal !== emailVal) {
    errors['confirmEmail'] = 'Email addresses do not match.';
  }

  // Phone — only +1 (XXX) XXX-XXXX accepted (deliberately US-centric)
  const phoneVal = values['phone']?.trim() ?? '';
  if (!phoneVal) {
    errors['phone'] = 'This field is required.';
  } else if (!/^\+1 \(\d{3}\) \d{3}-\d{4}$/.test(phoneVal)) {
    errors['phone'] = 'Invalid phone number format. Please use +1 (XXX) XXX-XXXX.';
  }

  // Country
  if (!values['country']?.trim()) {
    errors['country'] = 'Please select a country.';
  }

  // City
  if (!values['city']?.trim()) {
    errors['city'] = 'This field is required.';
  }

  // Job Title
  if (!values['jobTitle']?.trim()) {
    errors['jobTitle'] = 'This field is required.';
  }

  // Company
  if (!values['company']?.trim()) {
    errors['company'] = 'This field is required.';
  }

  // Attendance Date
  if (!values['attendanceDate']?.trim()) {
    errors['attendanceDate'] = 'Please select a date.';
  }

  // Session Track
  if (!values['sessionTrack']?.trim()) {
    errors['sessionTrack'] = 'This field is required.';
  }

  // Dietary — optional, no validation

  // T-Shirt Size
  if (!values['tshirtSize']?.trim()) {
    errors['tshirtSize'] = 'This field is required.';
  }

  // Accessibility Needs — optional, no validation

  // Terms
  if (values['terms'] !== 'agreed') {
    errors['terms'] = 'You must agree to the terms and conditions.';
  }

  return errors;
}

/**
 * Get ordered list of error messages for the banner at top of form.
 * Returns only messages for fields that have errors, in field order.
 */
export function getOrderedErrorMessages(
  errors: Record<string, string>,
  fieldOrder: string[]
): string[] {
  return fieldOrder
    .filter((id) => errors[id])
    .map((id) => errors[id]);
}
