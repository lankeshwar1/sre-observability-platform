const amqp = require("amqplib");

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://localhost:5672";

const QUEUE_NAME =
  process.env.RABBITMQ_QUEUE || "sre-jobs";

async function startWorker() {
  const maxRetries = 10;
  const retryDelay = 3000;

  let connection;
  let channel;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

      await channel.assertQueue(QUEUE_NAME, {
        durable: true
      });

      console.log(`Worker listening on queue: ${QUEUE_NAME}`);

      channel.consume(QUEUE_NAME, (message) => {
        if (!message) {
          return;
        }

        const job = JSON.parse(message.content.toString());

        console.log("Processing job:", job);

        channel.ack(message);
      });

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

startWorker().catch((error) => {
  console.error("Worker failed:", error.message);
  process.exit(1);
});