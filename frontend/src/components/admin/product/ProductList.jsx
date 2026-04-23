import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductList = ({ category }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/products/category/${category}`);
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    if (category) fetchProducts();
  }, [category]);

  return (
    <div>
      <h2>Products in {category}</h2>
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <ul>
          {products.map((product) => (
            <li key={product._id}>
              <strong>{product.name}</strong> - ${product.price}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductList;
