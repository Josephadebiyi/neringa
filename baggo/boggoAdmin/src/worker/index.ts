import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Variables {
  adminUser: AdminUser;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Simple admin authentication middleware
const adminAuthMiddleware = async (c: any, next: () => Promise<void>) => {
  const sessionToken = getCookie(c, 'admin_session');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const session = await c.env.DB.prepare(`
      SELECT s.*, u.id as user_id, u.username, u.email, u.first_name, u.last_name, u.role
      FROM admin_sessions s
      JOIN admin_users u ON s.admin_user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = TRUE
    `).bind(sessionToken).first();

    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    c.set('adminUser', {
      id: session.user_id,
      username: session.username,
      email: session.email,
      first_name: session.first_name,
      last_name: session.last_name,
      role: session.role
    });

    await next();
  } catch (error) {
    return c.json({ error: 'Authentication failed' }, 401);
  }
};

// Generate session token
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Login endpoint
const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

app.post('/api/admin/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { username, password } = c.req.valid('json');
    
    // For demo purposes, we'll accept the test credentials
    // In production, you'd hash and verify the password properly
    if (username === 'admin' && password === 'admin123') {
      const admin = await c.env.DB.prepare(`
        SELECT * FROM admin_users WHERE username = ? AND is_active = TRUE
      `).bind(username).first();

      if (!admin) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await c.env.DB.prepare(`
        INSERT INTO admin_sessions (session_token, admin_user_id, expires_at)
        VALUES (?, ?, ?)
      `).bind(sessionToken, admin.id, expiresAt.toISOString()).run();

      // Update last login
      await c.env.DB.prepare(`
        UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(admin.id).run();

      // Set session cookie
      setCookie(c, 'admin_session', sessionToken, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: false, // Set to true in production
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return c.json({ success: true, user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        role: admin.role
      }});
    } else {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Check current admin user
app.get('/api/admin/me', adminAuthMiddleware, async (c) => {
  const adminUser = c.get('adminUser');
  return c.json(adminUser);
});

// Logout endpoint
app.post('/api/admin/logout', async (c) => {
  const sessionToken = getCookie(c, 'admin_session');
  
  if (sessionToken) {
    await c.env.DB.prepare(`
      DELETE FROM admin_sessions WHERE session_token = ?
    `).bind(sessionToken).run();
  }

  setCookie(c, 'admin_session', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: false,
    maxAge: 0,
  });

  return c.json({ success: true });
});

// Dashboard stats
app.get('/api/dashboard/stats', adminAuthMiddleware, async (c) => {
  try {
    // Get total users
    const totalUsersResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first() as any;
    
    // Get total travelers
    const totalTravelersResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM travelers").first() as any;
    
    // Get total items
    const totalItemsResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM items").first() as any;
    
    // Get total orders and commission
    const totalOrdersResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM orders").first() as any;
    const totalCommissionResult = await c.env.DB.prepare("SELECT SUM(commission_amount) as total FROM orders WHERE payment_status = 'paid'").first() as any;
    
    // Get pending support tickets
    const pendingTicketsResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM support_tickets WHERE status IN ('open', 'in_progress')").first() as any;
    
    // Get pending withdrawal requests
    const pendingWithdrawalsResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM withdrawal_requests WHERE status = 'pending'").first() as any;
    
    // Get total income (sum of all completed orders)
    const totalIncomeResult = await c.env.DB.prepare("SELECT SUM(total_amount) as total FROM orders WHERE order_status = 'completed'").first() as any;
    
    // Get app visitors count (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentVisitorsResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM app_visitors WHERE created_at >= ?").bind(thirtyDaysAgo).first() as any;
    
    return c.json({
      totalUsers: totalUsersResult?.count || 0,
      totalTravelers: totalTravelersResult?.count || 0,
      totalItems: totalItemsResult?.count || 0,
      totalOrders: totalOrdersResult?.count || 0,
      totalCommission: totalCommissionResult?.total || 0,
      totalIncome: totalIncomeResult?.total || 0,
      pendingTickets: pendingTicketsResult?.count || 0,
      pendingWithdrawals: pendingWithdrawalsResult?.count || 0,
      recentVisitors: recentVisitorsResult?.count || 0
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
  }
});

// Users management
app.get('/api/users', adminAuthMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    
    const { results } = await c.env.DB.prepare(`
      SELECT u.*, t.rating, t.total_trips, t.verification_status as traveler_status
      FROM users u
      LEFT JOIN travelers t ON u.id = t.user_id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    const totalCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
    
    return c.json({
      users: results,
      totalCount: totalCount?.count || 0,
      page,
      limit
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Items/Tracking management
app.get('/api/items', adminAuthMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    
    const { results } = await c.env.DB.prepare(`
      SELECT i.*, 
             u1.first_name as sender_name, u1.email as sender_email,
             u2.first_name as traveler_name, u2.email as traveler_email
      FROM items i
      LEFT JOIN users u1 ON i.sender_id = u1.id
      LEFT JOIN users u2 ON i.traveler_id = u2.id
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    const totalCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM items").first();
    
    return c.json({
      items: results,
      totalCount: totalCount?.count || 0,
      page,
      limit
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch items' }, 500);
  }
});

// Update item status
const updateItemSchema = z.object({
  status: z.string(),
  traveler_id: z.number().optional(),
});

app.put('/api/items/:id', adminAuthMiddleware, zValidator('json', updateItemSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { status, traveler_id } = c.req.valid('json');
    
    let query = "UPDATE items SET status = ?, updated_at = CURRENT_TIMESTAMP";
    let params: any[] = [status];
    
    if (traveler_id) {
      query += ", traveler_id = ?";
      params.push(traveler_id);
    }
    
    query += " WHERE id = ?";
    params.push(id);
    
    await c.env.DB.prepare(query).bind(...params).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update item' }, 500);
  }
});

// Support tickets
app.get('/api/support-tickets', adminAuthMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT st.*, u.first_name, u.last_name, u.email,
             au.first_name as assigned_name
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      LEFT JOIN admin_users au ON st.assigned_to = au.id
      ORDER BY st.created_at DESC
    `).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch support tickets' }, 500);
  }
});

// Withdrawal requests
app.get('/api/withdrawal-requests', adminAuthMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT wr.*, u.first_name, u.last_name, u.email
      FROM withdrawal_requests wr
      LEFT JOIN users u ON wr.user_id = u.id
      ORDER BY wr.created_at DESC
    `).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch withdrawal requests' }, 500);
  }
});

// Analytics API
app.get('/api/analytics', adminAuthMiddleware, async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '7');
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    // Get visitors
    const { results: visitors } = await c.env.DB.prepare(`
      SELECT * FROM app_visitors 
      WHERE created_at >= ? 
      ORDER BY created_at DESC
    `).bind(dateFrom).all();
    
    // Get stats
    const totalVisitorsResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM app_visitors WHERE created_at >= ?
    `).bind(dateFrom).first() as any;
    
    const registeredUsersResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM app_visitors WHERE user_id IS NOT NULL AND created_at >= ?
    `).bind(dateFrom).first() as any;
    
    const avgAgeResult = await c.env.DB.prepare(`
      SELECT AVG(age) as avg FROM app_visitors WHERE age IS NOT NULL AND created_at >= ?
    `).bind(dateFrom).first() as any;
    
    // Top countries
    const { results: topCountries } = await c.env.DB.prepare(`
      SELECT country, COUNT(*) as count 
      FROM app_visitors 
      WHERE created_at >= ? 
      GROUP BY country 
      ORDER BY count DESC 
      LIMIT 5
    `).bind(dateFrom).all();
    
    // Gender breakdown
    const { results: genderBreakdown } = await c.env.DB.prepare(`
      SELECT gender, COUNT(*) as count 
      FROM app_visitors 
      WHERE gender IS NOT NULL AND created_at >= ? 
      GROUP BY gender
    `).bind(dateFrom).all();
    
    // Age groups
    const { results: ageGroups } = await c.env.DB.prepare(`
      SELECT 
        CASE 
          WHEN age < 25 THEN '18-24'
          WHEN age < 35 THEN '25-34'
          WHEN age < 45 THEN '35-44'
          WHEN age < 55 THEN '45-54'
          ELSE '55+'
        END as group,
        COUNT(*) as count
      FROM app_visitors 
      WHERE age IS NOT NULL AND created_at >= ?
      GROUP BY group
    `).bind(dateFrom).all();
    
    // Page views
    const { results: pageViews } = await c.env.DB.prepare(`
      SELECT page_visited as page, COUNT(*) as count 
      FROM app_visitors 
      WHERE created_at >= ? 
      GROUP BY page_visited 
      ORDER BY count DESC 
      LIMIT 10
    `).bind(dateFrom).all();
    
    return c.json({
      visitors,
      stats: {
        totalVisitors: totalVisitorsResult?.count || 0,
        registeredUsers: registeredUsersResult?.count || 0,
        averageAge: avgAgeResult?.avg || 0,
        topCountries,
        genderBreakdown,
        ageGroups,
        pageViews
      }
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// Staff management
app.get('/api/staff', adminAuthMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, email, first_name, last_name, role, permissions, is_active, created_at
      FROM staff 
      ORDER BY created_at DESC
    `).all();
    
    const staffWithParsedPermissions = results.map((staff: any) => ({
      ...staff,
      permissions: JSON.parse(staff.permissions || '[]')
    }));
    
    return c.json(staffWithParsedPermissions);
  } catch (error) {
    return c.json({ error: 'Failed to fetch staff' }, 500);
  }
});

