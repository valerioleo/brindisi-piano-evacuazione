/* eslint-disable import/prefer-default-export */
export const groupEventsByEventParam = (events, key) => events.reduce((allEvents, event) => {
  const param = event.returnValues[key];

  const eventData = {
    type: event.event,
    sender: event.txData.from,
    blockNumber: event.blockNumber,
    logIndex: event.logIndex,
    txHash: event.transactionHash,
    eventParams: event.returnValues
  };

  const accountEvents = allEvents[param]
    ? allEvents[param].concat([eventData]).sort((e1, e2) => e2.blockNumber - e1.blockNumber)
    : [eventData];

  return {
    ...allEvents,
    [param]: accountEvents

  };
}, {});
