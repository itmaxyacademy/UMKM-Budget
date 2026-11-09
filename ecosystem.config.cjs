module.exports = {
  apps: [{
    name: 'umkm-budget-api',
    script: 'dist/server.cjs',
    cwd: '/var/www/html/ai.maxy.academy/repo-umkm-budget',
    env: {
      NODE_ENV: 'production',
      PORT: 3040,
      VITE_BASE_PATH: '/umkm-budget/',
      BASE_PATH: '/umkm-budget'
    }
  }]
};
