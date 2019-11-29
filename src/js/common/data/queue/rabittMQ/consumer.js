const {createChannel} = require('./channel')
const {Observable} = require('rxjs')
const throttle = require('lodash.throttle')
const {duration} = require('../../../helpers/time')
const logger = require('../../../helpers/logger')

const createConsumer = async (
  queue, 
  error,
  close,
  prefetchCount=1
) => {
  const channel = await createChannel(queue);

  channel.on('error', err => {
    logger.error(`[AMQP] channel error due to ${err.message}`);
    error(err);
  });

  channel.on('close', () => {
    logger.info('[AMQP] channel closed');
    close();
  });
  
  await channel.prefetch(prefetchCount);

  return channel;
}

const closeChannel = async channel => {
  if(channel) {
    try {
      await channel.close();
    }
    catch(err) {
      logger.error(`Could not close channel due to ${err.message}`);
    }
  }
}

const reconnect = async (channel, queue, prefetchCount) => {
  try {
    await closeChannel(channel);
    return createConsumer(queue, prefetchCount);
  }
  catch(err) {
    logger.error(`Error reconnecting to the channel ${queue} due to ${err.message}`);
  }
}

const unwrapMessage = message => JSON.parse(message.content.toString());

const listen = (channel, queue, consumerTag) => new Observable(subscriber => {
  try {
    const options = {consumerTag};
    const handler = message => {
      if (message !== null) {
        subscriber.next(message);
      }
    }

    channel.consume(queue, throttle(handler, duration.seconds(1)), options);

    return () => {
      closeChannel(channel);
    }
  }
  catch(err) {
    logger.error(`Could not consume message due to ${err.message}`);
    subscriber.error(err);
  }
})

const ack = (channel, message)=> {
  channel.ack(message);
}

const nack = (channel, message)=> {
  channel.reject(message, true);
}

const nackAll = channel=> {
  channel.nackAll();
}


module.exports = {
  createConsumer,
  reconnect,
  listen, 
  ack,
  nack,
  nackAll,
  unwrapMessage,
  closeChannel
}
