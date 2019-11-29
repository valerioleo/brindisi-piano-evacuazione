const amqplib = require('amqplib');
const Maybe = require('folktale/maybe');
const {prop} = require('../../../fn');

let _connection = Maybe.Nothing();

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

const connection = () => _connection.matchWith({
  Just: prop('value'),
  Nothing: async () => {
    const conn = await amqplib.connect(options);
    _connection = Maybe.fromNullable(conn);
    return conn;
  }
});

const createChannel = async queue => {
  try {
    const conn = await connection();
    const channel = await conn.createChannel();
    await channel.assertQueue(queue, {durable: true, noAck: false, autoDelete: false});

    return channel;
  }
  catch(error) {
    throw new Error(`Could not create a new rabittmq channel ${queue} due to ${error.message}`);
  }
};

module.exports = {createChannel};
