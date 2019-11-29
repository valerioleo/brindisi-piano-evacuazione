const {of, Observable} = require('rxjs')
const {catchError} = require('rxjs/operators')

// will make sure that the original stream will not die when one of the
// operators throws and error. 
const createErrorHandler = (
  stream$, 
  operators,
  errorHandler
) => stream$.pipe(
    ...operators,
    catchError(error => {
      errorHandler(error);
      return of(undefined);
    })
  ) 

const buffer = (size, time) => {
  const items = [];
  let observer;

  if(time) {
    setTimeout(() => {
      if(items.length > 0) {
        observer.next(items)
      }
    }, time);
  }

  return source => new Observable(observer => source.subscribe({
    next(value) {
      items.push(value);

      if (items.length === size)   {
        observer.next(items);
        items.length = 0;
      }
    },
    error(err) { 
      observer.error(err); 
    },
    complete() { 
      observer.complete(); 
    }
  }))
}
  
module.exports = {
  createErrorHandler,
  buffer
}
