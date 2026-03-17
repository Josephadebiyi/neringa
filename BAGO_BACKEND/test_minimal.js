import { createServer } from 'http';
const server = createServer((req, res) => {
  res.end('ok');
});
const port = 54321;
server.listen(port, () => {
  console.log(`Server listening on ${port}`);
  setTimeout(() => process.exit(0), 1000);
});
server.on('error', (err) => {
  console.error('SERVER ERROR:', err);
  process.exit(1);
});
