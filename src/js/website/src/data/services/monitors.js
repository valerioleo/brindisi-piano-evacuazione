import {interval} from 'rxjs';
import {concatMap, takeWhile} from 'rxjs/operators';
import {not} from 'Common/fn'
import {duration} from 'Common/helpers/time';
import {getTransactionReceipt} from 'EthUtils/core/v1/tx';

export const listenForReceipt = txHash => interval(duration.seconds(30))
  .pipe(
    concatMap(() => getTransactionReceipt(txHash)),
    takeWhile(not, true)
  );
