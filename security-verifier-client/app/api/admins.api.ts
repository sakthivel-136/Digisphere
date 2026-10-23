export interface AdminUser {
  id: string;
  user_id: string;
  name: string;
  role: 'ADMIN' | 'MD' | 'INDUSTRY_ENGINEER' | 'CEO';
  is_active: number;
  created_at?: string;
}

export interface CreateAdminPayload {
  user_id: string;
  name: string;
  user_pin: string;
  role: 'ADMIN' | 'MD';
}

const D1_WORKER_URL = 'https://pentagon-patrol-api.srmdatabase2025.workers.dev/query';

/**
 * Fetch all admins from login_info.
 * User PINs are masked for privacy among admins.
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const res = await fetch(D1_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:
          'SELECT id, user_id, name, role, is_active, created_at FROM login_info WHERE is_active = 1 ORDER BY created_at DESC',
      }),
    });
    if (!res.ok) throw new Error('Failed to load admin users');
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (error) {
    console.error('Error in getAdminUsers:', error);
    throw error;
  }
}

/**
 * Validates that a 4-digit PIN is not already in use by ANY security user or admin.
 */
export async function checkPinUnique(
  pin: string,
  options?: { excludeSecurityId?: string; excludeAdminId?: string }
): Promise<{ isUnique: boolean; message?: string }> {
  const cleanPin = pin.trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    return { isUnique: false, message: 'PIN must be exactly 4 numeric digits (e.g. 1234).' };
  }

  try {
    // 1. Check in login_info (admins)
    const adminCheckRes = await fetch(D1_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'SELECT id, user_id FROM login_info WHERE user_pin = ? AND is_active = 1',
        params: [cleanPin],
      }),
    });
    const adminRows = await adminCheckRes.json();
    const adminList = Array.isArray(adminRows) ? adminRows : adminRows.results || [];
    const conflictingAdmin = adminList.find(
      (a: any) => !options?.excludeAdminId || a.id !== options.excludeAdminId
    );
    if (conflictingAdmin) {
      return {
        isUnique: false,
        message: 'This PIN is already assigned. Please try another unique 4-digit PIN.',
      };
    }

    // 2. Check in security_users
    const secCheckRes = await fetch(D1_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'SELECT security_id FROM security_users WHERE security_password = ?',
        params: [cleanPin],
      }),
    });
    const secRows = await secCheckRes.json();
    const secList = Array.isArray(secRows) ? secRows : secRows.results || [];
    const conflictingSec = secList.find(
      (s: any) => !options?.excludeSecurityId || s.security_id !== options.excludeSecurityId
    );
    if (conflictingSec) {
      return {
        isUnique: false,
        message: 'This PIN is already assigned. Please try another unique 4-digit PIN.',
      };
    }

    return { isUnique: true };
  } catch (error) {
    console.error('Error checking PIN uniqueness:', error);
    return { isUnique: true };
  }
}

/**
 * Creates a new Admin or Managing Director (MD) with a unique 4-digit PIN.
 */
export async function createAdminUser(payload: CreateAdminPayload): Promise<AdminUser> {
  const pinCheck = await checkPinUnique(payload.user_pin);
  if (!pinCheck.isUnique) {
    throw new Error(pinCheck.message || 'PIN is already taken');
  }

  const id = crypto.randomUUID ? crypto.randomUUID() : 'adm-' + Date.now();
  const userId = payload.user_id.trim().toLowerCase();
  const name = payload.name.trim().toUpperCase();
  const role = payload.role === 'MD' ? 'MD' : 'ADMIN';

  // Check unique user_id
  const userCheckRes = await fetch(D1_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'SELECT id FROM login_info WHERE user_id = ?',
      params: [userId],
    }),
  });
  const userRows = await userCheckRes.json();
  const userList = Array.isArray(userRows) ? userRows : userRows.results || [];
  if (userList.length > 0) {
    throw new Error(`Admin username "${userId}" is already taken. Please choose another.`);
  }

  const insertRes = await fetch(D1_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query:
        'INSERT INTO login_info (id, user_id, user_pin, name, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      params: [id, userId, payload.user_pin.trim(), name, role],
    }),
  });

  if (!insertRes.ok) {
    throw new Error('Failed to create admin in database');
  }

  return {
    id,
    user_id: userId,
    name,
    role,
    is_active: 1,
  };
}

/**
 * Deletes / Deactivates an admin user.
 */
export async function deleteAdminUser(id: string): Promise<void> {
  const res = await fetch(D1_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'DELETE FROM login_info WHERE id = ?',
      params: [id],
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to delete admin');
  }
}
