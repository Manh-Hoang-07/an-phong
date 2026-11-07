#!/usr/bin/env bash
# =============================================================================
#  Cài đặt Ẩn Phong lên VPS Ubuntu (22.04 / 24.04) — chạy một lần, chạy lại cũng an toàn.
#
#  1. Chép mã nguồn lên server, ví dụ /opt/anphong (git clone hoặc scp).
#  2. Chạy:
#       cd /opt/anphong
#       sudo bash deploy/setup-vps.sh
#     Tuỳ chọn:
#       --domain game.ten-mien.vn     cấu hình Nginx cho tên miền (bỏ trống = dùng IP)
#       --restore /duong/dan/file.dump  đưa dữ liệu cũ (tạo bằng `npm run backup`) vào database mới
#       --no-nginx                    không cấu hình Nginx
#
#  Script sẽ:
#   - Cài Node.js 24, PostgreSQL 18 (khớp bản dùng trên máy dev để phục hồi được file .dump), Nginx
#   - Tạo user hệ thống `anphong`, role + database PostgreSQL `anphong` với mật khẩu ngẫu nhiên
#   - Ghi cấu hình kết nối vào /etc/anphong.env (chỉ root và anphong đọc được)
#   - Cài thư viện, tạo bảng (migration), phục hồi dữ liệu nếu có --restore
#   - Cài dịch vụ systemd, sao lưu tự động 3 giờ sáng mỗi ngày, cấu hình Nginx
# =============================================================================
set -euo pipefail

# Chưa phải root thì tự chạy lại bằng sudo (sẽ hỏi mật khẩu)
if [[ $EUID -ne 0 ]]; then
  exec sudo bash "$0" "$@"
fi

APP_USER=anphong
DB_NAME=anphong
DB_USER=anphong
PG_VERSION=18
NODE_MAJOR=24
ENV_FILE=/etc/anphong.env
BACKUP_DIR=/var/backups/anphong
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DOMAIN=""
RESTORE=""
WITH_NGINX=1
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)  DOMAIN="${2:?Thiếu tên miền sau --domain}"; shift 2 ;;
    --restore) RESTORE="${2:?Thiếu đường dẫn file .dump sau --restore}"; shift 2 ;;
    --no-nginx) WITH_NGINX=0; shift ;;
    -h|--help) sed -n '2,22p' "$0"; exit 0 ;;
    *) echo "Tham số không hiểu: $1 (xem --help)"; exit 1 ;;
  esac
done

step() { echo; echo "==> $*"; }
die()  { echo "LỖI: $*" >&2; exit 1; }

[[ -f "$APP_DIR/package.json" && -f "$APP_DIR/server/index.js" ]] || die "Không thấy mã nguồn game ở $APP_DIR"
[[ -z "$RESTORE" || -f "$RESTORE" ]] || die "Không có file: $RESTORE"
. /etc/os-release
[[ "${ID:-}" == "ubuntu" || "${ID_LIKE:-}" == *debian* ]] || die "Script dành cho Ubuntu/Debian"

export DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------- Gói hệ thống
step "Cài gói cần thiết"
apt-get update -q
apt-get install -y -q curl ca-certificates gnupg openssl postgresql-common

# Cần Node.js 22.13 trở lên
if ! command -v node >/dev/null || ! node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>22||(a===22&&b>=13)?0:1)'; then
  step "Cài Node.js $NODE_MAJOR"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -q nodejs
fi
echo "Node.js $(node -v)"

if ! dpkg -s "postgresql-$PG_VERSION" >/dev/null 2>&1; then
  step "Cài PostgreSQL $PG_VERSION (kho chính thức apt.postgresql.org)"
  /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
  apt-get install -y -q "postgresql-$PG_VERSION"
fi
systemctl enable --now postgresql
PG_BIN="/usr/lib/postgresql/$PG_VERSION/bin"

if [[ $WITH_NGINX -eq 1 ]]; then
  apt-get install -y -q nginx
fi

# ---------------------------------------------------------------- User hệ thống
step "User hệ thống $APP_USER"
if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
fi
mkdir -p "$BACKUP_DIR"
chown "$APP_USER:$APP_USER" "$BACKUP_DIR"
chmod 750 "$BACKUP_DIR"

