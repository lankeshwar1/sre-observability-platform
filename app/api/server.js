const express = require("express");
const client = require("prom-client");

const {
  connectRabbitMQ,
  getChannel,
  getQueueName
} = require("./rabbitmq");

const app = express();
const PORT = process.env.PORT || 3000;
client.collectDefaultMetrics();
app.use(express.json());

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "api"
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Enterprise SRE Platform API"
  });
});

app.post("/jobs", (req, res) => {
  const channel = getChannel();
  const queue = getQueueName();

  const job = {
    id: Date.now(),
    type: req.body.type || "example-job",
    createdAt: new Date().toISOString()
  };

  channel.sendToQueue(
    queue,
    Buffer.from(JSON.stringify(job)),
    {
      persistent: true
    }
  );

  res.status(202).json({
    message: "Job queued successfully",
    job
  });
});

async function startServer() {
  try {
    await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start API:", error.message);
    process.exit(1);
  }
}

startServer();