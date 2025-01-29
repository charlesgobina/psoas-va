import express from 'express';
import router from './routes/route.js';
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to Ouluva API');
});

app.use(router);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});