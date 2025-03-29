const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const orderRoutes = require('./routes/orderRoutes');
const { KafkaClient, Consumer, Producer } = require('kafka-node');
const http = require('http');
const { Server } = require('socket.io');

// Load shared environment variables first
dotenv.config({ path: path.join(__dirname, '../../shared/.env') });
// Load service-specific environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use('/api/orders', orderRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// const kafkaClient = new KafkaClient({ kafkaHost: process.env.KAFKA_BROKER });
// const producer = new Producer(kafkaClient);

// producer.on('ready', () => {
//   console.log('Kafka Producer is connected and ready.');
// });

// producer.on('error', (err) => {
//   console.error('Kafka Producer error:', err);
// });

io.on('connection', (socket) => {
  console.log('a user connected');
});

server.listen(process.env.PORT, () => {
  console.log(`Order service running on port ${process.env.PORT}`);
});
