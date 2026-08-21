/**
 * LoopRainOS API Service
 * Provides methods to communicate with the backend server
 */
import { request } from './request'

// In development, request baseURL is '/dev/' which proxies to backend;
// in production, static files and API are served from the same origin.
const API_BASE = 'api'

const api = {
  // Auth
  login(username, password, role = 'admin') {
    return request.post({ url: `${API_BASE}/auth/login`, data: { username, password, role } })
  },
  getUser() {
    return request.get({ url: `${API_BASE}/auth/user` })
  },
  changePassword(oldPassword, newPassword) {
    return request.put({ url: `${API_BASE}/auth/password`, data: { oldPassword, newPassword } })
  },
  changeUsername(username) {
    return request.put({ url: `${API_BASE}/auth/username`, data: { username } })
  },
  setPassword(password) {
    return request.put({ url: `${API_BASE}/auth/password/set`, data: { password } })
  },
  changeAvatar(avatar) {
    return request.put({ url: `${API_BASE}/auth/avatar`, data: { avatar } })
  },

  // Settings
  getSettings() {
    return request.get({ url: `${API_BASE}/settings` })
  },
  updateSettings(settings) {
    return request.put({ url: `${API_BASE}/settings`, data: settings })
  },

  // Files
  getFiles() {
    return request.get({ url: `${API_BASE}/files` })
  },
  createFile(file) {
    return request.post({ url: `${API_BASE}/files`, data: file })
  },
  renameFile(path, name) {
    return request.put({ url: `${API_BASE}/files/rename`, data: { path, name } })
  },
  deleteFile(path) {
    return request.delete({ url: `${API_BASE}/files`, data: { path } })
  },

  // File Content
  getFileContent(path) {
    return request.get({ url: `${API_BASE}/files/content`, params: { path } })
  },
  saveFileContent(path, content) {
    return request.put({ url: `${API_BASE}/files/content`, data: { path, content } })
  },

  // Blog
  getBlogPosts() {
    return request.get({ url: `${API_BASE}/blog/posts` })
  },
  getBlogPost(filename) {
    return request.get({ url: `${API_BASE}/blog/posts/${encodeURIComponent(filename)}` })
  },
  createBlogPost(filename, title, content) {
    return request.post({ url: `${API_BASE}/blog/posts`, data: { filename, title, content } })
  },
  updateBlogPost(filename, data) {
    return request.put({ url: `${API_BASE}/blog/posts/${encodeURIComponent(filename)}`, data })
  },

  // Import existing data
  importData(data) {
    return request.post({ url: `${API_BASE}/import`, data })
  },

  // Health
  health() {
    return request.get({ url: `${API_BASE}/health` })
  },
}

export default api
