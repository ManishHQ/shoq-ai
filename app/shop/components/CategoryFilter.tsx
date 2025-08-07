import { Category } from '../page';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            name="category"
            value=""
            checked={selectedCategory === ''}
            onChange={() => onCategoryChange('')}
            className="mr-2"
          />
          All Categories
        </label>
        {categories.map((category) => (
          <label key={category.id} className="flex items-center">
            <input
              type="radio"
              name="category"
              value={category.name}
              checked={selectedCategory === category.name}
              onChange={() => onCategoryChange(category.name)}
              className="mr-2"
            />
            {category.name} ({category.count})
          </label>
        ))}
      </div>
    </div>
  );
}