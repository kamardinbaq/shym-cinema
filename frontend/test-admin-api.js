const http = require('http');

async function test() {
  // Start dev server in the background
  const { spawn } = require('child_process');
  const server = spawn('npm', ['run', 'dev'], { cwd: process.cwd(), stdio: 'ignore' });
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: process.env.ROOT_ADMIN_USERNAME, password: process.env.ROOT_ADMIN_PASSWORD })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);
    
    const cookie = loginRes.headers.get('set-cookie');
    
    // 2. Fetch settings
    const settingsRes = await fetch('http://localhost:3000/api/admin/settings', {
      headers: { 'Cookie': cookie }
    });
    const settingsData = await settingsRes.json();
    console.log('Settings:', settingsData);
  } catch (err) {
    console.error(err);
  } finally {
    server.kill();
  }
}

require('dotenv').config({ path: '.env.local' });
test();
