import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import ProductCard from "@/components/product/ProductCard";

import { useEffect, useState } from "react";

const Home = () => {
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products?isNewArrival=true");
        if (!response.ok) throw new Error("Failed to fetch new arrivals");
        const data = await response.json();
        setNewArrivals(data.products.slice(0, 8));
      } catch (error) {
        console.error("Error fetching new arrivals:", error);
      }
    };

    fetchNewArrivals();
  }, []);

  const [topSelling, setTopSelling] = useState([]);

  useEffect(() => {
    const fetchTopSelling = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/products?topSelling=true&limit=10"
        );
        if (!response.ok)
          throw new Error("Failed to fetch top selling products");
        const data = await response.json();
        const shuffledProducts = data.products.sort(() => 0.5 - Math.random());
        setTopSelling(shuffledProducts.slice(0, 8));
      } catch (error) {
        console.error("Error fetching top selling products:", error);
      }
    };

    fetchTopSelling();
  }, []);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-5 bg-white">
        <div className="container px-4 mx-auto">
          <div className="grid items-center grid-cols-1 gap-8 md:grid-cols-2">
            <div className="relative rounded-2xl overflow-hidden h-[600px]">
              <img
                src="/assets/Hero.png"
                alt="Fashion models"
                className="object-cover w-full h-full"
              />
            </div>

            <div className="space-y-8">
              <div className="flex justify-between">
                <div className="text-center">
                  <p className="text-4xl font-bold font-['Times_New_Roman']">
                    200+
                  </p>
                  <p className="text-gray-600 text-base font-['Times_New_Roman']">
                    International Brands
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold font-['Times_New_Roman']">
                    2,000+
                  </p>
                  <p className="text-gray-600 text-base font-['Times_New_Roman']">
                    High-Quality Products
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold font-['Times_New_Roman']">
                    30,000+
                  </p>
                  <p className="text-gray-600 text-base font-['Times_New_Roman']">
                    High-Quality Products
                  </p>
                </div>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-center md:text-6xl">
                You can have anything you want in life if you dress for it.
              </h1>

              <p className="text-lg text-center text-gray-600">
                Browse through our diverse range of meticulously crafted
                garments, designed to bring out your individuality and cater to
                your sense of style.
              </p>

              <div className="flex justify-center">
                <Button className="px-12 py-3 text-lg text-white bg-black rounded-full hover:bg-gray-900">
                  Shop Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="py-1 bg-black">
        <div className="container px-4 mx-auto">
          <div className="grid items-center grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5">
            <img
              src="/assets/prada.png"
              alt="prada"
              className="object-contain h-8 mx-auto"
            />
            <img
              src="/assets/mufti.png"
              alt="Mufti"
              className="object-contain mx-auto h-14 w-19"
            />
            <img
              src="/assets/vanheusen.png"
              alt="Van Heusen"
              className="object-contain h-20 mx-auto w-44"
            />
            <img
              src="/assets/calvin.png"
              alt="Calvin Klein"
              className="object-contain h-8 mx-auto"
            />
            <img
              src="/assets/gucci.png"
              alt="Gucci"
              className="object-contain h-12 mx-auto"
            />
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-10 bg-white">
        <div className="max-w-[1500px] mx-auto px-4">
          <h1 className="mb-8 text-5xl font-extrabold text-center uppercase text-black">
            New Arrivals
          </h1>
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
              <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
                {newArrivals.map((product) => (
                  <div key={product.id} className="w-[280px] flex-shrink-0 snap-start">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link to="/shop">
              <Button className="gap-2 rounded-full border border-black text-black hover:bg-black hover:text-white transition">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Top Selling */}
      <section className="py-10 bg-white">
        <div className="max-w-[1500px] mx-auto px-4">
          <h1 className="mb-8 text-5xl font-extrabold text-center uppercase text-black">
            Top Selling
          </h1>
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
              <div className="flex gap-6 pb-4" style={{ minWidth: 'min-content' }}>
                {topSelling.map((product) => (
                  <div key={product.id} className="w-[280px] flex-shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link to="/shop">
              <Button className="gap-2 rounded-full border border-black text-black hover:bg-black hover:text-white transition">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Browse by Style */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="p-8 bg-gray-100 rounded-lg">
            <h2 className="mb-8 text-2xl font-bold text-center uppercase">
              BROWSE BY dress STYLE
            </h2>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
              {[
                {
                  name: "Casual",
                  img: "/assets/casual.png",
                  link: "/category/casual",
                },
                {
                  name: "Formal",
                  img: "/assets/formal.png",
                  link: "/category/formal",
                },
                {
                  name: "Party",
                  img: "/assets/party.png",
                  link: "/category/party",
                },
                { name: "Gym", img: "/assets/gym.png", link: "/category/gym" },
              ].map(({ name, img, link }) => (
                <Link
                  key={name}
                  to={link}
                  className="relative overflow-hidden rounded-2xl bg-white shadow-sm aspect-[2/1]"
                >
                  <img
                    src={img}
                    alt={name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  <h3 className="absolute top-3 left-3 text-lg font-bold text-black">
                    {name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      
    </MainLayout>
  );
};

export default Home;
