import { useEffect, useState } from "react";
import { getErrorMessage } from "@/services/apiClient";

export function useResource(load, key) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const finish = (value) => {
      if (!controller.signal.aborted) setResult({ key, load, version, ...value });
    };
    load(controller.signal).then(
      (data) => finish({ data }),
      (error) => finish({ error: getErrorMessage(error) }),
    );
    return () => controller.abort();
  }, [load, key, version]);

  const current = result?.key === key && result.load === load && result.version === version ? result : null;
  return { ...current, loading: Boolean(key && !current), reload: () => setVersion((n) => n + 1) };
}
