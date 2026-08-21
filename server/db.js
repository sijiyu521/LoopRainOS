/**
 * LoopRainOS Database Layer
 * Uses lowdb (JSON file-based) for persistent storage.
 * Data is stored in server/data/db.json
 */
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const path = require('path')
const fs = require('fs')

const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const adapter = new FileSync(path.join(dataDir, 'db.json'))
const db = low(adapter)

// Set default data structure
db.defaults({
  users: [
    {
      username: 'munei',
      password: 'loo123!@',
      role: 'admin',
      avatar: '',
      created_at: new Date().toISOString(),
    }
  ],
  settings: {
    wallpaper_mode: 'slideshow',
    wallpaper_image: '',
    wallpaper_color: '#20252b',
  },
  files: [],
  file_contents: {},
  file_names: {},
  blog_posts: [],
}).write()

module.exports = db
