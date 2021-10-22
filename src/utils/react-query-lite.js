import {createContext, useContext, useRef, useEffect, useReducer} from 'react';

const QueryContext = createContext();

export function QueryClientProvider({children, client}) {
  useEffect(
    function () {
      function onFocus() {
        client.queries.forEach(function (query) {
          query.subscribers.forEach((subscriber) => subscriber.fetch());
        });
      }
      window.addEventListener('focus', onFocus);

      return function cleanup() {
        window.removeEventListener('focus', onFocus);
      };
    },
    [client]
  );
  return <QueryContext.Provider value={client}>{children}</QueryContext.Provider>;
}

export class QueryClient {
  constructor() {
    this.queries = [];
  }

  getQuery = ({queryKey, queryFn}) => {
    const queryHash = JSON.stringify(queryKey);
    let query = this.queries.find((query) => query.queryHash === queryHash);
    if (!query) {
      query = createQuery({queryKey, queryFn});
      this.queries.push(query);
    }
    return query;
  };
}

export function useQuery({queryKey, queryFn, staleTime}) {
  const client = useContext(QueryContext);
  const observerRef = useRef();
  const [_, rerender] = useReducer((i) => i + 1, 0);
  if (!observerRef.current) {
    observerRef.current = createQueryObserver(client, {queryKey, queryFn, staleTime});
  }

  useEffect(function () {
    return observerRef.current.start(rerender);
  }, []);

  return observerRef.current.getResult();
}

function createQuery({queryKey, queryFn}) {
  let query = {
    queryKey,
    queryHash: JSON.stringify(queryKey),
    subscribers: [],
    subscribe: function (subscriber) {
      query.subscribers.push(subscriber);
      return function unsubscribe() {
        query.subscribers = query.subscribers.filter((s) => subscriber !== s);
      };
    },
    promise: null,
    state: {
      status: 'loading',
      isFetching: true,
      data: undefined,
      error: undefined,
      lastUpdated: undefined
    },
    setState: function (updater) {
      query.state = updater(query.state);
      query.subscribers.forEach((subscriber) => subscriber.notify());
    },
    fetch: function () {
      if (!query.promise) {
        query.promise = (async function () {
          query.setState((oldState) => ({
            ...oldState,
            error: undefined,
            isFetching: true
          }));
          try {
            const data = await queryFn();
            query.setState((oldState) => ({
              ...oldState,
              status: 'success',
              lastUpdated: Date.now(),
              data
            }));
          } catch (error) {
            query.setState((oldState) => ({
              ...oldState,
              status: 'error',
              error
            }));
          } finally {
            query.promise = null;
            query.setState((oldState) => ({
              ...oldState,
              isFetching: false
            }));
          }
        })();
      }
      return query.promise;
    }
  };
  return query;
}

function createQueryObserver(client, {queryKey, queryFn, staleTime = 0}) {
  const query = client.getQuery({queryKey, queryFn});
  const observer = {
    notify: () => {},
    getResult: () => query.state,
    fetch: function () {
      const now = Date.now();
      if (!query.state.lastUpdated || now - query.state.lastUpdated > staleTime) {
        query.fetch();
      }
    },
    start: function (callback) {
      observer.notify = callback;
      const unsubscribe = query.subscribe(observer);
      observer.fetch();
      return unsubscribe;
    }
  };
  return observer;
}
