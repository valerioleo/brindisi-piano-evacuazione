const amqplib = require('amqplib');

const createChannel = async queue => {
  try {
    const options = {
      protocol: 'amqp',
      hostname: process.env.RABBIT_MQ_HOST_NAME,
      port: 5672,
      username: process.env.RABBITMQ_DEFAULT_USER,
      password: process.env.RABBITMQ_DEFAULT_PASS,
      locale: 'en_US',
      frameMax: 0,
      heartbeat: 0,
      vhost: process.env.RABBITMQ_DEFAULT_VHOST
    };

    const connection = await amqplib.connect(options);
    const channel = await connection.createConfirmChannel();
    await channel.assertQueue(queue, {durable: true, noAck: false});

    return channel;
  }
  catch(error) {
    throw new Error(`Could not create a new rabittmq channel ${queue} due to ${error.message}`);
  }
};

module.exports = {createChannel};
