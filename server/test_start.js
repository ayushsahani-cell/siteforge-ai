const { exec } = require('child_process');
const fs = require('fs');
const child = exec('npm run dev', { cwd: 'd:\\code\\ai-website-builder\\server' });
let out = 'Starting...\n';
child.stdout.on('data', d => { out += d; fs.writeFileSync('d:\\code\\ai-website-builder\\server\\test_out.txt', out); });
child.stderr.on('data', d => { out += d; fs.writeFileSync('d:\\code\\ai-website-builder\\server\\test_out.txt', out); });
setTimeout(() => { child.kill(); process.exit(0); }, 3000);
