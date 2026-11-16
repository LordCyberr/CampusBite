import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext(null);

export const USD_TO_INR_RATE = 83.5;

export const formatPriceWithMode = (usdAmount, mode = 'inr') => {
  const num = Number(usdAmount) || 0;
  const usdStr = `$${num.toFixed(2)}`;
  const inrVal = Math.round(num * USD_TO_INR_RATE);
  const inrStr = `₹${inrVal.toLocaleString('en-IN')}`;

  if (mode === 'inr') return inrStr;
  if (mode === 'usd') return usdStr;
  // Dual mode: Indian Rupees FIRST, then USD in parentheses
  return `${inrStr} (${usdStr})`;
};

export const CurrencyProvider = ({ children }) => {
  // Mode can be 'inr', 'both', or 'usd' (defaults to 'inr' for authentic Indian campus experience)
  const [currencyMode, setCurrencyMode] = useState(() => {
    return localStorage.getItem('campusbite_currency_mode') || 'inr';
  });

  useEffect(() => {
    localStorage.setItem('campusbite_currency_mode', currencyMode);
  }, [currencyMode]);

  const formatPrice = (usdAmount, overrideMode = null) => {
    return formatPriceWithMode(usdAmount, overrideMode || currencyMode);
  };

  const getUsd = (usdAmount) => `$${(Number(usdAmount) || 0).toFixed(2)}`;
  const getInr = (usdAmount) => `₹${Math.round((Number(usdAmount) || 0) * USD_TO_INR_RATE).toLocaleString('en-IN')}`;

  return (
    <CurrencyContext.Provider value={{ currencyMode, setCurrencyMode, formatPrice, getUsd, getInr, USD_TO_INR_RATE }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      currencyMode: 'both',
      setCurrencyMode: () => {},
      formatPrice: (amount) => formatPriceWithMode(amount, 'both'),
      getUsd: (amount) => `$${(Number(amount) || 0).toFixed(2)}`,
      getInr: (amount) => `₹${Math.round((Number(amount) || 0) * USD_TO_INR_RATE).toLocaleString('en-IN')}`,
      USD_TO_INR_RATE,
    };
  }
  return context;
};
