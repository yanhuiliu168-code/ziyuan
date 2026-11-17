const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'resource-depot.db');

let db = null;

async function initDB() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH);
    db = new SQL.Database(data);
    ensureSettings();
    saveDB();
  } else {
    db = new SQL.Database();
    createTables();
    seedData();
    saveDB();
  }
  
  return db;
}

function ensureSettings() {
  const required = [
    ['friend_links_status', '1']
  ];
  required.forEach(([key, val]) => {
    const exists = queryOne('SELECT key FROM site_setting WHERE key = ?', [key]);
    if (!exists) {
      run('INSERT INTO site_setting (key, value) VALUES (?, ?)', [key, val]);
    }
  });

  try {
    run("UPDATE site_setting SET value = '0' WHERE key = 'comment_review' AND value = '1'");
  } catch (e) {}

  try {
    const idxCount = query("SELECT count(*) as cnt FROM sqlite_master WHERE type='index' AND tbl_name='category' AND name LIKE 'sqlite_autoindex%'")[0].cnt;
    if (idxCount > 0) {
      const rows = query('SELECT * FROM category');
      db.exec('DROP TABLE category');
      db.exec(`CREATE TABLE category (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        alias TEXT DEFAULT '',
        icon TEXT DEFAULT '',
        sort INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        resource_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now','localtime'))
      )`);
      rows.forEach(r => {
        db.run(`INSERT INTO category (id, name, alias, icon, sort, status, resource_count, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.name, r.alias || '', r.icon || '', r.sort || 0, r.status !== undefined ? r.status : 1, r.resource_count || 0, r.created_at]);
      });
      saveDB();
      console.log('Category table migrated: removed UNIQUE constraints');
    }
  } catch (e) {
    console.error('Category migration error:', e.message);
  }

  try {
    const cols = query("PRAGMA table_info(resource)");
    const hasSort = cols.some(c => c.name === 'sort');
    if (!hasSort) {
      db.exec('ALTER TABLE resource ADD COLUMN sort INTEGER DEFAULT 0');
      saveDB();
      console.log('Resource table migrated: added sort column');
    }
    const hasImages = cols.some(c => c.name === 'images');
    if (!hasImages) {
      db.exec('ALTER TABLE resource ADD COLUMN images TEXT DEFAULT ""');
      saveDB();
      console.log('Resource table migrated: added images column');
    }
  } catch (e) {
    console.error('Resource migration error:', e.message);
  }

  try {
    const tables = query("SELECT name FROM sqlite_master WHERE type='table' AND name='visit_log'");
    if (!tables.length) {
      db.exec(`CREATE TABLE visit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT DEFAULT '',
        path TEXT DEFAULT '',
        user_agent TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
      )`);
      saveDB();
      console.log('Visit_log table created');
    }
  } catch (e) {
    console.error('Visit_log migration error:', e.message);
  }
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      alias TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      resource_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS tag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      resource_count INTEGER DEFAULT 0,
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS resource (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category_id INTEGER,
      author TEXT DEFAULT '站长整理',
      cover TEXT DEFAULT '',
      summary TEXT DEFAULT '',
      content TEXT DEFAULT '',
      views INTEGER DEFAULT 0,
      favorites INTEGER DEFAULT 0,
      is_top INTEGER DEFAULT 0,
      is_recommend INTEGER DEFAULT 0,
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      publish_time TEXT DEFAULT (datetime('now','localtime')),
      seo_title TEXT DEFAULT '',
      seo_keywords TEXT DEFAULT '',
      seo_desc TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS resource_pan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id INTEGER,
      pan_type TEXT DEFAULT '',
      url TEXT DEFAULT '',
      code TEXT DEFAULT '',
      note TEXT DEFAULT '',
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS resource_tag (
      resource_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (resource_id, tag_id)
    );
    CREATE TABLE IF NOT EXISTS comment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id INTEGER,
      nickname TEXT NOT NULL,
      email TEXT DEFAULT '',
      content TEXT NOT NULL,
      ip TEXT DEFAULT '',
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS page (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT DEFAULT '',
      content TEXT DEFAULT '',
      seo_title TEXT DEFAULT '',
      seo_desc TEXT DEFAULT '',
      status INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS admin_user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT DEFAULT '',
      role TEXT DEFAULT 'admin',
      status INTEGER DEFAULT 1,
      last_login TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS site_setting (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS ad_card (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '',
      description TEXT DEFAULT '',
      btn_text TEXT DEFAULT '立即查看',
      link TEXT DEFAULT '',
      bg_color TEXT DEFAULT '#6c5ce7',
      text_color TEXT DEFAULT '#ffffff',
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS friend_link (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT '',
      url TEXT DEFAULT '',
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS hot_article (
      resource_id INTEGER PRIMARY KEY,
      sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS nav_menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT '',
      link TEXT DEFAULT '',
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      target INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS admin_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      action TEXT DEFAULT '',
      target TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS visit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT DEFAULT '',
      path TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);
}

function seedData() {
  const md5 = require('crypto').createHash('md5').update('admin123').digest('hex');

  const categories = [
    ['软件工具', 'software', '💻', 1, 1],
    ['网赚副业', 'side-income', '💰', 2, 1],
    ['思维导图', 'mindmap', '🧠', 3, 1],
    ['学习资料', 'study', '📚', 4, 1],
    ['模板素材', 'template', '🎨', 5, 1],
    ['电子书库', 'ebook', '📖', 6, 1],
    ['影视合集', 'video', '🎬', 7, 0],
    ['音乐精选', 'music', '🎵', 8, 1]
  ];
  categories.forEach(c => {
    db.run('INSERT INTO category (name, alias, icon, sort, status) VALUES (?, ?, ?, ?, ?)', c);
  });

  const tags = [
    ['免费', 1], ['夸克网盘', 2], ['阿里云盘', 3],
    ['高清', 4], ['实战教程', 5], ['源码', 6],
    ['副业', 7], ['思维导图', 8], ['稀缺资源', 9],
    ['限时免费', 10]
  ];
  tags.forEach((t, i) => {
    db.run('INSERT INTO tag (name, resource_count, sort, status) VALUES (?, 0, ?, 1)', [t[0], t[1]]);
  });

  db.run('INSERT INTO admin_user (username, password, email, role, status) VALUES (?, ?, ?, ?, ?)', 
    ['admin', md5, 'admin@example.com', 'super_admin', 1]);

  db.run('INSERT INTO page (slug, title, content, status) VALUES (?, ?, ?, ?)', 
    ['about', '关于我们', '<p>资源仓库致力于为大家提供免费、高价值的数字资源。所有资源均来自公开渠道或授权分享。</p>', 1]);
  db.run('INSERT INTO page (slug, title, content, status) VALUES (?, ?, ?, ?)', 
    ['disclaimer', '免责声明', '<p>本站仅为资源聚合与导航站，所有资源版权归原作者所有。如有侵权请联系我们，我们将在24小时内处理。</p>', 1]);
  db.run('INSERT INTO page (slug, title, content, status) VALUES (?, ?, ?, ?)', 
    ['infringement', '侵权处理', '<p>投诉邮箱：support@example.com<br>处理时限：24小时内响应</p>', 1]);
  db.run('INSERT INTO page (slug, title, content, status) VALUES (?, ?, ?, ?)', 
    ['contact', '联系我们', '<p>邮箱：support@example.com<br>微信：ziyuan_kefu</p>', 1]);

  const settings = [
    ['site_name', '资源仓库'],
    ['site_desc', '汇聚全网硬核生产力工具与免版权数字素材'],
    ['site_domain', ''],
    ['site_icp', ''],
    ['site_logo', ''],
    ['seo_title', '{title} - {site_name}'],
    ['seo_keywords', ''],
    ['seo_desc', ''],
    ['announcement', '全站资源持续每日更新中，若遇失效请在评论区反馈！'],
    ['announcement_status', '1'],
    ['announcement_color', '#6c5ce7'],
    ['pan_tip', '建议使用手机打开链接，登录后转存到自己的网盘即可，链接失效请在留言区反馈。'],
    ['list_page_size', '12'],
    ['list_default_sort', 'latest'],
    ['tab_latest', '1'],
    ['tab_hot', '1'],
    ['tab_recommend', '1'],
    ['comment_review', '0'],
    ['copy_link', '1'],
    ['maintenance', '0'],
    ['community_title', '加入社群'],
    ['community_desc', '获取更多资源更新和独家福利'],
    ['community_link', ''],
    ['community_status', '1']
  ];
  settings.forEach(s => db.run('INSERT INTO site_setting (key, value) VALUES (?, ?)', s));

  const navs = [
    ['首页', '/', 1, 1, 0],
    ['免费资源', '/resources', 2, 1, 0],
    ['靠谱项目', '/category/side-income', 3, 1, 0],
    ['最新福利', '/tag/限时免费', 4, 1, 0]
  ];
  navs.forEach(n => db.run('INSERT INTO nav_menu (name, link, sort, status, target) VALUES (?, ?, ?, ?, ?)', n));

  db.run('INSERT INTO ad_card (title, description, btn_text, link, bg_color, text_color, sort, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['夸克网盘 SVIP 免费领', '高速下载不限速，独家1TB空间免费入库', '立即领取', 'https://pan.quark.cn', '#6c5ce7', '#ffffff', 1, 1]);
  db.run('INSERT INTO ad_card (title, description, btn_text, link, bg_color, text_color, sort, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['AI 创作办公生产力包', 'GPT-4o & Claude 聚合工具箱，新用户3折', '开通折扣', '#', '#b60e3d', '#ffffff', 2, 1]);

  db.run('INSERT INTO friend_link (name, url, sort, status) VALUES (?, ?, ?, ?)', ['夸克网盘', 'https://pan.quark.cn', 1, 1]);
  db.run('INSERT INTO friend_link (name, url, sort, status) VALUES (?, ?, ?, ?)', ['阿里云盘', 'https://www.aliyundrive.com', 2, 1]);

  const sampleResources = [
    {
      title: '【置顶】资源仓库官方指南：只分享高价值、无套路、免失效的靠谱工具与实战副业',
      category_id: 1, summary: '本站永久承诺纯净无恶心捆绑，涵盖各大主流网盘资源、自动化脚本、精选电子书合集以及独家实操干货。',
      content: '<p>资源仓库致力于为大家筛选全网高价值资源。所有分享内容均经过严格审核，确保无套路、无捆绑。</p><p>涵盖：实用软件、网赚副业、思维导图、学习资料、模板素材等。</p>',
      cover: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=500&fit=crop',
      author: '站长', views: 12500, is_top: 1, is_recommend: 1, publish_time: '2026-03-28 10:00:00',
      pans: [{ pan_type: '夸克网盘', url: 'https://pan.quark.cn/s/example1', code: '' }],
      tags: [1, 6]
    },
    {
      title: '闲鱼无货源单月净收益突破8000+，保姆级实操复盘与选品定价模板',
      category_id: 2, summary: '全面拆解闲鱼最新权重新规，涵盖新手新店冷启动、精准蓝海爆款挖掘技巧、全自动拍单与低成本售后话术。',
      content: '<p>闲鱼无货源是目前新手最友好的副业项目。本资源包含：</p><ul><li>最新闲鱼算法权重新规</li><li>蓝海选品方法论</li><li>定价模板和话术</li><li>全自动拍单脚本</li></ul>',
      cover: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop',
      author: '站长', views: 3420, is_top: 0, is_recommend: 1, publish_time: '2026-03-27 15:30:00',
      pans: [{ pan_type: '夸克网盘', url: 'https://pan.quark.cn/s/example2', code: '' }, { pan_type: '阿里云盘', url: 'https://www.aliyundrive.com/s/example2', code: '' }],
      tags: [1, 5, 7]
    },
    {
      title: '🔥 免费领取夸克网盘 1TB 独立永久容量，官方正规渠道免失效活动',
      category_id: 2, summary: '最新一期夸克网盘容量扩充权益，仅需手机号即可秒到账。支持超大压缩包在线解压、4K高清无缓冲投屏。',
      content: '<p>夸克网盘官方活动，新老用户均可参与。</p><p>领取步骤：</p><ol><li>下载夸克网盘APP</li><li>手机号登录</li><li>进入活动页面领取1TB永久空间</li></ol>',
      cover: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=500&fit=crop',
      author: '站长', views: 5679, is_top: 0, is_recommend: 0, publish_time: '2026-03-26 09:00:00',
      pans: [{ pan_type: '夸克网盘', url: 'https://pan.quark.cn/s/example3', code: '' }],
      tags: [1, 2, 10]
    },
    {
      title: '曾经的天涯神帖全集：被转了上百万次的商业底层逻辑与人性深度复盘',
      category_id: 6, summary: '精选整理老天涯论坛200条殿堂级高赞神帖合集，包含《KK大神房产预言》、《寒门贵子晋升》等绝版PDF/EPUB。',
      content: '<p>天涯论坛曾经是华语互联网最猛的思想碰撞平台。我们整理了200篇被传抄上百万次的神帖。</p><p>涵盖：商业底层逻辑、人性洞察、社会规律、创业感悟。</p>',
      cover: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&h=500&fit=crop',
      author: '站长', views: 8930, is_top: 0, is_recommend: 1, publish_time: '2026-03-24 20:00:00',
      pans: [{ pan_type: '夸克网盘', url: 'https://pan.quark.cn/s/example4', code: '' }, { pan_type: '百度网盘', url: 'https://pan.baidu.com/s/example4', code: 'abcd' }],
      tags: [1, 9]
    },
    {
      title: '稀缺高分纪录片宝库：88部BBC/国家地理全高清1080P合集',
      category_id: 4, summary: '涵盖宇宙探索、地球脉动、自然地理及人类文明史诗巨制，无删减未压缩原盘压制，配有精美海报封面。',
      content: '<p>精选全球最顶级的纪录片合集。</p><p>包含：</p><ul><li>BBC地球脉动全系列</li><li>国家地理百年经典</li><li>Discovery探索频道精选</li></ul>',
      cover: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=500&fit=crop',
      author: '站长', views: 4115, is_top: 0, is_recommend: 0, publish_time: '2026-03-21 11:00:00',
      pans: [{ pan_type: '夸克网盘', url: 'https://pan.quark.cn/s/example5', code: '' }],
      tags: [3, 4]
    },
    {
      title: '2000张汽车酷炫壁纸原画包，原画质4K/8K级超清无水印',
      category_id: 5, summary: '法拉利、兰博基尼、保时捷、迈凯伦等全球顶级超跑高清壁纸，适合设计师桌面灵感和自媒体素材。',
      content: '<p>从某壁纸站付费购买的独家资源，全为原画质无水印。</p><p>共2000+张，涵盖超跑、复古改装、街头夜拍、赛道抓拍等主题。</p>',
      cover: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=500&fit=crop',
      author: '站长', views: 2718, is_top: 0, is_recommend: 0, publish_time: '2026-03-20 14:00:00',
      pans: [{ pan_type: '夸克网盘', url: 'https://pan.quark.cn/s/example6', code: '' }],
      tags: [4]
    }
  ];

  sampleResources.forEach(r => {
    db.run(`INSERT INTO resource (title, category_id, author, cover, summary, content, views, is_top, is_recommend, publish_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.title, r.category_id, r.author, r.cover, r.summary, r.content, r.views, r.is_top, r.is_recommend, r.publish_time]);
    
    const resourceId = getLastInsertId();
    r.pans.forEach((p, i) => {
      db.run('INSERT INTO resource_pan (resource_id, pan_type, url, code, sort) VALUES (?, ?, ?, ?, ?)',
        [resourceId, p.pan_type, p.url, p.code || '', i]);
    });
    r.tags.forEach(tagId => {
      db.run('INSERT OR IGNORE INTO resource_tag (resource_id, tag_id) VALUES (?, ?)', [resourceId, tagId]);
    });
  });

  function getLastInsertId() {
    const row = db.exec('SELECT last_insert_rowid() as id');
    if (row.length > 0 && row[0].values.length > 0) {
      return row[0].values[0][0];
    }
    return null;
  }
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  fs.writeFileSync(DB_PATH, buffer);
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function run(sql, params = []) {
  const result = db.run(sql, params);
  saveDB();
  return result;
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function md5(str) {
  return require('crypto').createHash('md5').update(str).digest('hex');
}

module.exports = { initDB, query, run, queryOne, saveDB, md5 };
