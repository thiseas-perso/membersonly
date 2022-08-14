const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB_PWD = process.env.DB_PWD;
const DB = `mongodb+srv://thiseasmembersonly:${DB_PWD}@cluster0.ucoer68.mongodb.net/?retryWrites=true&w=majority`;
mongoose
  .connect(DB)
  .then(() => console.log('connercted to DB!'))
  .catch((err) => console.log(err));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}!!`);
});
