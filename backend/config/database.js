const mongoose = require('mongoose');
const config = require('./app');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database.uri, config.database.options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