# ---------------------------------------------------------------- PostgreSQL
psql_admin() { runuser -u postgres -- env -C / psql -v ON_ERROR_STOP=1 -qtAX "$@"; }
# Mật khẩu đưa vào psql qua stdin (printf là lệnh có sẵn của bash) nên không lộ trong danh sách tiến trình
set_role_password() {
  printf '\\set pass %s\n%s %s WITH LOGIN PASSWORD :'"'"'pass'"'"';\n' "$DB_PASS" "$1" "$DB_USER" | psql_admin
}

step "Role và database PostgreSQL"
# Dùng lại mật khẩu cũ nếu đã có file cấu hình, không thì sinh mới
DB_PASS=""
if [[ -f "$ENV_FILE" ]]; then
  DB_PASS="$(sed -n 's/^PGPASSWORD=//p' "$ENV_FILE" | head -n1)"
fi
[[ -n "$DB_PASS" ]] || DB_PASS="$(openssl rand -hex 24)"

if [[ "$(psql_admin -c "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'")" == "1" ]]; then
  set_role_password "ALTER ROLE"
  echo "Role $DB_USER đã có (đặt lại mật khẩu khớp với $ENV_FILE)"
else
  set_role_password "CREATE ROLE"
  echo "Đã tạo role $DB_USER"
fi

DB_EXISTS="$(psql_admin -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'")"
if [[ "$DB_EXISTS" != "1" ]]; then
  psql_admin -c "CREATE DATABASE $DB_NAME OWNER $DB_USER ENCODING 'UTF8' TEMPLATE template0"
  echo "Đã tạo database $DB_NAME"
else
  echo "Database $DB_NAME đã có, giữ nguyên dữ liệu"
fi
# Chỉ chủ database được kết nối; schema public thuộc về role của game
psql_admin -c "REVOKE ALL ON DATABASE $DB_NAME FROM PUBLIC"
psql_admin -d "$DB_NAME" -c "ALTER SCHEMA public OWNER TO $DB_USER"

# ---------------------------------------------------------------- Cấu hình kết nối
step "Ghi $ENV_FILE"
if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" <<EOF
# Cấu hình cho dịch vụ anphong (đọc bởi systemd và công cụ dòng lệnh).
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASS
PGDATABASE=$DB_NAME
EOF
  echo "Đã tạo $ENV_FILE"
else
  echo "$ENV_FILE đã có, giữ nguyên"
fi
chown root:"$APP_USER" "$ENV_FILE"
chmod 640 "$ENV_FILE"

# ---------------------------------------------------------------- Mã nguồn
step "Cài thư viện Node.js"
cd "$APP_DIR"
npm ci --omit=dev --no-audit --no-fund

run_app() { runuser -u "$APP_USER" -- env -C "$APP_DIR" node --env-file="$ENV_FILE" "$@"; }

# ---------------------------------------------------------------- Dữ liệu cũ
if [[ -n "$RESTORE" ]]; then
  step "Phục hồi dữ liệu từ $RESTORE"
  HAS_USERS="$(psql_admin -d "$DB_NAME" -c "SELECT to_regclass('public.users') IS NOT NULL AND EXISTS (SELECT 1 FROM users)" 2>/dev/null || echo f)"
  if [[ "$HAS_USERS" == "t" ]]; then
    echo "BỎ QUA: database $DB_NAME đã có tài khoản, không phục hồi đè lên dữ liệu thật."
    echo "        Muốn làm lại từ đầu: sudo -u postgres dropdb $DB_NAME rồi chạy lại script."
    RESTORE=""
  fi
fi
if [[ -n "$RESTORE" ]]; then
  systemctl stop anphong 2>/dev/null || true
  cp "$RESTORE" /tmp/anphong-restore.dump
  chmod 644 /tmp/anphong-restore.dump
  PGPASSWORD="$DB_PASS" "$PG_BIN/pg_restore" -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" \
    --clean --if-exists --no-owner --no-privileges /tmp/anphong-restore.dump
  rm -f /tmp/anphong-restore.dump
  echo "Đã phục hồi dữ liệu"
fi

step "Tạo / nâng cấp bảng"
run_app -e "const db = require('./server/db'); db.init().then(() => db.close()).then(() => console.log('Cấu trúc database đã sẵn sàng.')).catch((e) => { console.error(e.message); process.exit(1); })"

# ---------------------------------------------------------------- Dịch vụ systemd
step "Dịch vụ systemd"
# Giữ lại COOKIE_SECURE=1 nếu lần trước đã bật (sau khi có HTTPS)
SECURE_SED=""
if grep -q "^Environment=COOKIE_SECURE=1" /etc/systemd/system/anphong.service 2>/dev/null; then
  SECURE_SED="s/^#Environment=COOKIE_SECURE=1/Environment=COOKIE_SECURE=1/;"
fi
sed "${SECURE_SED}s#^WorkingDirectory=.*#WorkingDirectory=$APP_DIR#; s#^ExecStart=.*#ExecStart=$(command -v node) server/index.js#" \
  "$APP_DIR/deploy/anphong.service" > /etc/systemd/system/anphong.service
systemctl daemon-reload
systemctl enable anphong >/dev/null
systemctl restart anphong
sleep 2
if systemctl is-active --quiet anphong; then
  echo "Dịch vụ anphong đang chạy"
else
  journalctl -u anphong -n 30 --no-pager
  die "Dịch vụ anphong không chạy được (xem log ở trên)"
fi

# ---------------------------------------------------------------- Sao lưu tự động
step "Sao lưu tự động 3 giờ sáng mỗi ngày"
cat > /etc/cron.d/anphong-backup <<EOF
# Sao lưu database game, giữ 14 bản mới nhất trong $BACKUP_DIR
0 3 * * * $APP_USER cd $APP_DIR && BACKUP_DIR=$BACKUP_DIR PG_DUMP=$PG_BIN/pg_dump $(command -v node) --env-file=$ENV_FILE server/backup.js >> $BACKUP_DIR/backup.log 2>&1
EOF
chmod 644 /etc/cron.d/anphong-backup

# ---------------------------------------------------------------- Nginx
if [[ $WITH_NGINX -eq 1 ]]; then
  step "Nginx"
  SERVER_NAME="${DOMAIN:-_}"
  sed "s#^\(\s*server_name\s\+\)[^;]*;#\1$SERVER_NAME;#" "$APP_DIR/deploy/nginx-anphong.conf" > /etc/nginx/sites-available/anphong
  ln -sf /etc/nginx/sites-available/anphong /etc/nginx/sites-enabled/anphong
  [[ -n "$DOMAIN" ]] || rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl reload nginx
fi

# ---------------------------------------------------------------- Xong
echo
echo "================================================================"
echo " XONG."
echo "   Mã nguồn:   $APP_DIR"
echo "   Database:   $DB_NAME (user $DB_USER, mật khẩu trong $ENV_FILE)"
echo "   Sao lưu:    $BACKUP_DIR (thử ngay: sudo -u $APP_USER env -C $APP_DIR node --env-file=$ENV_FILE server/backup.js)"
echo "   Log game:   journalctl -u anphong -f"
if [[ $WITH_NGINX -eq 1 ]]; then
  if [[ -n "$DOMAIN" ]]; then
    echo "   Mở game:    http://$DOMAIN"
    echo
    echo " Bật HTTPS:"
    echo "   sudo apt install -y certbot python3-certbot-nginx"
    echo "   sudo certbot --nginx -d $DOMAIN"
    echo "   rồi bỏ dấu # ở dòng COOKIE_SECURE=1 trong /etc/systemd/system/anphong.service:"
    echo "   sudo systemctl daemon-reload && sudo systemctl restart anphong"
  else
    echo "   Mở game:    http://<IP của VPS>"
  fi
fi
if [[ -z "$RESTORE" ]]; then
  echo
  echo "Vào game và tạo tài khoản đầu tiên (đăng ký luôn mở, ai cũng có thể tạo tài khoản)."
fi
echo "================================================================"
