const express = require('express');
const Order = require('../models/Order');
const router = express.Router();
const kafka = require('kafka-node');
const auth = require('../../../shared/middleware/auth');

// Kafka configuration
const client = new kafka.KafkaClient({kafkaHost: process.env.KAFKA_BROKER});
const producer = new kafka.Producer(client);

producer.on('ready', () => {
  console.log('Kafka Producer is connected and ready.');
});

producer.on('error', (err) => {
  console.error('Kafka Producer error:', err);
});

// Create order - now requires auth
router.post('/create', auth(), async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Use the user ID from the authenticated token
    const userId = req.user.id;
    
    const order = new Order({ 
      userId, 
      productId, 
      quantity, 
      status: 'Pending',
      orderDate: new Date(),
      lastUpdated: new Date()
    });
    
    await order.save();

    // Send to Kafka
    const payloads = [{
      topic: 'order-created',
      messages: JSON.stringify({
        userId: order.userId,
        productId: order.productId,
        quantity: order.quantity,
        status: order.status,
        orderDate: order.orderDate,
        lastUpdated: order.lastUpdated,
        _id: order._id
      })
    }];

    producer.send(payloads, (err, data) => {
      if (err) {
        console.error('Failed to produce Kafka message:', err);
      } else {
        console.log('Order sent to Kafka:', data);
      }
    });

    res.status(201).send(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).send({ error: 'Failed to create order' });
  }
});

// Get orders - now filtered by user ID from token
router.get('/orders', auth(), async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id });
    res.status(200).send(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;
