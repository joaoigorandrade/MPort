import { useState, useEffect, useCallback } from 'react';
import { fetchCryptoPrices } from '../services/cryptoService';

export const useCryptoPrices = () => {
  const [prices, setPrices] = useState({});
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const getPrices = useCallback(async () => {
    setLoading(true);
    try {
      const priceData = await fetchCryptoPrices();
      setPrices(priceData);
      setLastUpdate(new Date());

      setPriceHistory(prev => {
        const newEntry = { time: new Date().toLocaleTimeString(), ...priceData };
        const updated = [...prev, newEntry].slice(-20);
        return updated;
      });
    } catch (error) {
      // Error handling is already in cryptoService, but we can log here if needed
      console.error("Error fetching crypto prices:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getPrices();
    const interval = setInterval(getPrices, 60000);
    return () => clearInterval(interval);
  }, [getPrices]);

  return {
    prices,
    priceHistory,
    loading,
    lastUpdate,
    fetchPrices: getPrices, // Renaming for clarity in App.js
  };
};
