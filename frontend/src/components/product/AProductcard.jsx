import React from "react";
import { Link } from "react-router-dom";
import { formatIndianRupee } from "@/utils/currency";

const AProductCard = ({ product }) => {
  return (
    <Link to={`/admin/products/${product._id}`} className="group block">
      <div className="overflow-hidden rounded-xl bg-white shadow-lg border border-gray-200 transition-all duration-300 group-hover:shadow-2xl">
        
        {/* Product Image */}
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-t-xl">
          <img
            src={product.imageUrl.startsWith("http") ? product.imageUrl : `http://localhost:5000${product.imageUrl}`}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Product Details */}
        <div className="p-4">
          {/* Name Truncation */}
          <h3 className="text-lg font-semibold text-gray-900 truncate w-full transition-colors duration-300 group-hover:text-black">
            {product.name}
          </h3>

          <div className="flex items-center gap-2 mt-2">
            <p className="text-lg font-bold text-black">{formatIndianRupee(product.price)}</p>
            {product.originalPrice && (
              <p className="text-sm text-gray-500 line-through">{formatIndianRupee(product.originalPrice)}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AProductCard;
