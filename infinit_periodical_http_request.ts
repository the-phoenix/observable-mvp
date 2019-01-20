import Chance from 'chance';

// @ts-ignore
import { interval, Subject, of, throwError, Observable, timer } from 'rxjs' 

// @ts-ignore
import { flatMap, map, takeUntil, delay, retryWhen, retry, switchMap, tap, finalize, take, concat, mergeMap, expand, takeWhile, share } from 'rxjs/operators'
// @ts-ignore
import { genericRetryStrategy } from './utils/retry-strategy'

// @ts-ignore
const _config = {
  UPDATE_INTERVAL: 3000
}

const chance = new Chance();

function getHttpMockedObservable(prefix: string) {
  const rand = Math.random();

  const mockedResponse = {
    status: 200,
    data: `Success ${prefix}: ${rand}`
  }

  // @ts-ignore
  const mockedError = {
    status: 500,
    message: `Failure ${prefix}: ${rand}`
  }

  const isSuccess = rand < 0.3
  console.log(`Request ${prefix}: ${isSuccess}, ${rand}`);

  return (
    isSuccess
      ? of(mockedResponse).pipe(delay(1000 * Math.random()))
      // : throwError(mockedError).pipe(delay(1000 * Math.random()))
      : of(mockedResponse).pipe(delay(1000 * Math.random()))
  )
}

const getFetchWithRetryStrategy = (prefix: any) => of(null)
  .pipe(
    mergeMap(() => getHttpMockedObservable(prefix)),
    retryWhen(genericRetryStrategy({
      maxRetryAttempts: 5,
      scalingDuration: 2000,
      excludedStatusCodes: [404]
    }))
  )

// @ts-ignore
const getPeriodicalFetch = (stopNotifier: Observable<any>) => 
  interval(_config.UPDATE_INTERVAL)
  .pipe(
    // switchMap(() => getFetchWithRetryStrategy()),
    mergeMap((val) => getFetchWithRetryStrategy(val)),
    takeUntil(stopNotifier),
    finalize(() => console.log('Finally finished!'))
  )

const getInfiniteFetchWithDelay = (stopNotifier: Observable<any>) => of(null)
  .pipe(
    mergeMap(()=> getFetchWithRetryStrategy(chance.first())),
    expand(d => 
      timer(_config.UPDATE_INTERVAL).pipe(
        mergeMap(()=> getFetchWithRetryStrategy(chance.first())),
      )
    ),
    takeUntil(stopNotifier),
    share()
  )
  
const stopNotifier = new Subject();

// @ts-ignore
const infiniteObservable = getInfiniteFetchWithDelay(stopNotifier)

infiniteObservable
  .pipe(
    map((d, i) => { console.log(`${i}th response`, d); return d; })
  )
  .subscribe({
    next: x => console.log('A onNext:', x),
    error: err => console.error('A onError: ', err),
    complete: () => console.log('A onCompleted:'),
  })

setTimeout(() => {
  console.log('Send Stop Notification!')
  stopNotifier.next('stop')
  // infiniteObservable
  //   .subscribe({
  //     next: x => console.log('B onNext:', x),
  //     error: err => console.error('B onError: ', err),
  //     complete: () => console.log('B onCompleted:'),
  //   })
}, 20000)