const Kafka = require('node-rdkafka')
const {Observable} = require('rxjs')
const logger = require('../../helpers/logger')
const {noop} = require('../../fn')
const {duration} = require('../../helpers/time')

const createConsumer = (topic, clientId) => new Promise((resolve) => {
  const handleCommit = (error, topicPartitions) => {
    if(error) {
      return logger.error(`There was an error commiting due to ${error}`)
    }

    logger.info(`Commit went through with the following partitions ${JSON.stringify(topicPartitions)}`)
  }

  const handleRebalance = function (error, assignment) {
    if (error.code === Kafka.CODES.ERRORS.ERR__ASSIGN_PARTITIONS) {
      // Note: this can throw when you are disconnected. Take care and wrap it in
      // a try catch if that matters to you
      this.assign(assignment);
    } 
    else if (error.code == Kafka.CODES.ERRORS.ERR__REVOKE_PARTITIONS){
      // Same as above
      this.unassign();
    } 
    else {
      // We had a real error
      logger.error(`Error rebalancing ${JSON.stringify(assignment)}  due to ${err}`);
    }
  }

  // https://github.com/edenhill/librdkafka/blob/0.11.1.x/CONFIGURATION.md
  const globalConf = {
    'metadata.broker.list': process.env.KAFKA_BROKER,
    'client.id': clientId,
    'group.id': 'contribution-group',
    'socket.keepalive.enable': true,
    'queue.buffering.max.ms':10,
    'debug': 'queue',
    'auto.commit.enable': false,
    'enable.auto.offset.store': false,
    'offset_commit_cb': handleCommit,
    'rebalance_cb': handleRebalance
  };

  const topicConf = {
    'auto.offset.reset': 'beginning'
  };

  const consumer = new Kafka.KafkaConsumer(globalConf, topicConf);

  consumer.connect();
  consumer.on('ready', args => {
    logger.info(`consumer ready. ${JSON.stringify(args)}`);
    consumer.subscribe([topic]);
    
    setInterval(() => {
      consumer.consume(100), duration.seconds(10)
    }, duration.seconds(1));
    resolve(consumer);
  });
})

const listen = (consumer, topic, checkIfFinished=noop) => new Observable(subscriber => {
  // make sure we never subscribe to event for the same consumer instance
  if(consumer.listenerCount('data') === 0) {
    checkIfFinished(subscriber.complete.bind(subscriber));
    
    consumer
      .on('data', data => subscriber.next(data))
      .on('disconnected', () => {
        logger.info('Consumer disconnected')
      })
      .on('subscribed', () => {
        logger.info('Consumer subscribed')
      })
      .on('unsubscribe', () => {
        logger.info('Consumer unsubscribed')
      })
      .on('event.log', data => {
        logger.info(`Consumer event.log ${JSON.stringify(data)}`);
      })
      .on('event.throttle', data => {
        logger.info(`Consumer event.throttle ${JSON.stringify(data)}`);
      })
      .on('event.error', error => {
        logger.error(`Could not consume a message from the queue due to ${error}`);
      });
  }
  else {
    // in case there is an error just reconnect
    reconnect(consumer, topic);
  }
});

const commit = (consumer, message) => {
  const data = JSON.parse(message.value);
  const ref = data.txHash;

  logger.info(`Commiting message ${ref} at offset ${message.offset}`);
  consumer.commitMessage(message);
}

const reconnect = (consumer, topic) => {
  consumer.unsubscribe();
  consumer.subscribe([topic]);
}

module.exports = {
  createConsumer,
  listen, 
  commit
}
