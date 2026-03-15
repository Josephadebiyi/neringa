
import http from 'http';
const server = http.createServer((req, res) => {
  res.end('Hello');
});
const port = 8888;
server.listen(port, '127.0.0.1', () => {
  console.log(`Test server listening on 127.0.0.1:${port}`);
  process.exit(0);
});
server.on('error', (err) => {
  console.error('Test server error:', err);
  process.exit(1);
});
