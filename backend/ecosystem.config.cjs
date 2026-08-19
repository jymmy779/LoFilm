module.exports = {
  apps: [
    {
      name: "lofilm-backend",
      script: "dist/server.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "250M",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    }
  ]
};
