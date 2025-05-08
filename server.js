import express from 'express';
import router from './routes/route.js';
const app = express();
const port = process.env.PORT || 3000;
import './cronos/apartment-update.js';
import './utils/watchers/apartment-number.js';


app.use(express.json());
app.use(router);

app.get('/', (req, res) => {
  res.send('Welcome to Ouluva API');
});


app.listen(port, () => {
  console.log(`Server is running on port localhost:${port}`);
});