import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

const AboutUs = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>About Us</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">About QuickCart</h1>
          
          <div className="prose lg:prose-xl">
            <p className="text-lg mb-4">
              QuickCart was founded in 2023 with a simple mission: to make online shopping easier, faster, and more enjoyable for everyone.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Story</h2>
            <p className="mb-4">
              What started as a small operation has quickly grown into one of the most trusted online marketplaces. We believe that shopping online should be just as satisfying as shopping in person, without any of the hassles.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Values</h2>
            <ul className="list-disc pl-6 mb-6">
              <li className="mb-2"><strong>Quality:</strong> We carefully curate our selection to ensure that every product meets our high standards.</li>
              <li className="mb-2"><strong>Convenience:</strong> Our platform is designed to make your shopping experience as smooth and efficient as possible.</li>
              <li className="mb-2"><strong>Customer First:</strong> Your satisfaction is our top priority, and we're always here to help.</li>
              <li className="mb-2"><strong>Transparency:</strong> We believe in clear pricing, honest reviews, and no hidden fees.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Team</h2>
            <p className="mb-4">
              Behind QuickCart is a team of passionate individuals who are committed to revolutionizing online shopping. From our product experts to our customer service representatives, every member of our team plays a vital role in delivering the QuickCart experience.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Join Our Journey</h2>
            <p className="mb-4">
              We're just getting started, and we're excited to have you along for the ride. Whether you're a first-time customer or a loyal shopper, we're committed to making your QuickCart experience better every day.
            </p>

            {/* --- Terms & Conditions Summary Section --- */}
            <h2 id="terms-and-conditions" className="text-2xl font-semibold mt-12 mb-4">Terms & Conditions (Summary)</h2>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">All orders are subject to availability and confirmation of payment.</li>
              <li className="mb-2">Returns are accepted within 7 days in original condition.</li>
              <li className="mb-2">Shipping times may vary based on location and logistics.</li>
              <li className="mb-2">Your use of this site signifies agreement to our full Terms & Conditions.</li>
            </ul>
            <p className="mb-8">
              Read the full <a href="/terms" className="text-blue-600 underline">Terms and Conditions</a> for more details.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AboutUs;
