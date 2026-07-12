import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currencyCode: string;
  className?: string;
  placeholder?: string;
}

export function CurrencyInput({ value, onChange, currencyCode, className, placeholder }: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const formatWithDelimiters = (val: string) => {
    const numericStr = val.replace(/[^0-9]/g, '');
    if (!numericStr) return '';
    return Number(numericStr).toLocaleString('id-ID');
  };

  const [localValue, setLocalValue] = useState(formatWithDelimiters(value.toString()));

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(formatWithDelimiters(value.toString()));
    }
  }, [value, isFocused]);

  const displayValue = isFocused ? localValue : formatCurrency(value, currencyCode);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericStr = rawValue.replace(/[^0-9]/g, '');
    setLocalValue(formatWithDelimiters(numericStr));
    const numericValue = Number(numericStr);
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  return (
    <input
      type="text"
      value={displayValue === formatCurrency(0, currencyCode) && !isFocused && value === 0 ? '' : displayValue}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        const numericStr = localValue.replace(/[^0-9]/g, '');
        const numericValue = Number(numericStr);
        onChange(isNaN(numericValue) ? 0 : numericValue);
      }}
      className={className}
      placeholder={placeholder}
    />
  );
}
