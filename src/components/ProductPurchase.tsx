'use client';

import { useState } from 'react';
import PayPalButton from './PayPalButton';

interface ProductPurchaseProps {
  product: {
    id: string;
    price: number;
    isSold: boolean;
  };
}

export default function ProductPurchase({ product }: ProductPurchaseProps) {
  const [purchased, setPurchased] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  if (product.isSold) {
    return (
      <button disabled className="w-full bg-gray-300 text-gray-500 font-bold py-3 px-4 rounded cursor-not-allowed">
        This model has been sold
      </button>
    );
  }

  if (purchased) {
    return (
      <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center animate-fade-in">
        <h3 className="text-xl font-bold text-green-800 mb-2">Purchase Successful!</h3>
        <p className="text-green-700 mb-4">Thank you for your purchase.</p>
        <a 
          href={downloadUrl} 
          className="inline-block bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors shadow-md"
        >
          Download Model
        </a>
      </div>
    );
  }

  return (
    <PayPalButton 
      amount={product.price} 
      productId={product.id} 
      onSuccess={(data) => {
        console.log('Purchase successful:', data);
        setPurchased(true);
        if (data.downloadUrl) {
            setDownloadUrl(data.downloadUrl);
        }
      }}
    />
  );
}
