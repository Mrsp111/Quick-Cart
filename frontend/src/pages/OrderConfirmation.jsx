import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { orderApi } from "@/services/orderApi";
import { useCart } from "@/context/CartContext";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const processedStripeSessionRef = useRef(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const { clearCart } = useCart();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get("session_id");

    if (sessionId) {
      if (processedStripeSessionRef.current) {
        return;
      }

      processedStripeSessionRef.current = true;

      const confirmStripePayment = async () => {
        setIsConfirming(true);
        setConfirmError("");

        try {
          await orderApi.confirmStripeSession(sessionId);
          sessionStorage.setItem("orderCompleted", "true");

          // Cart is already cleared on backend; this keeps frontend state in sync.
          try {
            await clearCart();
          } catch (cartError) {
            console.warn("Unable to clear local cart state after payment confirmation:", cartError);
          }

          toast({
            title: "Payment Successful",
            description: "Your payment is confirmed and order has been created.",
          });
        } catch (error) {
          console.error("Error confirming payment:", error);
          setConfirmError(error.message || "Failed to verify payment.");
          toast({
            title: "Payment Verification Failed",
            description: error.message || "Please contact support if amount was deducted.",
            variant: "destructive",
          });
        } finally {
          setIsConfirming(false);
        }
      };

      confirmStripePayment();
      return;
    }

    const hasOrderCompleted = sessionStorage.getItem("orderCompleted");
    if (!hasOrderCompleted) {
      navigate("/");
    }
  }, [location.search, navigate, clearCart]);

  const pageTitle = isConfirming
    ? "Confirming Your Payment..."
    : confirmError
    ? "Payment Verification Failed"
    : "Thank You for Your Order!";

  const pageDescription = isConfirming
    ? "Please wait while we verify payment with Stripe and finalize your order."
    : confirmError
    ? "We could not verify your payment yet. If money was deducted, contact support with payment details."
    : "Your order has been placed successfully. We'll send you a confirmation email with your order details shortly.";

  return (
    <MainLayout>
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            {isConfirming ? (
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            ) : (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">{pageTitle}</h1>
          <p className="text-gray-600 mb-8">{pageDescription}</p>

          <div className="border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
            <ul className="text-left space-y-3">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>You'll receive an order confirmation email with details of your purchase.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Your order will be processed and prepared for shipping.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Once your order ships, we'll send you tracking information.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>You can check your order status anytime in your account profile.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/shop">
              <button className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white px-8 py-3 rounded">
                Continue Shopping
              </button>
            </Link>
            <Link to={confirmError ? "/checkout" : "/user/orders"}>
              <button className="w-full sm:w-auto bg-white hover:bg-gray-100 text-black border border-gray-300 px-8 py-3 rounded">
                {confirmError ? "Back to Checkout" : "View My Orders"}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OrderConfirmation;