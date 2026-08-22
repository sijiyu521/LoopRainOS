/**
 * LoopRainOS Backend Server
 * Express server with persistent JSON database
 */
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')
const { URL } = require('url')

const db = require('./db')

const app = express()
const PORT = process.env.PORT || 8079
const dataDir = path.join(__dirname, 'data')

// Middleware
app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files from public directory
const publicDir = path.join(__dirname, '..', 'public')
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir))
}

// ==================== API Routes ====================

// ---------- Auth Routes ----------
app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body
  if (role === 'admin') {
    const user = db.get('users').find({ username }).value()
    if (user && user.password === password) {
      return res.json({ success: true, role: 'admin', username: user.username })
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  } else if (role === 'guest') {
    return res.json({ success: true, role: 'guest', username: 'Guest' })
  }
  return res.status(400).json({ success: false, message: 'Invalid role' })
})

app.get('/api/auth/user', (req, res) => {
  const user = db.get('users').first().value()
  if (user) {
    res.json({ success: true, username: user.username, avatar: user.avatar, role: user.role, display_name: user.display_name || user.username })
  } else {
    res.status(404).json({ success: false, message: 'User not found' })
  }
})

// Combined endpoint: user info + settings, used at app startup to restore state
app.get('/api/auth/me', (req, res) => {
  const user = db.get('users').first().value()
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }
  const settings = db.get('settings').value()
  res.json({
    success: true,
    user: {
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      display_name: user.display_name || user.username,
    },
    settings,
  })
})

app.put('/api/auth/password', (req, res) => {
  const { oldPassword, newPassword } = req.body
  const user = db.get('users').first().value()
  if (!user || user.password !== oldPassword) {
    return res.status(401).json({ success: false, message: 'Old password incorrect' })
  }
  db.get('users').find({ username: user.username }).assign({ password: newPassword }).write()
  res.json({ success: true })
})

app.put('/api/auth/password/set', (req, res) => {
  const { password } = req.body
  if (!password) {
    return res.status(400).json({ success: false, message: 'password required' })
  }
  db.get('users').find({ role: 'admin' }).assign({ password }).write()
  res.json({ success: true })
})

app.put('/api/auth/username', (req, res) => {
  const { username } = req.body
  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, message: 'Username required' })
  }
  db.get('users').find({ role: 'admin' }).assign({ username: username.trim() }).write()
  res.json({ success: true })
})

app.put('/api/auth/avatar', (req, res) => {
  const { avatar } = req.body
  db.get('users').find({ role: 'admin' }).assign({ avatar: avatar || '' }).write()
  res.json({ success: true })
})
// ---------- Settings Routes ----------
app.get('/api/settings', (req, res) => {
  const settings = db.get('settings').value()
  res.json({ success: true, settings })
})

app.put('/api/settings', (req, res) => {
  const updates = req.body
  db.update('settings', (s) => ({ ...s, ...updates })).write()
  res.json({ success: true })
})

// ---------- File Map Routes ----------
app.get('/api/files', (req, res) => {
  const files = db.get('files').value()
  const names = db.get('file_names').value()
  res.json({ success: true, files, names })
})

app.post('/api/files', (req, res) => {
  const file = req.body
  if (!file.path || !file.name) {
    return res.status(400).json({ success: false, message: 'path and name required' })
  }
  const existing = db.get('files').find({ path: file.path }).value()
  if (existing) {
    return res.status(409).json({ success: false, message: 'File already exists' })
  }
  const newFile = {
    name: file.name,
    path: file.path,
    size: file.size || 0,
    lastedittime: Math.floor(Date.now() / 1000),
    title: file.title || '',
    abstract: file.abstract || '',
  }
  db.get('files').push(newFile).write()
  res.json({ success: true, file: newFile })
})

app.put('/api/files/rename', (req, res) => {
  const { path, name } = req.body
  if (!path || !name) {
    return res.status(400).json({ success: false, message: 'path and name required' })
  }
  const file = db.get('files').find({ path }).value()
  if (file) {
    db.get('files').find({ path }).assign({ name, lastedittime: Math.floor(Date.now() / 1000) }).write()
  }
  // Also store in file_names for map.json entries
  db.set(`file_names.${path}`, name).write()
  res.json({ success: true })
})

app.delete('/api/files', (req, res) => {
  const { path } = req.body
  if (!path) {
    return res.status(400).json({ success: false, message: 'path required' })
  }
  db.get('files').remove({ path }).write()
  db.unset(`file_names.${path}`).write()
  db.unset(`file_contents.${path}`).write()
  res.json({ success: true })
})

// ---------- File Content Routes (for VSCode editor) ----------
app.get('/api/files/content', (req, res) => {
  const { path } = req.query
  if (!path) {
    return res.status(400).json({ success: false, message: 'path required' })
  }
  const content = db.get(`file_contents.${path}`).value()
  res.json({ success: true, content: content || '' })
})

app.put('/api/files/content', (req, res) => {
  const { path, content } = req.body
  if (!path) {
    return res.status(400).json({ success: false, message: 'path required' })
  }
  db.set(`file_contents.${path}`, content).write()
  // Update lastedittime if file exists in files list
  const file = db.get('files').find({ path }).value()
  if (file) {
    db.get('files').find({ path }).assign({ lastedittime: Math.floor(Date.now() / 1000) }).write()
  }
  res.json({ success: true })
})

// ---------- Static JSON data (map.json, musics.json) ----------
app.get('/api/map', (req, res) => {
  try {
    const mapPath = path.join(publicDir, 'map.json')
    if (fs.existsSync(mapPath)) {
      const data = JSON.parse(fs.readFileSync(mapPath, 'utf8'))
      return res.json(data)
    }
  } catch (e) {}
  res.json([])
})

