import { useState } from "react";

export function useAsyncAction(action) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (...args) => {
    setLoading(true);
    setError("");
    try {
      return await action(...args);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { run, loading, error };
}

