'use strict';
// Lưu trữ bằng SQLite có sẵn trong Node (node:sqlite), không cần cài thêm gì.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, 'anphong.db');

const db = new DatabaseSync(DB_FILE);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    pass TEXT NOT NULL,
    created INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS players (
    user_id INTEGER PRIMARY KEY,
    data TEXT NOT NULL,
    updated INTEGER NOT NULL
  );
`);

const q = {
  countUsers: db.prepare('SELECT COUNT(*) AS n FROM users'),
  userByName: db.prepare('SELECT * FROM users WHERE username = ?'),
  insertUser: db.prepare('INSERT INTO users (username, pass, created) VALUES (?, ?, ?)'),
  insertSession: db.prepare('INSERT INTO sessions (token_hash, user_id, expires) VALUES (?, ?, ?)'),
  sessionByHash: db.prepare('SELECT s.user_id, s.expires, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?'),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  purgeSessions: db.prepare('DELETE FROM sessions WHERE expires < ?'),
  getPlayer: db.prepare('SELECT data FROM players WHERE user_id = ?'),
  upsertPlayer: db.prepare(`INSERT INTO players (user_id, data, updated) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated = excluded.updated`),
};

module.exports = {
  db, DB_FILE, DATA_DIR,
  countUsers: () => q.countUsers.get().n,
  userByName: (name) => q.userByName.get(name),
  insertUser: (name, pass) => Number(q.insertUser.run(name, pass, Date.now()).lastInsertRowid),
  insertSession: (hash, userId, expires) => q.insertSession.run(hash, userId, expires),
  sessionByHash: (hash) => q.sessionByHash.get(hash),
  deleteSession: (hash) => q.deleteSession.run(hash),
  purgeSessions: () => q.purgeSessions.run(Date.now()),
  loadPlayer: (userId) => {
    const row = q.getPlayer.get(userId);
    return row ? JSON.parse(row.data) : null;
  },
  savePlayer: (userId, player) => q.upsertPlayer.run(userId, JSON.stringify(player), Date.now()),
};