app.get('/api/musics', (req, res) => {
  try {
    const musicsPath = path.join(publicDir, 'musics.json')
    if (fs.existsSync(musicsPath)) {
      const data = JSON.parse(fs.readFileSync(musicsPath, 'utf8'))
      return res.json(data)
    }
  } catch (e) {}
  res.json([])
})

// ---------- Blog Routes ----------
app.get('/api/blog/posts', (req, res) => {
  const posts = db.get('blog_posts').value()
  res.json({ success: true, posts })
})

app.post('/api/blog/posts', (req, res) => {
  const { filename, title, content } = req.body
  if (!filename) {
    return res.status(400).json({ success: false, message: 'filename required' })
  }
  const existing = db.get('blog_posts').find({ filename }).value()
  if (existing) {
    return res.status(409).json({ success: false, message: 'Post already exists' })
  }
  const post = {
    filename,
    title: title || filename,
    content: content || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.get('blog_posts').push(post).write()
  res.json({ success: true, post })
})

app.put('/api/blog/posts/:filename', (req, res) => {
  const { filename } = req.params
  const updates = req.body
  const post = db.get('blog_posts').find({ filename }).value()
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' })
  }
  db.get('blog_posts').find({ filename }).assign({
    ...updates,
    updated_at: new Date().toISOString(),
  }).write()
  res.json({ success: true })
})

app.get('/api/blog/posts/:filename', (req, res) => {
  const { filename } = req.params
  const post = db.get('blog_posts').find({ filename }).value()
  if (!post) {
    // Try to read from blog/ directory
    const blogPath = path.join(__dirname, '..', 'blog', filename)
    if (fs.existsSync(blogPath)) {
      const content = fs.readFileSync(blogPath, 'utf8')
      return res.json({ success: true, post: { filename, content, title: filename } })
    }
    return res.status(404).json({ success: false, message: 'Post not found' })
  }
  res.json({ success: true, post })
})

// ---------- Import existing localStorage data ----------
app.post('/api/import', (req, res) => {
  const { files, file_contents, file_names, settings, avatar, username, password } = req.body
  
  if (files && Array.isArray(files) && files.length > 0) {
    const existing = db.get('files').value()
    const existingPaths = new Set(existing.map(f => f.path))
    const newFiles = files.filter(f => !existingPaths.has(f.path))
    if (newFiles.length > 0) {
      db.get('files').push(...newFiles).write()
    }
  }
  
  if (file_contents && typeof file_contents === 'object') {
    Object.keys(file_contents).forEach(key => {
      db.set(`file_contents.${key}`, file_contents[key]).write()
    })
  }
  
  if (file_names && typeof file_names === 'object') {
    Object.keys(file_names).forEach(key => {
      db.set(`file_names.${key}`, file_names[key]).write()
    })
  }
  
  if (settings) {
    db.update('settings', (s) => ({ ...s, ...settings })).write()
  }
  
  if (avatar) {
    db.get('users').find({ role: 'admin' }).assign({ avatar }).write()
  }
  
  if (username) {
    db.get('users').find({ role: 'admin' }).assign({ username }).write()
  }
  
  if (password) {
    db.get('users').find({ role: 'admin' }).assign({ password }).write()
  }
  
  res.json({ success: true, message: 'Data imported successfully' })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ---------- Web Proxy (real browser) ----------
// Proxies external websites through the backend so pages can be embedded
// in the browser iframe even when they send X-Frame-Options / CSP frame-ancestors.
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

// Rewrite an HTML body so that relative URLs resolve against the target page.
// Sub-resources (css/js/img) are fetched directly by the browser from the
// original domain — no rewriting needed. Only the top document must flow
// through the proxy (so X-Frame-Options / CSP can be stripped).
function rewriteHtml(html, baseUrl) {
  // Use a marker so the <base> tag itself is never rewritten below.
  html = html.replace(/<base\b[^>]*>/gi, '')
  html = html.replace(/<head([^>]*)>/i, (m, attrs) => {
    return `<head${attrs}><base href="${baseUrl}">`
  })
  return html
}

app.get('/api/proxy', async (req, res) => {
  const target = req.query.url
  if (!target) {
    return res.status(400).json({ success: false, message: 'url required' })
  }
  let url
  try {
    url = new URL(target.startsWith('http') ? target : 'https://' + target)
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Invalid url' })
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    return res.status(400).json({ success: false, message: 'Only http/https supported' })
  }
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const resp = await fetch(url.href, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    })
    clearTimeout(timer)
    const contentType = resp.headers.get('content-type') || ''
    const isHtml = contentType.includes('text/html') || resp.headers.get('content-type') == null
    let body = await resp.text()
    if (isHtml) {
      body = rewriteHtml(body, url.href)
    }
    // Remove frame-blocking headers so the site can be embedded
    res.removeHeader('Content-Security-Policy')
    res.setHeader('Content-Security-Policy', 'frame-ancestors *; upgrade-insecure-requests')
    res.setHeader('X-Frame-Options', 'ALLOWALL')
    res.setHeader('Content-Type', contentType || 'text/html; charset=utf-8')
    res.setHeader('Proxy-Agent', 'LoopRainOS')
    res.send(body)
  } catch (e) {
    console.error('Proxy error:', e.message)
    res.status(502).json({ success: false, message: 'Failed to fetch page: ' + e.message })
  }
})

// ==================== Start Server ====================
app.listen(PORT, () => {
  console.log(`LoopRainOS backend server running on http://localhost:${PORT}`)
  console.log(`Database file: ${path.join(dataDir, 'db.json')}`)
})
