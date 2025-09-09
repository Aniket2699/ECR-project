const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from sample-node-app', time: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