const createStaffSchema = z.object({
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.string(),
  permissions: z.array(z.string())
});

app.post('/api/staff', adminAuthMiddleware, zValidator('json', createStaffSchema), async (c) => {
  try {
    const { email, first_name, last_name, role, permissions } = c.req.valid('json');
    const adminUser = c.get('adminUser');
    
    await c.env.DB.prepare(`
      INSERT INTO staff (email, first_name, last_name, role, permissions, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(email, first_name, last_name, role, JSON.stringify(permissions), adminUser.id).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to create staff member' }, 500);
  }
});

app.put('/api/staff/:id', adminAuthMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const updates = await c.req.json();
    
    let query = 'UPDATE staff SET updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [];
    
    Object.keys(updates).forEach(key => {
      if (['email', 'first_name', 'last_name', 'role', 'is_active'].includes(key)) {
        query += `, ${key} = ?`;
        params.push(updates[key]);
      } else if (key === 'permissions') {
        query += ', permissions = ?';
        params.push(JSON.stringify(updates[key]));
      }
    });
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await c.env.DB.prepare(query).bind(...params).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update staff member' }, 500);
  }
});

app.delete('/api/staff/:id', adminAuthMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    await c.env.DB.prepare('DELETE FROM staff WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete staff member' }, 500);
  }
});

// Push notifications
app.get('/api/push-notifications', adminAuthMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM push_notifications ORDER BY created_at DESC
    `).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

const createNotificationSchema = z.object({
  title: z.string(),
  message: z.string(),
  target_type: z.string(),
  target_users: z.array(z.number()).optional()
});

app.post('/api/push-notifications', adminAuthMiddleware, zValidator('json', createNotificationSchema), async (c) => {
  try {
    const { title, message, target_type, target_users } = c.req.valid('json');
    const adminUser = c.get('adminUser');
    
    // Calculate target count based on type
    let targetCount = 0;
    if (target_type === 'all') {
      const count = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
      targetCount = count?.count || 0;
    } else if (target_type === 'users') {
      const count = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE user_type IN ('user', 'both')").first();
      targetCount = count?.count || 0;
    } else if (target_type === 'travelers') {
      const count = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE user_type IN ('traveler', 'both')").first();
      targetCount = count?.count || 0;
    } else if (target_type === 'specific' && target_users) {
      targetCount = target_users.length;
    }
    
    await c.env.DB.prepare(`
      INSERT INTO push_notifications (title, message, target_type, target_users, sent_count, status, created_by, sent_at)
      VALUES (?, ?, ?, ?, ?, 'sent', ?, CURRENT_TIMESTAMP)
    `).bind(
      title, 
      message, 
      target_type, 
      target_users ? JSON.stringify(target_users) : null,
      targetCount,
      adminUser.id
    ).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to send notification' }, 500);
  }
});

// Email campaigns
app.get('/api/email-campaigns', adminAuthMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM email_campaigns ORDER BY created_at DESC
    `).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch campaigns' }, 500);
  }
});

const createCampaignSchema = z.object({
  subject: z.string(),
  content: z.string(),
  target_type: z.string(),
  target_users: z.array(z.number()).optional()
});

app.post('/api/email-campaigns', adminAuthMiddleware, zValidator('json', createCampaignSchema), async (c) => {
  try {
    const { subject, content, target_type, target_users } = c.req.valid('json');
    const adminUser = c.get('adminUser');
    
    await c.env.DB.prepare(`
      INSERT INTO email_campaigns (subject, content, target_type, target_users, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      subject, 
      content, 
      target_type, 
      target_users ? JSON.stringify(target_users) : null,
      adminUser.id
    ).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to create campaign' }, 500);
  }
});

app.post('/api/email-campaigns/:id/send', adminAuthMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    // Get campaign details
    const campaign = await c.env.DB.prepare(`
      SELECT * FROM email_campaigns WHERE id = ?
    `).bind(id).first();
    
    if (!campaign) {
      return c.json({ error: 'Campaign not found' }, 404);
    }
    
    // Calculate target count
    let targetCount = 0;
    if (campaign.target_type === 'all_users') {
      const count = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
      targetCount = count?.count || 0;
    } else if (campaign.target_type === 'all_travelers') {
      const count = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE user_type IN ('traveler', 'both')").first();
      targetCount = count?.count || 0;
    } else if (campaign.target_type === 'specific_users' && campaign.target_users) {
      targetCount = JSON.parse(campaign.target_users).length;
    }
    
    // Update campaign status
    await c.env.DB.prepare(`
      UPDATE email_campaigns 
      SET status = 'sent', sent_count = ?, delivered_count = ?, sent_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(targetCount, targetCount, id).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to send campaign' }, 500);
  }
});

// App settings
app.get('/api/settings', adminAuthMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM app_settings ORDER BY setting_key").all();
    
    const settings: Record<string, any> = {};
    results.forEach((row: any) => {
      settings[row.setting_key] = row.setting_value;
    });
    
    return c.json(settings);
  } catch (error) {
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

const updateSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});

app.put('/api/settings', adminAuthMiddleware, zValidator('json', updateSettingSchema), async (c) => {
  try {
    const { key, value } = c.req.valid('json');
    const adminUser = c.get('adminUser');
    
    if (!adminUser) {
      return c.json({ error: "Admin user not found" }, 401);
    }
    
    await c.env.DB.prepare(`
      INSERT INTO app_settings (setting_key, setting_value, updated_by, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(setting_key) 
      DO UPDATE SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
    `).bind(key, value, adminUser.id, value, adminUser.id).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update setting' }, 500);
  }
});

// File management endpoints
app.get('/api/files', adminAuthMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT f.*, au.first_name || ' ' || au.last_name as uploader_name
      FROM files f
      LEFT JOIN admin_users au ON f.uploaded_by = au.id
      ORDER BY f.created_at DESC
    `).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch files' }, 500);
  }
});

