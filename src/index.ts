import dotenv from 'dotenv';
dotenv.config(); // Must be at the top

import app from './app';
import config from './config';

app.listen(config.port, () => {
  console.log(`🚀 Server is running on port ${config.port}`);
});