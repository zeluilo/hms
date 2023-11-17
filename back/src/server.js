// In your Express server (server.js or app.js)
const express = require('express');
const app = express();
const port = 3001;

app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
