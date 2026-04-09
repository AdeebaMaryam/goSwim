import { useState, useEffect } from 'react';
import api from '../utils/api';

export const usePoolData = (poolId) => {
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPool = async () => {
      try {
        const response = await api.get(`/pools/${poolId}`);
        setPool(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (poolId) {
      fetchPool();
    }
  }, [poolId]);

  return { pool, loading, error };
};