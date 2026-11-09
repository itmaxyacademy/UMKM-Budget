#!/usr/bin/env bash
set -e

# ==============================================================================
# Skrip Resmi Deployment UMKM Budget ke ai.maxy.academy
# ==============================================================================

echo "========================================================"
echo "🚀 [1/3] Menyiapkan file produksi UMKM Budget..."
echo "========================================================"

# Pastikan berada di folder script ini dijalankan
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "📦 Menjalankan build bundle produksi..."
    npm run build
fi

TARGET_DIR="/var/www/html/ai.maxy.academy/UMKM-Budget"
ALIAS_DIR="/var/www/html/ai.maxy.academy/umkm-budget"

mkdir -p "$TARGET_DIR"
cp -r dist/* "$TARGET_DIR/"
ln -sfn "$TARGET_DIR" "$ALIAS_DIR"
chmod -R 755 "$TARGET_DIR"
echo "✅ File bundle berhasil disalin ke $TARGET_DIR"

echo "========================================================"
echo "🔍 [2/3] Mengonfigurasi rute Apache..."
echo "========================================================"

CONF_FILE=$(grep -rnwl "/etc/apache2/sites-enabled/" -e "ai.maxy.academy" 2>/dev/null | head -n 1)

if [ -n "$CONF_FILE" ]; then
    echo "📄 File konfigurasi aktif: $CONF_FILE"
    
    # Backup file konfigurasi
    BAK_FILE="${CONF_FILE}.bak_$(date +%s)"
    cp "$CONF_FILE" "$BAK_FILE"
    echo "💾 Backup aman dibuat: $BAK_FILE"

    python3 - "$CONF_FILE" << 'PYEOF'
import sys, re

conf_path = sys.argv[1]
with open(conf_path, "r") as f:
    content = f.read()

if "UMKM-Budget" in content:
    print("ℹ️  Rule UMKM-Budget sudah ada di " + conf_path)
    sys.exit(0)

rules = """
    # --- Rute UMKM Budget Maxy Academy ---
    ProxyPass /UMKM-Budget !
    ProxyPass /umkm-budget !
    Alias /UMKM-Budget /var/www/html/ai.maxy.academy/UMKM-Budget
    Alias /umkm-budget /var/www/html/ai.maxy.academy/UMKM-Budget

    <Directory /var/www/html/ai.maxy.academy/UMKM-Budget>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
"""

# Sisipkan sebelum ProxyPass / http agar request tidak dilempar ke Express
if re.search(r'ProxyPass\s+/\s+http', content):
    content = re.sub(r'(ProxyPass\s+/\s+http)', rules + r'\n    \1', content, count=1)
elif '</VirtualHost>' in content:
    idx = content.rfind('</VirtualHost>')
    content = content[:idx] + rules + '\n' + content[idx:]
else:
    content += '\n' + rules

with open(conf_path, "w") as f:
    f.write(content)

print("✨ Rule Apache berhasil disisipkan ke " + conf_path)
PYEOF

else
    echo "⚠️  File virtualhost ai.maxy.academy tidak ditemukan di sites-enabled."
    echo "Mengaktifkan konfigurasi global di /etc/apache2/conf-available/umkm-budget.conf..."
    cat << 'EOF' > /etc/apache2/conf-available/umkm-budget.conf
ProxyPass /UMKM-Budget !
ProxyPass /umkm-budget !
Alias /UMKM-Budget /var/www/html/ai.maxy.academy/UMKM-Budget
Alias /umkm-budget /var/www/html/ai.maxy.academy/UMKM-Budget

<Directory /var/www/html/ai.maxy.academy/UMKM-Budget>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
EOF
    a2enconf umkm-budget >/dev/null 2>&1 || true
fi

echo "========================================================"
echo "🧪 [3/3] Menguji sintaks Apache..."
echo "========================================================"

if apache2ctl configtest; then
    echo "✅ Uji sintaks BERHASIL (Syntax OK). Me-reload Apache..."
    systemctl reload apache2
    echo ""
    echo "========================================================"
    echo "🎉 SELESAI! UMKM Budget sudah aktif di server!"
    echo "🌐 Silakan buka browser Anda di:"
    echo "   👉 https://ai.maxy.academy/UMKM-Budget/"
    echo "   👉 https://ai.maxy.academy/umkm-budget/"
    echo "========================================================"
else
    echo "❌ Uji sintaks gagal. Mengembalikan backup otomatis..."
    if [ -n "$BAK_FILE" ] && [ -f "$BAK_FILE" ]; then
        cp "$BAK_FILE" "$CONF_FILE"
        systemctl reload apache2
        echo "🛡️  Konfigurasi asli berhasil dikembalikan."
    fi
fi
