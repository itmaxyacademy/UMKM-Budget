#!/usr/bin/env bash
set -e

# ==============================================================================
# One-Click Deploy Script untuk UMKM Budget -> ai.maxy.academy
# ==============================================================================

VPS_HOST="root@168.144.33.64"
REMOTE_DIR="/var/www/html/ai.maxy.academy/UMKM-Budget"
REMOTE_ALIAS="/var/www/html/ai.maxy.academy/umkm-budget"

echo "=========================================="
echo "🚀 Memulai Deployment UMKM Budget..."
echo "=========================================="

# 1. Pastikan build terbaru sudah selesai
echo "🔨 [1/4] Build bundle produksi..."
npm run build

# 2. Kemas dist ke tar.gz agar transfer via SSH/SCP cepat dan utuh
echo "📦 [2/4] Mengemas bundle ke dist.tar.gz..."
tar -czf dist.tar.gz -C dist .

# 3. Transfer dan ekstrak di VPS
echo "📤 [3/4] Mengirim file ke VPS $VPS_HOST..."
ssh "$VPS_HOST" "mkdir -p $REMOTE_DIR"
scp dist.tar.gz "$VPS_HOST:$REMOTE_DIR/"

echo "📂 [4/4] Ekstraksi & konfigurasi symlink..."
ssh "$VPS_HOST" "tar -xzf $REMOTE_DIR/dist.tar.gz -C $REMOTE_DIR && rm -f $REMOTE_DIR/dist.tar.gz && ln -sfn $REMOTE_DIR $REMOTE_ALIAS && chmod -R 755 $REMOTE_DIR"

rm -f dist.tar.gz

echo "=========================================="
echo "✅ Deployment Selesai!"
echo "🌐 Kunjungi aplikasi di:"
echo "   - https://ai.maxy.academy/UMKM-Budget/"
echo "   - https://ai.maxy.academy/umkm-budget/"
echo "=========================================="
