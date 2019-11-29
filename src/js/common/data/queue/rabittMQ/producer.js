const {createChannel} = require('./confirmChannel');
const logger = require('../../../helpers/logger');

const createProducer = async (queue, error, close) => {
  try {
    const channel = await createChannel(queue);

    channel.on('error', err => {
      logger.error(`[AMQP] channel error due to ${err.message}`);
      error(err);
    });

    channel.on('close', () => {
      logger.info('[AMQP] channel closed');
      close();
    });

    return channel;
  }
  catch(error) {
    throw new Error(`Could not create a new rabittmq producer due to ${error.message}`);
  }
};

const produce = (channel, queue, message) => new Promise((resolve, reject) => {
  const content = Buffer.from(JSON.stringify(message));

  channel.sendToQueue(
    queue,
    content,
    {persistent: true},
    (error, ok) => {
      if(error) {
        logger.error(`producer: messsage nacked t ${JSON.stringify(message)}`);
        return reject(error);
      }

      logger.info(`producer: messsage acked ${JSON.stringify(message)}`);
      resolve(ok);
    }
  );
});

module.exports = {
  createProducer,
  produce
};
