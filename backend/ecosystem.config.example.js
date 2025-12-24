// PM2 Ecosystem Configuration File
// Copy this to ecosystem.config.js and customize as needed

module.exports = {
  apps: [{
    name: 'idream-backend',
    script: 'server.js',
    
    // Number of instances (use 'max' for all CPU cores, or specific number)
    instances: 2, // For cluster mode
    exec_mode: 'cluster', // 'cluster' or 'fork'
    
    // Environment variables (can also use .env file)
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Restart behavior
    autorestart: true,
    watch: false, // Set to true for development (auto-restart on file changes)
    max_memory_restart: '1G', // Restart if memory exceeds 1GB
    
    // Advanced options
    min_uptime: '10s', // Minimum uptime before considering app stable
    max_restarts: 10, // Maximum number of restarts within min_uptime
    restart_delay: 4000, // Delay between restarts (ms)
    
    // Graceful shutdown
    kill_timeout: 5000, // Time to wait before force kill (ms)
    listen_timeout: 3000, // Time to wait for app to start listening (ms)
    
    // Source map support (if using TypeScript/transpiled code)
    source_map_support: true
  }]
};

