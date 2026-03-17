import { createServer } from 'http';
const server = createServer((req, res) => {
  res.end('ok');
});
server.listen(3000, '127.0.0.1', () => {
  console.log('Test server listening on 3000');
  process.exit(0);
});
server.on('error', (err) => {
  console.error('Test server error:', err);
  process.exit(1);
});
