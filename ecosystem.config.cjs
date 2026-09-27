const path = require('node:path');

const root = __dirname;

module.exports = {
  apps: [
    {
      name: 'educore-api',
      script: 'src/server.js',
      cwd: path.join(root, 'school-role-based-backend'),
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
    },
  ],
};
