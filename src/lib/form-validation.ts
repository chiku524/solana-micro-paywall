// Form validation utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateField(
  value: any,
  rules: ValidationRule,
  fieldName?: string
): string | null {
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return `${fieldName || 'This field'} is required`;
  }

  if (!value && !rules.required) {
    return null; // Optional field, no validation needed
  }

  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName || 'This field'} must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName || 'This field'} must be no more than ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return `${fieldName || 'This field'} format is invalid`;
    }

    if (rules.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (rules.url) {
      try {
        new URL(value);
      } catch {
        return 'Please enter a valid URL';
      }
    }
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
}

export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, ValidationRule>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const error = validateField(data[field], fieldRules, field);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Common validation rules
export const validationRules = {
  required: { required: true },
  email: { required: true, email: true },
  url: { url: true },
  slug: {
    required: true,
    pattern: /^[a-z0-9-]+$/,
    minLength: 3,
    maxLength: 50,
  },
  price: {
    required: true,
    custom: (value: any) => {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return 'Price must be a positive number';
      }
      return null;
    },
  },
};

