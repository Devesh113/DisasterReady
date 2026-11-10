import authService from './auth.service';
import { User } from '@/types/auth';

/**
 * User Service
 *
 * NOTE ON BACKEND CONTRACT DISCREPANCY:
 * While API_CONTRACTS.md documents /api/v1/users and /api/v1/users/:id, the backend
 * currently does not implement user routes or controllers (see inspection findings in
 * documentation/FRONTEND_PROGRESS.md).
 *
 * The official and verified endpoint for the current user is GET /api/v1/auth/me,
 * which is delegated here to preserve architectural boundaries without inventing endpoints.
 */
export const userService = {
  /**
   * Retrieve current user profile via verified /auth/me endpoint
   */
  async getProfile(): Promise<User> {
    return authService.getMe();
  },

  /**
   * Status check for user management capability
   */
  isUserManagementImplemented(): boolean {
    return false;
  },
};

export default userService;
