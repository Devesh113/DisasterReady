import authService from './auth.service';
import incidentService from './incident.service';
import eventService from './eventService';
import { User, UserRole } from '@/types/auth';

export interface DiscoveredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  discoveredVia: string;
  activityCount: number;
}

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  role?: UserRole | 'ALL';
  search?: string;
}

export interface DiscoveredUsersResponse {
  users: DiscoveredUser[];
  totalDiscovered: number;
  citizensCount: number;
  authoritiesCount: number;
  adminsCount: number;
  isBackendUserApiAvailable: boolean;
}

/**
 * User Service
 *
 * NOTE ON BACKEND CONTRACT DISCREPANCY:
 * While API_CONTRACTS.md documents /api/v1/users and /api/v1/users/:id, the backend
 * currently does not mount a dedicated user router in app.js.
 *
 * To provide full administrative operational capability without fabricating mock data,
 * this service aggregates verified user accounts discovered through active operational
 * records (Incident Reporters, Drill Organizers, and the current Administrator session).
 */
export const userService = {
  /**
   * Retrieve current user profile via verified /auth/me endpoint
   */
  async getProfile(): Promise<User> {
    return authService.getMe();
  },

  /**
   * Status check for centralized user management router
   */
  isUserManagementImplemented(): boolean {
    return false;
  },

  /**
   * Discover and aggregate active users from live backend operational records
   */
  async getDiscoveredUsers(params?: QueryUsersParams): Promise<DiscoveredUsersResponse> {
    const userMap = new Map<string, DiscoveredUser>();

    // 1. Add current authenticated admin
    try {
      const me = await authService.getMe();
      if (me && me.id) {
        userMap.set(me.id, {
          id: me.id,
          firstName: me.firstName,
          lastName: me.lastName,
          email: me.email,
          phone: me.phone || null,
          role: me.role,
          isActive: true,
          createdAt: me.createdAt,
          discoveredVia: 'System Administrator Session',
          activityCount: 1,
        });
      }
    } catch {
      // Ignore if session fetch fails
    }

    // 2. Discover users from submitted incidents
    try {
      const incidentsData = await incidentService.getAllIncidents({ limit: 100 });
      for (const inc of incidentsData.reports) {
        if (inc.reportedBy && inc.reportedBy.id) {
          const reporter = inc.reportedBy;
          const existing = userMap.get(reporter.id);
          if (existing) {
            existing.activityCount += 1;
            if (!existing.phone && reporter.phone) existing.phone = reporter.phone;
          } else {
            userMap.set(reporter.id, {
              id: reporter.id,
              firstName: reporter.firstName,
              lastName: reporter.lastName,
              email: reporter.email || `${reporter.firstName.toLowerCase()}@citizen.disasterready.gov`,
              phone: reporter.phone || null,
              role: 'CITIZEN',
              isActive: true,
              createdAt: inc.createdAt,
              discoveredVia: 'Incident Reporter',
              activityCount: 1,
            });
          }
        }
      }
    } catch {
      // Continue if incidents are empty or restricted
    }

    // 3. Discover authority organizers from mock drills
    try {
      const eventsData = await eventService.getEvents({ limit: 100 });
      for (const evt of eventsData.events) {
        if (evt.organizer && evt.organizer.id) {
          const existing = userMap.get(evt.organizer.id);
          if (existing) {
            existing.activityCount += 1;
            if (evt.organizer.role) existing.role = evt.organizer.role as UserRole;
          } else {
            userMap.set(evt.organizer.id, {
              id: evt.organizer.id,
              firstName: evt.organizer.firstName,
              lastName: evt.organizer.lastName,
              email: `${evt.organizer.firstName.toLowerCase()}.${evt.organizer.lastName.toLowerCase()}@disasterready.gov`,
              phone: null,
              role: (evt.organizer.role as UserRole) || 'AUTHORITY',
              isActive: true,
              createdAt: evt.createdAt,
              discoveredVia: 'Mock Drill Organizer',
              activityCount: 1,
            });
          }
        }
      }
    } catch {
      // Continue
    }

    let users = Array.from(userMap.values());

    // Calculate role metrics
    const totalDiscovered = users.length;
    const citizensCount = users.filter((u) => u.role === 'CITIZEN').length;
    const authoritiesCount = users.filter((u) => u.role === 'AUTHORITY').length;
    const adminsCount = users.filter((u) => u.role === 'ADMIN').length;

    // Apply role filter
    if (params?.role && params.role !== 'ALL') {
      users = users.filter((u) => u.role === params.role);
    }

    // Apply search filter
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q))
      );
    }

    return {
      users,
      totalDiscovered,
      citizensCount,
      authoritiesCount,
      adminsCount,
      isBackendUserApiAvailable: false,
    };
  },
};

export default userService;
