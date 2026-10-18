/**
 * Autentikasi admin: username + password (di-hash SHA-256 + salt).
 * Sesi login disimpan di CacheService selama 6 jam (diperpanjang tiap aktivitas).
 * Login gagal 5x → username dikunci 15 menit.
 */

const SESSION_TTL = 21600; // 6 jam (maksimum CacheService)

function hash_(salt, password) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + password, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function createAdmin_(username, password, nama) {
  const u = String(username).trim().toLowerCase();
  if (!u) throw new Error('Username wajib diisi.');
  if (findAdmin_(u)) throw new Error('Username "' + u + '" sudah ada.');
  const salt = Utilities.getUuid();
  appendObj_(SHEETS.ADMIN, {
    Username: txt_(u, 50),
    Salt: txt_(salt),
    PasswordHash: txt_(hash_(salt, String(password))),
    Nama: txt_(nama || u, 100),
    Aktif: true,
  });
}

function findAdmin_(username) {
  const u = String(username || '').trim().toLowerCase();
  return readTable_(SHEETS.ADMIN).find(r => String(r.Username).trim().toLowerCase() === u) || null;
}

function login_(p) {
  const u = String(p.username || '').trim().toLowerCase();
  const pw = String(p.password || '');
  if (!u || !pw) throw new Error('Username dan password wajib diisi.');

  const cache = CacheService.getScriptCache();
  const failKey = 'fail_' + u;
  const fails = Number(cache.get(failKey) || 0);
  if (fails >= 5) throw new Error('Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.');

  const a = findAdmin_(u);
  if (!a || !isTrue_(a.Aktif) || hash_(String(a.Salt), pw) !== String(a.PasswordHash)) {
    cache.put(failKey, String(fails + 1), 900);
    Utilities.sleep(800); // memperlambat tebak-tebakan password
    throw new Error('Username atau password salah.');
  }
  cache.remove(failKey);

  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  const session = { username: String(a.Username), nama: String(a.Nama || a.Username) };
  cache.put('sess_' + token, JSON.stringify(session), SESSION_TTL);
  return { token: token, username: session.username, nama: session.nama };
}

function requireAdmin_(token) {
  const unauth = () => { const e = new Error('Sesi berakhir. Silakan login kembali.'); e.code = 401; return e; };
  if (!token || !/^[a-f0-9]{64}$/.test(String(token))) throw unauth();
  const cache = CacheService.getScriptCache();
  const raw = cache.get('sess_' + token);
  if (!raw) throw unauth();
  cache.put('sess_' + token, raw, SESSION_TTL); // perpanjang sesi
  return JSON.parse(raw);
}

function logout_(token) {
  if (token) CacheService.getScriptCache().remove('sess_' + token);
  return { loggedOut: true };
}

function changePassword_(p, session) {
  const a = findAdmin_(session.username);
  if (!a) throw new Error('Akun tidak ditemukan.');
  if (hash_(String(a.Salt), String(p.oldPassword || '')) !== String(a.PasswordHash)) throw new Error('Password lama salah.');
  const np = String(p.newPassword || '');
  if (np.length < 8) throw new Error('Password baru minimal 8 karakter.');
  if (!/[A-Za-z]/.test(np) || !/\d/.test(np)) throw new Error('Password baru harus mengandung huruf dan angka.');
  const salt = Utilities.getUuid();
  updateObj_(SHEETS.ADMIN, a._row, { Salt: txt_(salt), PasswordHash: txt_(hash_(salt, np)) });
  return { changed: true };
}

// ============================================================
//  Fungsi manual – jalankan dari editor Apps Script bila perlu
// ============================================================

/** Lupa password? Ubah nilai di bawah lalu jalankan fungsi ini dari editor. */
function resetPasswordAdmin() {
  const USERNAME = 'admin';
  const PASSWORD_BARU = 'GantiPassword123';
  const a = findAdmin_(USERNAME);
  if (!a) throw new Error('Username tidak ditemukan.');
  const salt = Utilities.getUuid();
  updateObj_(SHEETS.ADMIN, a._row, { Salt: txt_(salt), PasswordHash: txt_(hash_(salt, PASSWORD_BARU)), Aktif: true });
  CacheService.getScriptCache().remove('fail_' + USERNAME);
  Logger.log('Password untuk "' + USERNAME + '" sudah direset.');
}

/** Menambah admin baru. Ubah nilai di bawah lalu jalankan dari editor. */
function tambahAdmin() {
  createAdmin_('staf1', 'PasswordKuat123', 'Staf Operasional');
  Logger.log('Admin baru ditambahkan.');
}
