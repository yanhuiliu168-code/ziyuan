const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { initDB, query, run, queryOne, saveDB, md5 } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'resource-depot-secret-key-2026';

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/admin')) return next();
  if (req.path === '/favicon.ico') return next();
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.headers['x-real-ip']
    || req.ip
    || req.connection?.remoteAddress
    || '';
  const ua = (req.headers['user-agent'] || '').slice(0, 500);
  run('INSERT INTO visit_log (ip, path, user_agent) VALUES (?, ?, ?)',
    [ip, req.path + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''), ua]);
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: '登录已过期' });
  }
}

async function start() {
  await initDB();
  console.log('数据库初始化完成');

  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: '请填写完整' });
    const user = queryOne('SELECT * FROM admin_user WHERE username = ? AND status = 1', [username]);
    if (!user || user.password !== md5(password)) return res.status(401).json({ error: '账号或密码错误' });
    run('UPDATE admin_user SET last_login = datetime("now","localtime") WHERE id = ?', [user.id]);
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, email: user.email } });
  });

  app.get('/api/admin/me', auth, (req, res) => {
    const user = queryOne('SELECT id, username, email, role, last_login FROM admin_user WHERE id = ?', [req.admin.id]);
    res.json(user);
  });

  app.get('/api/settings/public', (req, res) => {
    const rows = query('SELECT key, value FROM site_setting');
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    const navs = query('SELECT * FROM nav_menu WHERE status = 1 ORDER BY sort ASC');
    const announcements = settings.announcement_status === '1' ? settings.announcement : '';
    res.json({ settings, navs, announcement: announcements, announcement_color: settings.announcement_color || '#6c5ce7' });
  });

  app.get('/api/settings', auth, (req, res) => {
    const rows = query('SELECT key, value FROM site_setting');
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  });

  app.post('/api/settings', auth, (req, res) => {
    const entries = Object.entries(req.body);
    entries.forEach(([key, value]) => {
      run('INSERT INTO site_setting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, String(value)]);
    });
    res.json({ success: true });
  });

  app.put('/api/admin/settings', auth, (req, res) => {
    const entries = Object.entries(req.body);
    entries.forEach(([key, value]) => {
      run('INSERT INTO site_setting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, String(value)]);
    });
    res.json({ success: true });
  });

  app.get('/api/categories', (req, res) => {
    const categories = query('SELECT * FROM category WHERE status = 1 ORDER BY sort ASC');
    res.json(categories);
  });

  app.get('/api/admin/categories', auth, (req, res) => {
    const categories = query('SELECT * FROM category ORDER BY sort ASC, id DESC');
    res.json(categories);
  });

  app.post('/api/admin/categories', auth, (req, res) => {
    const { name, alias, icon, sort, status } = req.body;
    if (!name) return res.status(400).json({ error: '名称必填' });
    run('INSERT INTO category (name, alias, icon, sort, status) VALUES (?, ?, ?, ?, ?)', [name, alias || '', icon || '', sort || 0, status !== undefined ? status : 1]);
    res.json({ success: true, id: queryOne('SELECT last_insert_rowid() as id').id });
  });

  app.put('/api/admin/categories/:id', auth, (req, res) => {
    const { name, alias, icon, sort, status } = req.body;
    run('UPDATE category SET name=?, alias=?, icon=?, sort=?, status=? WHERE id=?', [name, alias || '', icon || '', sort || 0, status !== undefined ? status : 1, req.params.id]);
    res.json({ success: true });
  });

  app.delete('/api/admin/categories/:id', auth, (req, res) => {
    const count = queryOne('SELECT COUNT(*) as cnt FROM resource WHERE category_id = ?', [req.params.id]).cnt;
    if (count > 0) return res.status(400).json({ error: `该分类下还有 ${count} 条资源，请先迁移` });
    run('DELETE FROM category WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/tags', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const tags = query('SELECT * FROM tag WHERE status = 1 ORDER BY resource_count DESC LIMIT ?', [limit]);
    res.json(tags);
  });

  app.get('/api/admin/tags', auth, (req, res) => {
    const tags = query('SELECT * FROM tag ORDER BY resource_count DESC');
    res.json(tags);
  });

  app.post('/api/admin/tags', auth, (req, res) => {
    const { name, sort, status } = req.body;
    if (!name) return res.status(400).json({ error: '标签名必填' });
    run('INSERT INTO tag (name, sort, status) VALUES (?, ?, ?)', [name, sort || 0, status !== undefined ? status : 1]);
    res.json({ success: true });
  });

  app.put('/api/admin/tags/:id', auth, (req, res) => {
    const { name, sort, status } = req.body;
    run('UPDATE tag SET name=?, sort=?, status=? WHERE id=?', [name, sort || 0, status !== undefined ? status : 1, req.params.id]);
    res.json({ success: true });
  });

  app.delete('/api/admin/tags/:id', auth, (req, res) => {
    run('DELETE FROM resource_tag WHERE tag_id = ?', [req.params.id]);
    run('DELETE FROM tag WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  function buildResourceQuery(params = {}) {
    const { category_id, tag_id, keyword, sort = 'latest', page = 1, page_size = 12, status = 1 } = params;
    let sql = 'SELECT DISTINCT r.*, c.name as category_name FROM resource r LEFT JOIN category c ON r.category_id = c.id';
    const where = [];
    const args = [];
    
    if (tag_id) {
      sql += ' LEFT JOIN resource_tag rt ON r.id = rt.resource_id';
      where.push('rt.tag_id = ?');
      args.push(tag_id);
    }
    where.push('r.status = ?');
    args.push(status);
    if (category_id) { where.push('r.category_id = ?'); args.push(category_id); }
    if (keyword) { where.push('(r.title LIKE ? OR r.summary LIKE ?)'); args.push(`%${keyword}%`, `%${keyword}%`); }

    sql += ' WHERE ' + where.join(' AND ');
    const countSql = sql.replace('SELECT DISTINCT r.*, c.name as category_name', 'SELECT COUNT(DISTINCT r.id) as total');
    
    let orderSql;
    if (sort === 'hot') orderSql = ' ORDER BY r.views DESC';
    else if (sort === 'recommend') orderSql = ' AND r.is_recommend = 1 ORDER BY r.sort ASC, r.publish_time DESC';
    else orderSql = ' ORDER BY r.is_top DESC, r.sort ASC, r.publish_time DESC';

    const totalRow = queryOne(countSql + (sort === 'recommend' ? ' AND r.is_recommend = 1' : ''), args);
    const total = totalRow.total;
    
    sql += orderSql;
    sql += ' LIMIT ? OFFSET ?';
    args.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

    let list = query(sql, args);
    
    list = list.map(r => {
      const tags = query('SELECT t.* FROM tag t JOIN resource_tag rt ON t.id = rt.tag_id WHERE rt.resource_id = ?', [r.id]);
      const pans = query('SELECT * FROM resource_pan WHERE resource_id = ? AND status = 1 ORDER BY sort ASC', [r.id]);
      return { ...r, tags, pans };
    });

    return { list, total, page: parseInt(page), page_size: parseInt(page_size) };
  }

  app.get('/api/resources', (req, res) => {
    const result = buildResourceQuery(req.query);
    res.json(result);
  });

  app.get('/api/admin/resources', auth, (req, res) => {
    const { keyword, category_id, status, is_top, page = 1, page_size = 20 } = req.query;
    let sql = 'SELECT r.*, c.name as category_name FROM resource r LEFT JOIN category c ON r.category_id = c.id WHERE 1=1';
    const args = [];
    if (keyword) { sql += ' AND r.title LIKE ?'; args.push(`%${keyword}%`); }
    if (category_id) { sql += ' AND r.category_id = ?'; args.push(category_id); }
    if (status !== undefined) { sql += ' AND r.status = ?'; args.push(status); }
    if (is_top) { sql += ' AND r.is_top = 1'; }
    sql += ' ORDER BY r.is_top DESC, r.sort ASC, r.publish_time DESC, r.id DESC';
    const all = query(sql, args);
    const total = all.length;
    const start = (parseInt(page) - 1) * parseInt(page_size);
    let list = all.slice(start, start + parseInt(page_size));
    list = list.map(r => {
      const tags = query('SELECT t.* FROM tag t JOIN resource_tag rt ON t.id = rt.tag_id WHERE rt.resource_id = ?', [r.id]);
      return { ...r, tags };
    });
    res.json({ list, total, page: parseInt(page), page_size: parseInt(page_size) });
  });

  app.get('/api/resources/hot', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const list = query('SELECT * FROM resource WHERE status = 1 ORDER BY views DESC LIMIT ?', [limit]);
    res.json(list);
  });

  app.get('/api/resources/recommended', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const list = query('SELECT * FROM resource WHERE status = 1 AND is_recommend = 1 ORDER BY sort ASC, publish_time DESC LIMIT ?', [limit]);
    res.json(list);
  });

  app.get('/api/resources/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ list: [], total: 0 });
    const result = buildResourceQuery({ keyword: q, page: req.query.page, page_size: req.query.page_size });
    res.json(result);
  });

  app.get('/api/resources/:id', (req, res) => {
    const r = queryOne('SELECT r.*, c.name as category_name FROM resource r LEFT JOIN category c ON r.category_id = c.id WHERE r.id = ? AND r.status = 1', [req.params.id]);
    if (!r) return res.status(404).json({ error: '资源不存在' });
    run('UPDATE resource SET views = views + 1 WHERE id = ?', [req.params.id]);
    const tags = query('SELECT t.* FROM tag t JOIN resource_tag rt ON t.id = rt.tag_id WHERE rt.resource_id = ?', [r.id]);
    const pans = query('SELECT * FROM resource_pan WHERE resource_id = ? AND status = 1 ORDER BY sort ASC', [r.id]);
    const comments = query('SELECT * FROM comment WHERE resource_id = ? AND status = 1 ORDER BY created_at DESC', [r.id]);
    const prev = queryOne('SELECT id, title FROM resource WHERE status = 1 AND publish_time < (SELECT publish_time FROM resource WHERE id = ?) ORDER BY publish_time DESC LIMIT 1', [r.id]);
    const next = queryOne('SELECT id, title FROM resource WHERE status = 1 AND publish_time > (SELECT publish_time FROM resource WHERE id = ?) ORDER BY publish_time ASC LIMIT 1', [r.id]);
    let images = [];
    if (r.images) {
      try { images = JSON.parse(r.images); if (!Array.isArray(images)) images = []; } catch (e) { images = []; }
    }
    res.json({ ...r, images, tags, pans, comments, prev, next });
  });

  app.get('/api/stats', (req, res) => {
    const resources = queryOne('SELECT COUNT(*) as cnt FROM resource WHERE status = 1').cnt;
    const views = queryOne('SELECT COALESCE(SUM(views),0) as total FROM resource').total;
    const comments = queryOne('SELECT COUNT(*) as cnt FROM comment WHERE status = 1').cnt;
    const categories = queryOne('SELECT COUNT(*) as cnt FROM category WHERE status = 1').cnt;
    const recent = query('SELECT r.id, r.title, r.views, r.publish_time, c.name as category_name FROM resource r LEFT JOIN category c ON r.category_id = c.id WHERE r.status = 1 ORDER BY r.id DESC LIMIT 8');
    res.json({ resources, views, comments, categories, recent });
  });

  app.post('/api/admin/pages', auth, (req, res) => {
    const { title, slug, content, seo_title, seo_desc, sort, status } = req.body;
    if (!title || !slug) return res.status(400).json({ error: '标题和别名必填' });
    run('INSERT INTO page (title, slug, content, seo_title, seo_desc, sort, status) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [title, slug, content || '', seo_title || '', seo_desc || '', sort || 0, status !== undefined ? status : 1]);
    res.json({ success: true });
  });

  app.delete('/api/admin/pages/:id', auth, (req, res) => {
    run('DELETE FROM page WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.post('/api/admin/resources', auth, (req, res) => {
    const { title, category_id, author, cover, summary, content, pans, tag_ids, publish_time, is_top, is_recommend, sort, status, seo_title, seo_keywords, seo_desc, views, images } = req.body;
    if (!title || !category_id) return res.status(400).json({ error: '标题和分类必填' });
    const imagesStr = Array.isArray(images) && images.length ? JSON.stringify(images) : '';
    const finalPublishTime = publish_time || new Date().toISOString().replace('T', ' ').slice(0, 19);
    const finalViews = (views === undefined || views === null || views === '')
      ? Math.floor(Math.random() * 9001) + 1000
      : views;
    run(`INSERT INTO resource (title, category_id, author, cover, summary, content, publish_time, is_top, is_recommend, sort, status, seo_title, seo_keywords, seo_desc, views, images)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [title, category_id, author || '站长整理', cover || '', summary || '', content || '', finalPublishTime, is_top ? 1 : 0, is_recommend ? 1 : 0, sort || 0, status !== undefined ? status : 1, seo_title || '', seo_keywords || '', seo_desc || '', finalViews, imagesStr]);
    const id = queryOne('SELECT last_insert_rowid() as id').id;
    
    (pans || []).forEach((p, i) => {
      run('INSERT INTO resource_pan (resource_id, pan_type, url, code, note, sort) VALUES (?, ?, ?, ?, ?, ?)', [id, p.pan_name || p.pan_type || '', p.url || '', p.code || '', p.note || '', i]);
    });
    
    (tag_ids || req.body.tags || []).forEach(tagId => {
      run('INSERT OR IGNORE INTO resource_tag (resource_id, tag_id) VALUES (?, ?)', [id, tagId]);
    });
    
    res.json({ success: true, id });
  });

  app.put('/api/admin/resources/:id', auth, (req, res) => {
    const existing = queryOne('SELECT * FROM resource WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: '资源不存在' });

    const fields = ['title', 'category_id', 'author', 'cover', 'summary', 'content', 'publish_time', 'is_top', 'is_recommend', 'sort', 'status', 'seo_title', 'seo_keywords', 'seo_desc', 'views', 'images'];
    const setClauses = [];
    const values = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        let val = req.body[f];
        if (f === 'is_top' || f === 'is_recommend') val = val ? 1 : 0;
        if (f === 'publish_time') val = val || null;
        if (f === 'images') val = Array.isArray(val) && val.length ? JSON.stringify(val) : '';
        setClauses.push(`${f}=?`);
        values.push(val);
      }
    }
    setClauses.push("updated_at=datetime('now','localtime')");
    values.push(req.params.id);
    run(`UPDATE resource SET ${setClauses.join(', ')} WHERE id=?`, values);

    if (req.body.pans !== undefined) {
      run('DELETE FROM resource_pan WHERE resource_id = ?', [req.params.id]);
      (req.body.pans || []).forEach((p, i) => {
        run('INSERT INTO resource_pan (resource_id, pan_type, url, code, note, sort) VALUES (?, ?, ?, ?, ?, ?)', [req.params.id, p.pan_name || p.pan_type || '', p.url || '', p.code || '', p.note || '', i]);
      });
    }

    if (req.body.tag_ids !== undefined || req.body.tags !== undefined) {
      run('DELETE FROM resource_tag WHERE resource_id = ?', [req.params.id]);
      (req.body.tag_ids || req.body.tags || []).forEach(tagId => {
        run('INSERT OR IGNORE INTO resource_tag (resource_id, tag_id) VALUES (?, ?)', [req.params.id, tagId]);
      });
    }

    res.json({ success: true });
  });

  app.put('/api/admin/admins/:id', auth, (req, res) => {
    const { username, password, email, role, status } = req.body;
    if (password) {
      run('UPDATE admin_user SET password = ? WHERE id = ?', [md5(password), req.params.id]);
    }
    if (username) run('UPDATE admin_user SET username = ? WHERE id = ?', [username, req.params.id]);
    if (email !== undefined) run('UPDATE admin_user SET email = ? WHERE id = ?', [email, req.params.id]);
    if (role) run('UPDATE admin_user SET role = ? WHERE id = ?', [role, req.params.id]);
    if (status !== undefined) run('UPDATE admin_user SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/admin/me', auth, (req, res) => {
    const user = queryOne('SELECT id, username, email, role, last_login FROM admin_user WHERE id = ?', [req.admin.id]);
    res.json(user);
  });

  app.delete('/api/admin/resources/:id', auth, (req, res) => {
    run('DELETE FROM resource_pan WHERE resource_id = ?', [req.params.id]);
    run('DELETE FROM resource_tag WHERE resource_id = ?', [req.params.id]);
    run('DELETE FROM comment WHERE resource_id = ?', [req.params.id]);
    run('DELETE FROM resource WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.post('/api/resources/:id/view', (req, res) => {
    run('UPDATE resource SET views = views + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.put('/api/admin/resources/:id/toggle-top', auth, (req, res) => {
    const r = queryOne('SELECT is_top FROM resource WHERE id = ?', [req.params.id]);
    run('UPDATE resource SET is_top = ? WHERE id = ?', [r.is_top ? 0 : 1, req.params.id]);
    res.json({ success: true });
  });

  app.put('/api/admin/resources/:id/toggle-recommend', auth, (req, res) => {
    const r = queryOne('SELECT is_recommend FROM resource WHERE id = ?', [req.params.id]);
    run('UPDATE resource SET is_recommend = ? WHERE id = ?', [r.is_recommend ? 0 : 1, req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/comments', (req, res) => {
    const resource_id = req.query.resource_id;
    if (resource_id) {
      const comments = query('SELECT * FROM comment WHERE resource_id = ? AND status = 1 ORDER BY created_at DESC', [resource_id]);
      return res.json(comments);
    }
    const list = query('SELECT c.*, r.title as resource_title FROM comment c LEFT JOIN resource r ON c.resource_id = r.id ORDER BY c.created_at DESC LIMIT 50');
    res.json(list);
  });

  app.post('/api/comments', (req, res) => {
    const { resource_id, nickname, email, content } = req.body;
    if (!resource_id || !nickname || !content) return res.status(400).json({ error: '请填写完整信息' });
    const settings = {};
    query('SELECT key, value FROM site_setting').forEach(r => settings[r.key] = r.value);
    const needReview = settings.comment_review === '1';
    const ip = req.ip || req.connection.remoteAddress;
    run('INSERT INTO comment (resource_id, nickname, email, content, ip, status) VALUES (?, ?, ?, ?, ?, ?)', 
      [resource_id, nickname, email || '', content, ip, needReview ? 0 : 1]);
    res.json({ success: true, needReview });
  });

  app.get('/api/admin/comments', auth, (req, res) => {
    const { status, page = 1, page_size = 20 } = req.query;
    let sql = 'SELECT c.*, r.title as resource_title FROM comment c LEFT JOIN resource r ON c.resource_id = r.id WHERE 1=1';
    const args = [];
    if (status !== undefined) { sql += ' AND c.status = ?'; args.push(status); }
    sql += ' ORDER BY c.created_at DESC';
    const all = query(sql, args);
    const total = all.length;
    const start = (parseInt(page) - 1) * parseInt(page_size);
    const list = all.slice(start, start + parseInt(page_size));
    res.json({ list, total });
  });

  app.put('/api/admin/comments/:id', auth, (req, res) => {
    const { status } = req.body;
    run('UPDATE comment SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  });

  app.delete('/api/admin/comments/:id', auth, (req, res) => {
    run('DELETE FROM comment WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/pages/:slug', (req, res) => {
    const page = queryOne('SELECT * FROM page WHERE slug = ? AND status = 1', [req.params.slug]);
    res.json(page);
  });

  app.get('/api/admin/pages', auth, (req, res) => {
    const pages = query('SELECT * FROM page ORDER BY id ASC');
    res.json(pages);
  });

  app.put('/api/admin/pages/:id', auth, (req, res) => {
    const { title, content, seo_title, seo_desc, status } = req.body;
    run('UPDATE page SET title=?, content=?, seo_title=?, seo_desc=?, status=? WHERE id=?', 
      [title || '', content || '', seo_title || '', seo_desc || '', status !== undefined ? status : 1, req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/nav', (req, res) => {
    const navs = query('SELECT * FROM nav_menu WHERE status = 1 ORDER BY sort ASC');
    res.json(navs);
  });

  app.get('/api/admin/nav', auth, (req, res) => {
    const navs = query('SELECT * FROM nav_menu ORDER BY sort ASC');
    res.json(navs);
  });

  app.post('/api/admin/nav', auth, (req, res) => {
    const { name, link, sort, status, target } = req.body;
    run('INSERT INTO nav_menu (name, link, sort, status, target) VALUES (?, ?, ?, ?, ?)', [name, link, sort || 0, status !== undefined ? status : 1, target || 0]);
    res.json({ success: true });
  });

  app.put('/api/admin/nav/:id', auth, (req, res) => {
    const existing = queryOne('SELECT * FROM nav_menu WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: '不存在' });
    const fields = ['name', 'link', 'sort', 'status', 'target'];
    const setClauses = [];
    const values = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (f === 'sort') values.push(req.body[f] || 0);
        else if (f === 'status' || f === 'target') values.push(req.body[f] ? 1 : 0);
        else values.push(req.body[f]);
        setClauses.push(`${f}=?`);
      }
    }
    if (!setClauses.length) return res.json({ success: true });
    values.push(req.params.id);
    run(`UPDATE nav_menu SET ${setClauses.join(', ')} WHERE id=?`, values);
    res.json({ success: true });
  });

  app.delete('/api/admin/nav/:id', auth, (req, res) => {
    run('DELETE FROM nav_menu WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/ad-cards', (req, res) => {
    const cards = query('SELECT * FROM ad_card WHERE status = 1 ORDER BY sort ASC');
    res.json(cards);
  });

  app.get('/api/admin/ad-cards', auth, (req, res) => {
    const cards = query('SELECT * FROM ad_card ORDER BY sort ASC');
    res.json(cards);
  });

  app.post('/api/admin/ad-cards', auth, (req, res) => {
    const { title, description, btn_text, link, bg_color, text_color, sort, status } = req.body;
    run('INSERT INTO ad_card (title, description, btn_text, link, bg_color, text_color, sort, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title || '', description || '', btn_text || '立即查看', link || '', bg_color || '#6c5ce7', text_color || '#ffffff', sort || 0, status !== undefined ? status : 1]);
    res.json({ success: true });
  });

  app.put('/api/admin/ad-cards/:id', auth, (req, res) => {
    const { title, description, btn_text, link, bg_color, text_color, sort, status } = req.body;
    run('UPDATE ad_card SET title=?, description=?, btn_text=?, link=?, bg_color=?, text_color=?, sort=?, status=? WHERE id=?',
      [title || '', description || '', btn_text || '立即查看', link || '', bg_color || '#6c5ce7', text_color || '#ffffff', sort || 0, status !== undefined ? status : 1, req.params.id]);
    res.json({ success: true });
  });

  app.delete('/api/admin/ad-cards/:id', auth, (req, res) => {
    run('DELETE FROM ad_card WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/friend-links', (req, res) => {
    const links = query('SELECT * FROM friend_link WHERE status = 1 ORDER BY sort ASC');
    res.json(links);
  });

  app.get('/api/admin/friend-links', auth, (req, res) => {
    const links = query('SELECT * FROM friend_link ORDER BY sort ASC');
    res.json(links);
  });

  app.post('/api/admin/friend-links', auth, (req, res) => {
    const { name, url, sort, status } = req.body;
    run('INSERT INTO friend_link (name, url, sort, status) VALUES (?, ?, ?, ?)', [name, url, sort || 0, status !== undefined ? status : 1]);
    res.json({ success: true });
  });

  app.put('/api/admin/friend-links/:id', auth, (req, res) => {
    const { name, url, sort, status } = req.body;
    run('UPDATE friend_link SET name=?, url=?, sort=?, status=? WHERE id=?', [name, url, sort || 0, status !== undefined ? status : 1, req.params.id]);
    res.json({ success: true });
  });

  app.delete('/api/admin/friend-links/:id', auth, (req, res) => {
    run('DELETE FROM friend_link WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/admin/hot-articles', auth, (req, res) => {
    const items = query(`SELECT ha.*, r.title, r.cover, r.views FROM hot_article ha JOIN resource r ON ha.resource_id = r.id ORDER BY ha.sort ASC`);
    res.json(items);
  });

  app.post('/api/admin/hot-articles', auth, (req, res) => {
    const { resource_ids } = req.body;
    run('DELETE FROM hot_article');
    (resource_ids || []).forEach((id, i) => {
      run('INSERT OR IGNORE INTO hot_article (resource_id, sort) VALUES (?, ?)', [id, i]);
    });
    res.json({ success: true });
  });

  app.get('/api/admin/stats', auth, (req, res) => {
    const resource_total = queryOne('SELECT COUNT(*) as cnt FROM resource WHERE status = 1').cnt;
    const today_new = queryOne("SELECT COUNT(*) as cnt FROM resource WHERE date(publish_time) = date('now','localtime')").cnt;
    const comment_pending = queryOne('SELECT COUNT(*) as cnt FROM comment WHERE status = 0').cnt;
    const views_total = queryOne('SELECT COALESCE(SUM(views),0) as total FROM resource').total;
    const hot_resources = query('SELECT id, title, views FROM resource WHERE status = 1 ORDER BY views DESC LIMIT 10');
    const recent_comments = query('SELECT c.*, r.title as resource_title FROM comment c LEFT JOIN resource r ON c.resource_id = r.id ORDER BY c.created_at DESC LIMIT 10');

    const visit_today = queryOne("SELECT COUNT(*) as cnt FROM visit_log WHERE date(created_at) = date('now','localtime')").cnt;
    const visit_yesterday = queryOne("SELECT COUNT(*) as cnt FROM visit_log WHERE date(created_at) = date('now','localtime','-1 day')").cnt;
    const visit_total = queryOne('SELECT COUNT(*) as cnt FROM visit_log').cnt;
    const ip_today = queryOne("SELECT COUNT(DISTINCT ip) as cnt FROM visit_log WHERE date(created_at) = date('now','localtime')").cnt;
    const ip_yesterday = queryOne("SELECT COUNT(DISTINCT ip) as cnt FROM visit_log WHERE date(created_at) = date('now','localtime','-1 day')").cnt;

    const visit_chart = [];
    for (let i = 6; i >= 0; i--) {
      const row = queryOne(`SELECT COUNT(*) as cnt, COUNT(DISTINCT ip) as ips FROM visit_log WHERE date(created_at) = date('now','localtime','-${i} day')`);
      const d = new Date();
      d.setDate(d.getDate() - i);
      visit_chart.push({
        date: `${d.getMonth()+1}/${d.getDate()}`,
        visits: row.cnt,
        ips: row.ips
      });
    }

    const recent_visits = query(`SELECT ip, path, created_at FROM visit_log ORDER BY id DESC LIMIT 20`);

    const category_stats = query(`
      SELECT c.id, c.name, c.icon, c.alias, c.sort,
        COUNT(r.id) as total,
        SUM(CASE WHEN r.status = 1 THEN 1 ELSE 0 END) as shown
      FROM category c
      LEFT JOIN resource r ON r.category_id = c.id
      GROUP BY c.id
      ORDER BY c.sort ASC, c.id DESC
    `);

    res.json({
      resource_total, today_new, comment_pending, views_total, hot_resources, recent_comments,
      visit_today, visit_yesterday, visit_total, ip_today, ip_yesterday,
      visit_chart, recent_visits, category_stats
    });
  });

  app.post('/api/upload', auth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '没有文件' });
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename, size: req.file.size });
  });

  app.post('/api/admin/resources/batch', auth, (req, res) => {
    const { ids, action, value } = req.body;
    if (!ids || !ids.length || !action) return res.status(400).json({ error: '参数错误' });
    ids.forEach(id => {
      if (action === 'top') run('UPDATE resource SET is_top = 1 WHERE id = ?', [id]);
      else if (action === 'untop') run('UPDATE resource SET is_top = 0 WHERE id = ?', [id]);
      else if (action === 'recommend') run('UPDATE resource SET is_recommend = 1 WHERE id = ?', [id]);
      else if (action === 'unrecommend') run('UPDATE resource SET is_recommend = 0 WHERE id = ?', [id]);
      else if (action === 'hide') run('UPDATE resource SET status = 0 WHERE id = ?', [id]);
      else if (action === 'show') run('UPDATE resource SET status = 1 WHERE id = ?', [id]);
      else if (action === 'delete') {
        run('DELETE FROM resource_pan WHERE resource_id = ?', [id]);
        run('DELETE FROM resource_tag WHERE resource_id = ?', [id]);
        run('DELETE FROM resource WHERE id = ?', [id]);
      }
    });
    res.json({ success: true });
  });

  app.get('/api/admin/admins', auth, (req, res) => {
    const users = query('SELECT id, username, email, role, status, last_login, created_at FROM admin_user ORDER BY id ASC');
    res.json(users);
  });

  app.post('/api/admin/admins', auth, (req, res) => {
    const { username, password, email, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: '账号密码必填' });
    run('INSERT INTO admin_user (username, password, email, role) VALUES (?, ?, ?, ?)', [username, md5(password), email || '', role || 'editor']);
    res.json({ success: true });
  });

  app.delete('/api/admin/admins/:id', auth, (req, res) => {
    if (parseInt(req.params.id) === req.admin.id) return res.status(400).json({ error: '不能删除自己' });
    run('DELETE FROM admin_user WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.post('/api/admin/change-password', auth, (req, res) => {
    const { old_password, new_password } = req.body;
    const user = queryOne('SELECT * FROM admin_user WHERE id = ?', [req.admin.id]);
    if (user.password !== md5(old_password)) return res.status(400).json({ error: '原密码错误' });
    run('UPDATE admin_user SET password = ? WHERE id = ?', [md5(new_password), req.admin.id]);
    res.json({ success: true });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  });

  app.listen(PORT, () => {
    console.log(`资源仓库后端 API 已启动: http://localhost:${PORT}`);
  });
}

start().catch(console.error);
