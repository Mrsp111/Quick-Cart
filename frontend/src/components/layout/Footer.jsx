import React from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Twitter, Facebook, Instagram, Github } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useUser } from "@/context/UserContext";

const Footer = () => {
  const { isAuthenticated } = useUser();

  const handleSubscribe = (e) => {
    e.preventDefault();
    toast({
      title: "Subscribed!",
      description: "You've successfully subscribed to our newsletter.",
    });
    // Reset the form
    e.currentTarget.reset();
  };

  return (
    <footer className="pt-12 pb-6 bg-gray-100">
      <div className="container px-4 mx-auto">
        {/* Newsletter Section */}
        <div className="p-8 mb-12 text-white bg-black rounded-lg" style={{ borderRadius: '30px' }}>
          <div className="grid items-center grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-2xl font-bold">STAY UPTO DATE ABOUT OUR LATEST OFFERS</h3>
            </div>
            <div>
              <form className="space-y-3" onSubmit={handleSubscribe}>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    className="py-6 text-black bg-white rounded-lg"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full py-6 text-black bg-white hover:bg-gray-200 rounded-lg"
                >
                  Subscribe to Newsletter
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Store Description */}
          <div className="lg:col-span-1">
            <p className="mb-4 text-gray-600">
              We have clothes that suits your style and which you're proud to wear. From women to men.
            </p>
            <Link 
              to="/" 
              className="flex-shrink-0 inline-block mb-4 group"
              onClick={() => window.scrollTo(0, 0)}
            >
              <img
                src="/assets/logo.png"
                alt="QuickCart Logo"
                className="w-auto h-8 transition-all duration-300 border border-gray-200 shadow-md sm:h-10 rounded-2xl group-hover:scale-105 group-hover:border-blue-300"
              />
            </Link>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-black">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-black">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-black">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-black">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase">COMPANY</h3>
            <ul className="space-y-2">
              <li><Link to="/about-us" className="text-gray-600 hover:text-black">About</Link></li>
              <li><Link to="/features" className="text-gray-600 hover:text-black">Features</Link></li>
              <li><Link to="/works" className="text-gray-600 hover:text-black">Works</Link></li>
              <li><Link to="/career" className="text-gray-600 hover:text-black">Career</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase">HELP</h3>
            <ul className="space-y-2">
              <li><Link to="/contact-us" className="text-gray-600 hover:text-black">Customer Support</Link></li>
              <li><Link to="/delivery" className="text-gray-600 hover:text-black">Delivery Details</Link></li>
              <li><Link to="/about-us#terms-and-conditions" className="text-gray-600 hover:text-black">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-gray-600 hover:text-black">Privacy Policy</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase">FAQ</h3>
            <ul className="space-y-2">
              <li><Link to={isAuthenticated ? "/profile" : "/login"} className="text-gray-600 hover:text-black">Account</Link></li>
              <li><Link to="/deliveries" className="text-gray-600 hover:text-black">Manage Deliveries</Link></li>
              <li><Link to={isAuthenticated ? "/user/orders" : "/login"} className="text-gray-600 hover:text-black">Delivery Details</Link></li>
              <li><Link to="/payments" className="text-gray-600 hover:text-black">Payments</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase">RESOURCES</h3>
            <ul className="space-y-2">
              <li><Link to="/ebooks" className="text-gray-600 hover:text-black">Free eBooks</Link></li>
              <li><Link to="/tutorials" className="text-gray-600 hover:text-black">Development Tutorial</Link></li>
              <li><Link to="/blog" className="text-gray-600 hover:text-black">How to - Blog</Link></li>
              <li><Link to="/playlist" className="text-gray-600 hover:text-black">Youtube Playlist</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-center text-gray-600">
            Quick Cart © 2000-2025, All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
