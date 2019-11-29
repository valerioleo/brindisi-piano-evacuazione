const Kafka = require('node-rdkafka')
const {Observable} = require('rxjs')
const logger = require('../../helpers/logger')
const {duration} = require('../../helpers/time')

const createProducer = () => new Promise((resolve, reject) => {
  const globalConf = {
    'metadata.broker.list': process.env.KAFKA_BROKER,
    'queue.buffering.max.ms': 100,
    'compression.codec': 'lz4',
    'message.send.max.retries': 10,
    'heartbeat.interval.ms': 5000,
    'debug': 'msg',
    'dr_cb': true,
    'dr_msg_cb': true
  };

  const topicConf = {
  };

  const producer = new Kafka.Producer(globalConf, topicConf);

  producer.connect();

  // poll for delivery reports
  setInterval(() => producer.poll(), duration.seconds(1))

  producer.on('ready', args => {
    logger.info(`producer ready. ${JSON.stringify(args)}`);
    resolve(producer);
  });

  producer.on('connection.failure', args => {
    logger.info(`producer connection failure. ${JSON.stringify(args)}`);
    reject(args);
  })
})

const produce = (producer, topic, key, message) => new Promise((resolve, reject) => {
  try {
    producer.produce(
      topic,
      // optionally we can manually specify a partition for the message
      // this defaults to -1 - which will use librdkafka's default partitioner (consistent random for keyed messages, random for unkeyed messages)
      null,
      // Message to send. Must be a buffer
      new Buffer(JSON.stringify(message)),
      // for keyed messages, we also specify the key - note that this field is optional
      key,
      // ts
      Date.now()
    )

    resolve();
  }
  catch(error) {
    reject(error);
  }
})

const listen = producer => new Observable(subscriber => {
  // make sure we never subscribe to event for the same consumer instance
  if(producer.listenerCount('data') === 0) {
    producer.on('delivery-report', (err, report) => {
      if(err) return subscriber.error(err);
      return subscriber.next(report);
    })  
    .on('disconnected', () => subscriber.complete())
    .on('event.log', data => {
      logger.info(`Producer event.log ${JSON.stringify(data)}`);
    })
    .on('event.error', error => {
      logger.error(`Could not push a new message to the queue due to ${error}`)
    });
  }
})

module.exports = {
  createProducer, 
  produce,
  listen
}
