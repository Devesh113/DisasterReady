const { z } = require('zod');

/**
 * Validation schema for user registration (POST /api/auth/register)
 * Maps directly to the DisasterReady User model and API_CONTRACTS.md
 */
const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must not exceed 100 characters'),
  firstName: z
    .string({ required_error: 'First name is required' })
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters'),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters'),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable(),
  role: z
    .enum(['CITIZEN', 'AUTHORITY'], {
      errorMap: () => ({ message: "Role must be either 'CITIZEN' or 'AUTHORITY'" }),
    })
    .default('CITIZEN')
    .optional(),
});

/**
 * Validation schema for login (POST /api/auth/login)
 */
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

/**
 * Validation schema for changing password (PATCH /api/auth/change-password)
 */
const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password is required'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters long')
    .max(100, 'New password must not exceed 100 characters'),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
};
