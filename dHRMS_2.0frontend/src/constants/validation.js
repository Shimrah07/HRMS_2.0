import dayjs from 'dayjs';

// --- Normalization Helpers (Ant Design Form.Item normalizers) ---
export const NORMALIZE = {
  // Automatically convert lowercase letters to uppercase
  uppercase: (value) => (value ? value.toUpperCase() : value),
  
  // Strip all non-numeric characters from the input
  numeric: (value) => (value ? value.replace(/\D/g, '') : value),
};

// --- Keystroke Filters (for onKeyPress event handlers) ---
export const FILTER_KEYPRESS = {
  // Prevent any keypress that is not a digit
  numericOnly: (e) => {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  },
};

// --- Reusable Form Rules ---
export const VALIDATORS = {
  required: (fieldName) => {
    let msg = `Please enter the ${fieldName.toLowerCase()}.`;
    const lower = fieldName.toLowerCase();
    if (lower.includes('official email') || lower.includes('work email')) {
      msg = "Please enter the employee's official email.";
    } else if (lower.includes('personal email')) {
      msg = "Please enter your personal email address.";
    } else if (lower.includes('password')) {
      msg = "Please enter your account password.";
    } else if (lower.includes('phone') || lower.includes('mobile')) {
      msg = "Please enter the mobile number.";
    }
    return {
      required: true,
      message: msg,
    };
  },
  
  requiredSelect: (fieldName) => ({
    required: true,
    message: `Please select the ${fieldName.toLowerCase()}.`,
  }),

  email: {
    type: 'email',
    message: 'Please enter a valid work email address (example: name@company.com).',
  },

  personalEmail: {
    type: 'email',
    message: 'Please enter a valid personal email address (example: name@gmail.com).',
  },

  phone: {
    pattern: /^[6-9]\d{9}$/,
    message: 'Please enter a valid 10-digit mobile number.',
  },

  aadhaar: {
    pattern: /^\d{12}$/,
    message: 'Please enter a valid 12-digit Aadhaar number.',
  },

  pan: {
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    message: 'Please enter a valid PAN in the format ABCDE1234F.',
  },

  ifsc: {
    pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    message: 'Please enter a valid IFSC code (example: HDFC0001234).',
  },

  pincode: {
    pattern: /^\d{6}$/,
    message: 'Please enter a valid 6-digit pincode.',
  },

  accountNumber: {
    pattern: /^\d{9,18}$/,
    message: 'Please enter a valid bank account number (9-18 digits).',
  },

  // Custom date of birth validator (must be >= 18 years old and not in the future)
  dob: () => ({
    validator: (_, value) => {
      if (!value) return Promise.resolve();
      const today = dayjs();
      if (value.isAfter(today)) {
        return Promise.reject(new Error('Date of birth cannot be in the future.'));
      }
      const age = today.diff(value, 'year');
      if (age < 18) {
        return Promise.reject(new Error('Employee must be at least 18 years old.'));
      }
      return Promise.resolve();
    },
  }),

  // Passing year validator (cannot exceed current year)
  passingYear: () => ({
    validator: (_, value) => {
      if (value === undefined || value === null) return Promise.resolve();
      const currentYear = new Date().getFullYear();
      if (value > currentYear) {
        return Promise.reject(new Error(`Passing year cannot exceed the current year (${currentYear}).`));
      }
      return Promise.resolve();
    },
  }),
};
