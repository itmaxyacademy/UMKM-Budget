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
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value.toString());
    }
  }, [value, isFocused]);

  const displayValue = isFocused ? localValue : formatCurrency(value, currencyCode);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setLocalValue(rawValue);
    const numericValue = Number(rawValue.replace(/[^0-9.-]+/g, ''));
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  return (
    <input
      type={isFocused ? 'number' : 'text'}
      value={displayValue === formatCurrency(0, currencyCode) && !isFocused && value === 0 ? '' : displayValue}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        const numericValue = Number(localValue.replace(/[^0-9.-]+/g, ''));
        onChange(isNaN(numericValue) ? 0 : numericValue);
      }}
      className={className}
      placeholder={placeholder}
    />
  );
}
