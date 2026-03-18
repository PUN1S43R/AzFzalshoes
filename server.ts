import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import db, { initDb } from './db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB
initDb();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  // Serve static files from uploads directory
  app.use('/uploads', express.static(uploadsDir));

  // Multer configuration for image uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage: storage });

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(401);
      req.user = user;
      next();
    });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
      next();
    } else {
      res.status(403).json({ error: 'Admin access required' });
    }
  };

  const isSuperAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'superadmin') {
      next();
    } else {
      res.status(403).json({ error: 'Superadmin access required' });
    }
  };

  const getOptionalUser = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (!err) req.user = user;
        next();
      });
    } else {
      next();
    }
  };

  // --- Auth Routes ---

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Failsafe: Ensure specific emails are always superadmin
    const superAdmins = ['aquibbhombal708@gmail.com', 'moinneelam143@gmail.com'];
    let userRole = user.role;
    if (superAdmins.includes(user.email.toLowerCase().trim()) && user.role !== 'superadmin') {
      userRole = 'superadmin';
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run('superadmin', user.id);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: userRole }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, role: userRole } });
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
      const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hashedPassword);
      const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      
      // Failsafe: Ensure specific emails are always superadmin
      const superAdmins = ['aquibbhombal708@gmail.com', 'moinneelam143@gmail.com'];
      let userRole = user.role;
      if (superAdmins.includes(user.email.toLowerCase().trim()) && user.role !== 'superadmin') {
        userRole = 'superadmin';
        db.prepare('UPDATE users SET role = ? WHERE id = ?').run('superadmin', user.id);
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: userRole }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, role: userRole } });
    } catch (error: any) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const user = db.prepare('SELECT id, email, role, full_name, phone, address, state, pincode FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Failsafe: Ensure specific emails are always superadmin
    const superAdmins = ['aquibbhombal708@gmail.com', 'moinneelam143@gmail.com'];
    let userRole = user.role;
    if (superAdmins.includes(user.email.toLowerCase().trim()) && user.role !== 'superadmin') {
      userRole = 'superadmin';
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run('superadmin', user.id);
      user.role = 'superadmin';
    }

    res.json({ user });
  });

  app.put('/api/auth/profile', authenticateToken, (req: any, res) => {
    const { full_name, phone, address, state, pincode, password } = req.body;
    
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare(`
        UPDATE users SET full_name = ?, phone = ?, address = ?, state = ?, pincode = ?, password = ?
        WHERE id = ?
      `).run(full_name, phone, address, state, pincode, hashedPassword, req.user.id);
    } else {
      db.prepare(`
        UPDATE users SET full_name = ?, phone = ?, address = ?, state = ?, pincode = ?
        WHERE id = ?
      `).run(full_name, phone, address, state, pincode, req.user.id);
    }
    
    const user = db.prepare('SELECT id, email, role, full_name, phone, address, state, pincode FROM users WHERE id = ?').get(req.user.id);
    res.json({ user });
  });

  app.put('/api/auth/update-password', authenticateToken, (req: any, res) => {
    const { password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.user.id);
    res.json({ success: true });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  });

  // --- Image Upload Route ---

  app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  app.post('/api/upload-multiple', upload.array('images', 10), (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const urls = files.map(file => `/uploads/${file.filename}`);
    res.json({ urls });
  });

  // --- Categories Routes ---

  app.get('/api/categories', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories ORDER BY created_at DESC').all();
    res.json(categories);
  });

  app.post('/api/categories', authenticateToken, isAdmin, (req, res) => {
    const { name, image_url, description } = req.body;
    const result = db.prepare('INSERT INTO categories (name, image_url, description) VALUES (?, ?, ?)').run(name, image_url, description);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.json(category);
  });

  app.put('/api/categories/:id', authenticateToken, isAdmin, (req, res) => {
    const { name, image_url, description } = req.body;
    db.prepare('UPDATE categories SET name = ?, image_url = ?, description = ? WHERE id = ?').run(name, image_url, description, req.params.id);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json(category);
  });

  app.delete('/api/categories/:id', authenticateToken, isAdmin, (req, res) => {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Products Routes ---

  app.get('/api/products', getOptionalUser, (req: any, res) => {
    const { category, tag, q, limit, page, sort, is_new_arrival, is_under_599 } = req.query;
    const userId = req.user?.id || -1;

    let query = `
      SELECT p.*, c.name as category_name,
             (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count,
             (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
             EXISTS(SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = p.id) as is_wishlisted
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    const params: any[] = [userId];

    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }
    if (tag) {
      query += ' AND p.tag = ?';
      params.push(tag);
    }
    if (q) {
      query += ' AND p.name LIKE ?';
      params.push(`%${q}%`);
    }
    if (is_new_arrival === 'true') {
      query += " AND datetime(p.created_at, '+' || p.new_arrival_days || ' days') >= datetime('now')";
    }
    if (is_under_599 === 'true') {
      query += ' AND p.discount_price <= 599';
    }

    if (sort === 'price-low') {
      query += ' ORDER BY p.discount_price ASC';
    } else if (sort === 'price-high') {
      query += ' ORDER BY p.discount_price DESC';
    } else {
      query += ' ORDER BY p.created_at DESC';
    }

    if (limit) {
      const p = Number(page) || 1;
      const l = Number(limit);
      const offset = (p - 1) * l;
      query += ' LIMIT ? OFFSET ?';
      params.push(l, offset);
    }

    const products = db.prepare(query).all(...params);
    const formattedProducts = products.map((p: any) => ({
      ...p,
      additional_images: JSON.parse(p.additional_images || '[]'),
      sizes: JSON.parse(p.sizes || '[]'),
      colors: JSON.parse(p.colors || '[]'),
      is_cod_available: !!p.is_cod_available,
      is_wishlisted: !!p.is_wishlisted
    }));
    res.json(formattedProducts);
  });

  app.get('/api/products/:id', getOptionalUser, (req: any, res) => {
    const userId = req.user?.id || -1;
    const product = db.prepare(`
      SELECT p.*, 
             (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count,
             (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
             EXISTS(SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = p.id) as is_wishlisted
      FROM products p 
      WHERE p.id = ?
    `).get(userId, req.params.id);

    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const formattedProduct = {
      ...product,
      additional_images: JSON.parse(product.additional_images || '[]'),
      sizes: JSON.parse(product.sizes || '[]'),
      colors: JSON.parse(product.colors || '[]'),
      is_cod_available: !!product.is_cod_available,
      is_wishlisted: !!product.is_wishlisted
    };
    res.json(formattedProduct);
  });

  app.post('/api/products', authenticateToken, isAdmin, (req, res) => {
    const { name, category_id, main_image, additional_images, original_price, discount_price, stock_quantity, description, tag, is_cod_available, sizes, colors, new_arrival_days } = req.body;
    const result = db.prepare(`
      INSERT INTO products (name, category_id, main_image, additional_images, original_price, discount_price, stock_quantity, description, tag, is_cod_available, sizes, colors, new_arrival_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, category_id, main_image, JSON.stringify(additional_images || []), 
      original_price, discount_price, stock_quantity, description, tag, 
      is_cod_available ? 1 : 0, JSON.stringify(sizes || []), JSON.stringify(colors || []),
      new_arrival_days || 7
    );
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.json(product);
  });

  app.put('/api/products/:id', authenticateToken, isAdmin, (req, res) => {
    const { name, category_id, main_image, additional_images, original_price, discount_price, stock_quantity, description, tag, is_cod_available, sizes, colors, new_arrival_days } = req.body;
    db.prepare(`
      UPDATE products SET 
        name = ?, category_id = ?, main_image = ?, additional_images = ?, 
        original_price = ?, discount_price = ?, stock_quantity = ?, 
        description = ?, tag = ?, is_cod_available = ?, sizes = ?, colors = ?,
        new_arrival_days = ?
      WHERE id = ?
    `).run(
      name, category_id, main_image, JSON.stringify(additional_images || []), 
      original_price, discount_price, stock_quantity, description, tag, 
      is_cod_available ? 1 : 0, JSON.stringify(sizes || []), JSON.stringify(colors || []),
      new_arrival_days || 7,
      req.params.id
    );
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(product);
  });

  app.delete('/api/products/:id', authenticateToken, isAdmin, (req, res) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Sliders Routes ---

  app.get('/api/sliders', (req, res) => {
    const sliders = db.prepare('SELECT * FROM sliders ORDER BY created_at DESC').all();
    res.json(sliders);
  });

  app.post('/api/sliders', authenticateToken, isAdmin, (req, res) => {
    const { desktop_banner, mobile_banner, category_id } = req.body;
    const result = db.prepare('INSERT INTO sliders (desktop_banner, mobile_banner, category_id) VALUES (?, ?, ?)').run(desktop_banner, mobile_banner, category_id);
    const slider = db.prepare('SELECT * FROM sliders WHERE id = ?').get(result.lastInsertRowid);
    res.json(slider);
  });

  app.delete('/api/sliders/:id', authenticateToken, isAdmin, (req, res) => {
    db.prepare('DELETE FROM sliders WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Orders Routes ---
  app.post('/api/orders', authenticateToken, (req: any, res) => {
    const { total_amount, shipping_address, phone, payment_method, items, full_name, email } = req.body;
    const userId = req.user.id;

    const transaction = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (user_id, total_amount, shipping_address, phone, payment_method)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, total_amount, shipping_address, phone, payment_method);

      const orderId = orderResult.lastInsertRowid;

      for (const item of items) {
        db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, price, size, color)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(orderId, item.product_id, item.quantity, item.price, item.size, item.color);
      }

      return orderId;
    });

    try {
      const orderId = transaction();
      res.json({ success: true, orderId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Wishlist Routes ---
  app.get('/api/wishlist', authenticateToken, (req: any, res) => {
    const items = db.prepare(`
      SELECT p.*, 
             (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count,
             (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
             1 as is_wishlisted
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
    `).all(req.user.id);
    
    const formattedItems = items.map((p: any) => ({
      ...p,
      additional_images: JSON.parse(p.additional_images || '[]'),
      sizes: JSON.parse(p.sizes || '[]'),
      colors: JSON.parse(p.colors || '[]'),
      is_cod_available: !!p.is_cod_available,
      is_wishlisted: true
    }));
    res.json(formattedItems);
  });

  app.post('/api/wishlist', authenticateToken, (req: any, res) => {
    const { product_id } = req.body;
    try {
      db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.json({ success: true, message: 'Already in wishlist' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/wishlist/:productId', authenticateToken, (req: any, res) => {
    db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
    res.json({ success: true });
  });

  app.get('/api/orders/my', authenticateToken, (req: any, res) => {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(orders);
  });

  app.get('/api/orders', authenticateToken, isAdmin, (req, res) => {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    res.json(orders);
  });

  app.get('/api/orders/:id/items', authenticateToken, (req, res) => {
    const items = db.prepare(`
      SELECT oi.*, p.name as product_name, p.main_image 
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(req.params.id);
    res.json(items);
  });

  app.get('/api/admin/stats', authenticateToken, isAdmin, (req, res) => {
    try {
      const totalRevenue = db.prepare('SELECT SUM(total_amount) as total FROM orders').get() as any;
      const activeOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('Delivered', 'Cancelled')").get() as any;
      const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as any;
      const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as any;
      
      const recentOrders = db.prepare(`
        SELECT o.*, u.full_name as user_name 
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC 
        LIMIT 5
      `).all();

      // Last 7 days chart data
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const sales = db.prepare('SELECT SUM(total_amount) as total FROM orders WHERE DATE(created_at) = ?').get(dateStr) as any;
        return {
          name: days[d.getDay()],
          date: dateStr,
          sales: sales?.total || 0
        };
      }).reverse();

      res.json({
        stats: {
          revenue: totalRevenue?.total || 0,
          orders: activeOrders?.count || 0,
          customers: totalCustomers?.count || 0,
          products: totalProducts?.count || 0
        },
        recentActivity: recentOrders,
        chartData
      });
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // --- User Management Routes ---
  app.get('/api/users', authenticateToken, isAdmin, (req, res) => {
    const users = db.prepare('SELECT id, email, role, full_name, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  });

  app.put('/api/users/:id/role', authenticateToken, isAdmin, (req: any, res) => {
    const { role: newRole } = req.body;
    const targetUserId = req.params.id;
    const requesterRole = req.user.role;

    // Get target user's current role
    const targetUser = db.prepare('SELECT role FROM users WHERE id = ?').get(targetUserId) as any;
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Logic:
    // 1. Only superadmin can promote to superadmin
    // 2. Only superadmin can demote a superadmin
    // 3. Admin can only promote/demote between 'user' and 'admin'

    if (newRole === 'superadmin' && requesterRole !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can promote to superadmin' });
    }

    if (targetUser.role === 'superadmin' && requesterRole !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can demote a superadmin' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, targetUserId);
    res.json({ success: true });
  });

  // --- Settings Routes ---
  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    res.json(settings);
  });

  app.post('/api/settings', authenticateToken, isAdmin, (req, res) => {
    const { key, value } = req.body;
    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(key, value);
    res.json({ success: true });
  });

  // --- Order Status Route ---
  app.put('/api/orders/:id/status', authenticateToken, isAdmin, (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  });

  // --- Reviews Routes ---
  app.get('/api/products/:id/reviews', (req, res) => {
    const reviews = db.prepare(`
      SELECT r.*, u.full_name as user_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);
    res.json(reviews);
  });

  app.post('/api/products/:id/reviews', authenticateToken, (req: any, res) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user.id;

    // Check if user is admin/superadmin
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    const isAdminUser = user.role === 'admin' || user.role === 'superadmin';

    if (!isAdminUser) {
      // Check if user has purchased the product
      const purchase = db.prepare(`
        SELECT o.id FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
      `).get(userId, productId);

      if (!purchase) {
        return res.status(403).json({ error: 'You must purchase and receive the product to leave a review.' });
      }
    }

    db.prepare('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)').run(productId, userId, rating, comment);
    res.json({ success: true });
  });

  // SMTP Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  app.post('/api/auth/send-otp', async (req, res) => {
    const { email, otp } = req.body;
    const mailOptions = {
      from: `"Afzal Shoes" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Verification Code - Afzal Shoes',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
          <h2 style="text-transform: uppercase; letter-spacing: 2px; text-align: center;">Afzal Shoes</h2>
          <p style="color: #666; text-align: center;">Use the code below to verify your account:</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 15px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 10px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #999; text-align: center;">This code will expire in 10 minutes.</p>
        </div>
      `
    };
    try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  // --- Settings Routes ---
  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsMap = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });

  app.post('/api/settings', authenticateToken, isAdmin, (req, res) => {
    const { key, value } = req.body;
    db.prepare(`
      INSERT INTO settings (key, value) 
      VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
    res.json({ success: true });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