app.post('/api/files/upload', adminAuthMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    const adminUser = c.get('adminUser');
    const fileName = `${Date.now()}-${file.name}`;
    
    // In a real app, you'd upload to R2 bucket here
    // For now, we'll just store file metadata
    const result = await c.env.DB.prepare(`
      INSERT INTO files (filename, original_name, file_type, file_size, uploaded_by)
      VALUES (?, ?, ?, ?, ?)
    `).bind(fileName, file.name, file.type, file.size, adminUser.id).run();
    
    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

app.delete('/api/files/:id', adminAuthMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    // Get file info first
    const file = await c.env.DB.prepare('SELECT * FROM files WHERE id = ?').bind(id).first();
    
    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }
    
    // Delete from database
    await c.env.DB.prepare('DELETE FROM files WHERE id = ?').bind(id).run();
    
    // In a real app, you'd also delete from R2 bucket here
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete file' }, 500);
  }
});

// Update withdrawal request status
const updateWithdrawalSchema = z.object({
  status: z.string(),
  failure_reason: z.string().optional(),
});

app.put('/api/withdrawal-requests/:id', adminAuthMiddleware, zValidator('json', updateWithdrawalSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { status, failure_reason } = c.req.valid('json');
    const adminUser = c.get('adminUser');
    
    let query = 'UPDATE withdrawal_requests SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [status];
    
    if (status === 'processed') {
      query += ', processed_by = ?, processed_at = CURRENT_TIMESTAMP';
      params.push(adminUser.id);
    }
    
    if (failure_reason) {
      query += ', failure_reason = ?';
      params.push(failure_reason);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await c.env.DB.prepare(query).bind(...params).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update withdrawal request' }, 500);
  }
});

