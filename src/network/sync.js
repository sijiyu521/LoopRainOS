/**
 * Data Sync Utility
 * Migrates existing localStorage data to backend database
 * and provides helpers for syncing state
 */
import api from '../network/api'

const MIGRATED_FLAG = 'looprainos-backend-migrated'

/**
 * Check if backend is available
 */
export async function checkBackend() {
  try {
    const res = await api.health()
    return res.data && res.data.status === 'ok'
  } catch (e) {
    return false
  }
}

/**
 * Migrate all localStorage data to backend
 */
export async function migrateToBackend() {
  if (localStorage.getItem(MIGRATED_FLAG) === 'true') {
    return true
  }

  try {
    const available = await checkBackend()
    if (!available) {
      console.warn('Backend not available, skipping migration')
      return false
    }

    // Collect localStorage data
    const customFiles = JSON.parse(localStorage.getItem('looprainos-custom-files') || '[]')
    const fileNames = JSON.parse(localStorage.getItem('looprainos-file-names') || '{}')
    const avatar = localStorage.getItem('looprainos-avatar') || ''
    const wallpaperMode = localStorage.getItem('looprainos-wallpaper-mode') || 'slideshow'
    const wallpaperImage = localStorage.getItem('looprainos-wallpaper-image') || ''
    const wallpaperColor = localStorage.getItem('looprainos-wallpaper-color') || '#20252b'
    const username = localStorage.getItem('looprainos-admin-username') || ''

    // Collect file contents (keys starting with 'local:')
    const fileContents = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('local:')) {
        fileContents[key] = localStorage.getItem(key)
      }
    }

    // Build import payload
    const importData = {
      files: customFiles,
      file_contents: fileContents,
      file_names: fileNames,
      settings: {
        wallpaper_mode: wallpaperMode,
        wallpaper_image: wallpaperImage,
        wallpaper_color: wallpaperColor,
      },
    }
    if (avatar) importData.avatar = avatar
    if (username && username !== 'Administrator') importData.username = username
    // 密码不再存前端 localStorage，不参与迁移

    await api.importData(importData)
    localStorage.setItem(MIGRATED_FLAG, 'true')
    console.log('Data migrated to backend successfully')
    return true
  } catch (e) {
    console.error('Migration failed:', e)
    return false
  }
}

/**
 * Load settings from backend and update localStorage (fallback)
 */
export async function loadSettingsFromBackend(store) {
  try {
    const res = await api.getSettings()
    if (res.data && res.data.success) {
      const s = res.data.settings
      if (s.wallpaper_mode) store.commit('set_wallpaper_mode', s.wallpaper_mode)
      if (s.wallpaper_image) store.commit('set_wallpaper_image', s.wallpaper_image)
      if (s.wallpaper_color) store.commit('set_wallpaper_color', s.wallpaper_color)
    }
  } catch (e) {
    console.warn('Failed to load settings from backend:', e)
  }
}

/**
 * Load user info from backend
 */
export async function loadUserFromBackend(store) {
  try {
    const res = await api.getUser()
    if (res.data && res.data.success) {
      if (res.data.username) store.commit('set_admin_username', res.data.username)
      if (res.data.avatar) store.commit('set_avatar', res.data.avatar)
    }
  } catch (e) {
    console.warn('Failed to load user from backend:', e)
  }
}

/**
 * Save file content to backend
 */
export async function saveFileContentToBackend(path, content) {
  try {
    await api.saveFileContent(path, content)
  } catch (e) {
    console.warn('Failed to save file to backend:', e)
  }
}

/**
 * Load file content from backend
 */
export async function loadFileContentFromBackend(path) {
  try {
    const res = await api.getFileContent(path)
    if (res.data && res.data.success) {
      return res.data.content
    }
  } catch (e) {
    console.warn('Failed to load file from backend:', e)
  }
  return null
}
