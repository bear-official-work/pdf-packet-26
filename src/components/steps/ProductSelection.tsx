import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils';
import type { ProductType } from '@/types';

interface ProductSelectionProps {
  productType?: ProductType;
  onUpdateProductType: (productType: ProductType) => void;
  onNext: () => void;
}

export default function ProductSelection({
  productType: initialProductType,
  onUpdateProductType,
  onNext,
}: ProductSelectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductType | undefined>(initialProductType);

  const handleProductSelect = (product: ProductType) => {
    setSelectedProduct(product);
    onUpdateProductType(product);
  };

  const handleContinue = () => {
    if (selectedProduct) {
      onNext();
    }
  };

  const products = [
    {
      id: 'structural-floor' as ProductType,
      name: 'Structural Floor Panel',
      description: 'MAXTERRA® MgO Non-Combustible Structural Floor Panels',
    },
    {
      id: 'underlayment' as ProductType,
      name: 'Underlayment Panel',
      description: 'MAXTERRA® MgO Fire- And Water-Resistant Underlayment Panels',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl mx-auto"
    >
      <div className="card p-8 lg:p-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-display text-secondary-900 dark:text-white mb-3">
            Select Product Type
          </h2>
          <p className="text-secondary-800 dark:text-gray-300 max-w-2xl mx-auto">
            Choose the product type for your submittal form. This will determine available options in the next steps.
          </p>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
          {products.map((product) => {
            const isSelected = selectedProduct === product.id;
            
            return (
              <motion.button
                key={product.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleProductSelect(product.id)}
                className={cn(
                  'relative p-6 rounded-xl border-2 transition-all duration-300 text-left',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                    : 'border-gray-200 bg-white dark:bg-secondary-900 dark:border-secondary-700 hover:border-primary-300 hover:shadow-md'
                )}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4"
                  >
                    <CheckCircleIcon className="w-8 h-8 text-primary-500" />
                  </motion.div>
                )}

                {/* Product Info */}
                <div className="pr-12">
                  <h3 className={cn(
                    'text-xl font-bold font-display mb-2',
                    isSelected
                      ? 'text-primary-500 dark:text-primary-400'
                      : 'text-secondary-900 dark:text-white'
                  )}>
                    {product.name}
                  </h3>
                  <p className="text-sm text-secondary-700 dark:text-gray-400">
                    {product.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-center pt-8 border-t border-gray-200 dark:border-secondary-800">
          <motion.button
            onClick={handleContinue}
            disabled={!selectedProduct}
            whileHover={selectedProduct ? { scale: 1.02 } : {}}
            whileTap={selectedProduct ? { scale: 0.98 } : {}}
            className={cn(
              'btn btn-primary btn-lg min-w-48',
              !selectedProduct && 'opacity-50 cursor-not-allowed'
            )}
          >
            Continue to Project Details
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