// Update support ticket status
const updateTicketSchema = z.object({
  status: z.string(),
  assigned_to: z.number().optional(),
});

app.put('/api/support-tickets/:id', adminAuthMiddleware, zValidator('json', updateTicketSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { status, assigned_to } = c.req.valid('json');
    
    let query = 'UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [status];
    
    if (assigned_to) {
      query += ', assigned_to = ?';
      params.push(assigned_to);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await c.env.DB.prepare(query).bind(...params).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update support ticket' }, 500);
  }
});

// Add response to support ticket
const addResponseSchema = z.object({
  message: z.string(),
});

app.post('/api/support-tickets/:id/responses', adminAuthMiddleware, zValidator('json', addResponseSchema), async (c) => {
  try {
    const ticketId = parseInt(c.req.param('id'));
    const { message } = c.req.valid('json');
    const adminUser = c.get('adminUser');
    
    await c.env.DB.prepare(`
      INSERT INTO support_ticket_responses (ticket_id, responder_id, responder_type, message)
      VALUES (?, ?, 'staff', ?)
    `).bind(ticketId, adminUser.id, message).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to add response' }, 500);
  }
});

// Serve the React app for all non-API routes
app.get('*', async (c) => {
  // Skip API routes
  if (c.req.path.startsWith('/api/')) {
    return c.notFound();
  }
  
  // Serve the React app's index.html for all other routes
  // This allows React Router to handle client-side routing
  return c.html(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta property="og:title" content="Bago Admin" />
    <meta property="og:description" content="Modern admin dashboard for shipping and logistics management" />
    <meta
      property="og:image"
      content="https://mocha-cdn.com/og.png"
      type="image/png"
    />
    <meta
      property="og:url"
      content="https://getmocha.com"
    />
    <meta property="og:type" content="website" />
    <meta property="og:author" content="Bago" />
    <meta property="og:site_name" content="Bago Admin" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:site" content="@bago" />
    <meta property="twitter:title" content="Bago Admin" />
    <meta property="twitter:description" content="Modern admin dashboard for shipping and logistics management" />
    <meta
      property="twitter:image"
      content="https://mocha-cdn.com/og.png"
      type="image/png"
    />
    <link
      rel="shortcut icon"
      href="https://mocha-cdn.com/favicon.ico"
      type="image/x-icon"
    />
    <link
      rel="apple-touch-icon"
      sizes="180x180"
      href="https://mocha-cdn.com/apple-touch-icon.png"
      type="image/png"
    />
    <title>Bago Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/react-app/main.tsx"></script>
  </body>
</html>`);
});

export default app;
