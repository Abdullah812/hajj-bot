module.exports = {
  apps: [{
    name: "company-bot",
    script: "bot.js",
    watch: true,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
} 