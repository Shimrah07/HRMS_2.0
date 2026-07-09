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
    validator: (_, value) => {
      if (!value) return Promise.resolve();
      if (!/^\d{12}$/.test(value)) {
        return Promise.reject(new Error('Please enter a valid 12-digit Aadhaar number.'));
      }
      const d = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
      ];
      const p = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
      ];
      let c = 0;
      const invertedArray = value.split('').map(Number).reverse();
      for (let i = 0; i < invertedArray.length; i++) {
        c = d[c][p[(i % 8)][invertedArray[i]]];
      }
      if (c !== 0) {
        return Promise.reject(new Error('Invalid Aadhaar number (checksum validation failed).'));
      }
      return Promise.resolve();
    }
  },

  uan: {
    pattern: /^\d{12}$/,
    message: 'Please enter a valid 12-digit UAN number.',
  },

  esi: {
    pattern: /^\d{17}$/,
    message: 'Please enter a valid 17-digit ESIC IP number.',
  },

  npspran: {
    pattern: /^\d{12}$/,
    message: 'Please enter a valid 12-digit NPS PRAN number.',
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
      if (age > 65) {
        return Promise.reject(new Error('Age must be between 18 and 65 years.'));
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
