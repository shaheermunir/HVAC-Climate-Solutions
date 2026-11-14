module.exports = {
  apps: [
    {
      name: 'hvac-production-app',
      script: './server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        APP_URL: 'https://hvac.aspirinovation.com',
        DB_PORT: 3306,
        DB_NAME: 'u713584878_HVAC',
        DB_USER: 'u713584878_hvacuser',
        DB_HOST: 'srv537.hstgr.io',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
};
