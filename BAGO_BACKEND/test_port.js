import { createServer } from 'http';
const server = createServer((req, res) => {
  res.end('Hello World');
});
const PORT = 4001;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Test server running on port ${PORT}`);
  process.exit(0);
});
