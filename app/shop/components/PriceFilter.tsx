import { useState } from 'react';

interface PriceFilterProps {
  min: number;
  max: number;
  onPriceRangeChange: (min: number, max: number) => void;
}

export default function PriceFilter({ min, max, onPriceRangeChange }: PriceFilterProps) {
  const [minPrice, setMinPrice] = useState(min);
  const [maxPrice, setMaxPrice] = useState(max);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = parseInt(e.target.value) || 0;
    setMinPrice(newMin);
    onPriceRangeChange(newMin, maxPrice);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = parseInt(e.target.value) || 1000;
    setMaxPrice(newMax);
    onPriceRangeChange(minPrice, newMax);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Price Range</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Price: ${minPrice}
          </label>
          <input
            type="range"
            min="0"
            max="1000"
            step="5"
            value={minPrice}
            onChange={handleMinChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Price: ${maxPrice}
          </label>
          <input
            type="range"
            min="0"
            max="1000"
            step="5"
            value={maxPrice}
            onChange={handleMaxChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>$0</span>
          <span>$1000+</span>
        </div>
      </div>
    </div>
  );
}