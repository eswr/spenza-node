const app = require('./app');
const connectDB = require('./config/db');
const webhookQueue = require('./queues/webhookQueue');

const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;
