const amqp = require("amqplib");

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const QUEUE_NAME = process.env.RABBITMQ_QUEUE || "sre-jobs";

let connection;
let channel;

async function connectRabbitMQ() {
  const maxRetries = 10;
  const retryDelay = 3000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

      await channel.assertQueue(QUEUE_NAME, {
        durable: true
      });

      console.log(`Connected to RabbitMQ queue: ${QUEUE_NAME}`);
      return;
    } catch (error) {
      console.error(
        `RabbitMQ connection attempt ${attempt}/${maxRetries} failed: ${error.message}`
      );

      if (attempt === maxRetries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

function getChannel() {
  return channel;
}

function getQueueName() {
  return QUEUE_NAME;
}

module.exports = {
  connectRabbitMQ,
  getChannel,
  getQueueName
};