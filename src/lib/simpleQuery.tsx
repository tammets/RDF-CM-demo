import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type QueryKey = readonly unknown[];

type ListenerEvent = "updated" | "invalidated";

type Listener = (event: ListenerEvent) => void;

export class QueryClient {
  private cache = new Map<string, unknown>();
  private listeners = new Map<string, Set<Listener>>();

  private serialize(key: QueryKey) {
    return JSON.stringify(key ?? []);
  }

  private getListeners(hash: string) {
    if (!this.listeners.has(hash)) {
      this.listeners.set(hash, new Set());
    }
    return this.listeners.get(hash)!;
  }

  private emit(hash: string, event: ListenerEvent) {
    const listeners = this.listeners.get(hash);
    if (!listeners) return;
    for (const listener of listeners) {
      listener(event);
    }
  }

  getQueryData<T>(queryKey: QueryKey): T | undefined {
    return this.cache.get(this.serialize(queryKey)) as T | undefined;
  }

  setQueryData<T>(queryKey: QueryKey, data: T) {
    const hash = this.serialize(queryKey);
    this.cache.set(hash, data);
    this.emit(hash, "updated");
  }

  hasQuery(queryKey: QueryKey): boolean {
    return this.cache.has(this.serialize(queryKey));
  }

  invalidateQueries({ queryKey }: { queryKey: QueryKey }) {
    const hash = this.serialize(queryKey);
    this.emit(hash, "invalidated");
  }

  subscribe(queryKey: QueryKey, listener: Listener) {
    const hash = this.serialize(queryKey);
    const listeners = this.getListeners(hash);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(hash);
      }
    };
  }
}

type QueryClientContextValue = QueryClient;

const QueryClientContext = createContext<QueryClientContextValue | null>(null);

type QueryClientProviderProps = {
  client: QueryClient;
  children: ReactNode;
};

export function QueryClientProvider({ client, children }: QueryClientProviderProps) {
  return <QueryClientContext.Provider value={client}>{children}</QueryClientContext.Provider>;
}

export function useQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  if (!client) {
    throw new Error("useQueryClient must be used inside a QueryClientProvider");
  }
  return client;
}

type UseQueryOptions<TData> = {
  queryKey: QueryKey;
  queryFn: () => Promise<TData> | TData;
  initialData?: TData;
};

type UseQueryResult<TData> = {
  data: TData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<void>;
};

export function useQuery<TData>({
  queryKey,
  queryFn,
  initialData,
}: UseQueryOptions<TData>): UseQueryResult<TData> {
  const keyHash = useMemo(() => JSON.stringify(queryKey), [queryKey]);
  const queryKeyRef = useRef<QueryKey>(queryKey);
  useEffect(() => {
    queryKeyRef.current = queryKey;
  }, [keyHash]);

  const queryClient = useQueryClient();
  const [state, setState] = useState<{
    data: TData | undefined;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: unknown;
  }>(() => {
    if (queryClient.hasQuery(queryKey)) {
      return {
        data: queryClient.getQueryData<TData>(queryKey),
        isLoading: false,
        isFetching: false,
        isError: false,
        error: undefined,
      };
    }

    if (initialData !== undefined) {
      return {
        data: initialData,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: undefined,
      };
    }

    return {
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      error: undefined,
    };
  });

  const latestQueryFn = useRef(queryFn);
  latestQueryFn.current = queryFn;

  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runQuery = useCallback(async () => {
    const currentKey = queryKeyRef.current;
    setState((prev) => ({
      ...prev,
      isLoading: prev.data === undefined,
      isFetching: true,
      isError: false,
      error: undefined,
    }));
    try {
      const result = await Promise.resolve(latestQueryFn.current());
      if (!mountedRef.current) return;
      queryClient.setQueryData(currentKey, result);
      setState({
        data: result,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: undefined,
      });
    } catch (error) {
      if (!mountedRef.current) return;
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isFetching: false,
        isError: true,
        error,
      }));
    }
  }, [queryClient, keyHash]);

  useEffect(() => {
    const currentKey = queryKeyRef.current;
    if (!queryClient.hasQuery(currentKey)) {
      runQuery();
    }

    const unsubscribe = queryClient.subscribe(currentKey, (event) => {
      if (event === "invalidated") {
        runQuery();
      } else {
        setState((prev) => ({
          ...prev,
          data: queryClient.getQueryData<TData>(currentKey),
          isLoading: false,
          isFetching: false,
        }));
      }
    });

    return unsubscribe;
  }, [queryClient, keyHash, runQuery]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    isFetching: state.isFetching,
    isError: state.isError,
    error: state.error,
    refetch: runQuery,
  };
}

type MutationOptions<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData> | TData;
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: { queryClient: QueryClient },
  ) => void | Promise<void>;
  onError?: (
    error: unknown,
    variables: TVariables,
    context: { queryClient: QueryClient },
  ) => void | Promise<void>;
};

type MutationResult<TData, TVariables> = {
  mutate: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: unknown;
};

export function useMutation<TData, TVariables = void>({
  mutationFn,
  onSuccess,
  onError,
}: MutationOptions<TData, TVariables>): MutationResult<TData, TVariables> {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [error, setError] = useState<unknown>(undefined);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setStatus("pending");
      setError(undefined);
      try {
        const result = await Promise.resolve(mutationFn(variables));
        setStatus("success");
        await onSuccess?.(result, variables, { queryClient });
        return result;
      } catch (err) {
        setStatus("error");
        setError(err);
        await onError?.(err, variables, { queryClient });
        throw err;
      }
    },
    [mutationFn, onError, onSuccess, queryClient],
  );

  return {
    mutate,
    isPending: status === "pending",
    isSuccess: status === "success",
    isError: status === "error",
    error,
  };
}
