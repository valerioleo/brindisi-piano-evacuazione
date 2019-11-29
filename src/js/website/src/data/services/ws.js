import {Observable} from 'rxjs'

export const open = wsUri => new Observable(subscriber => {
  const ws = new WebSocket(wsUri);
  const send = message => ws.send(message);

  ws.onmessage = evt => subscriber.next(evt);
  ws.onerror = evt => subscriber.error(evt);
  ws.onclose = evt => subscriber.complete(evt); 
  ws.onopen = evt => subscriber.next(send);
})
