'use client';

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import axios from "axios";
import { ShieldCheck, Lock } from "lucide-react";
import { useState } from "react";

interface PayPalButtonProps {
  amount: number;
  productId?: string;
  productIds?: string[];
  onSuccess: (orderData: any) => void;
}

export default function PayPalButtonComponent({ amount, productId, productIds, onSuccess }: PayPalButtonProps) {
  const [error, setError] = useState<string | null>(null);

  // In production, clientId should be from env
  const initialOptions = {
    clientId: "test", // "test" enables sandbox mode
    currency: "USD",
    intent: "capture",
    components: "buttons", // Only load buttons component
    disableFunding: "p24,blik", // Disable Przelewy24 and BLIK
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{ 
            layout: "vertical", 
            shape: "rect",
            color: "white",
            label: "paypal"
          }}
          forceReRender={[amount, productId, productIds]}
          fundingSource={undefined} // Let PayPal decide smart buttons (PayPal, Card, Venmo, etc)
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: amount.toString(),
                    currency_code: "USD"
                  },
                  description: productIds ? `Cart Checkout (${productIds.length} items)` : `Live2D Model #${productId}`
                },
              ],
              intent: "CAPTURE"
            });
          }}
          onApprove={async (data, actions) => {
            if (!actions.order) return;
            try {
              const order = await actions.order.capture();
              console.log("PayPal Capture:", order);
              
              // Call backend to finalize
              const response = await axios.post('/api/checkout', {
                paypalOrderId: order.id,
                productId,
                productIds,
                payerEmail: order.payer?.email_address,
                transactionId: order.purchase_units?.[0]?.payments?.captures?.[0]?.id || order.id,
              });
              
              onSuccess(response.data);
            } catch (err) {
              console.error("Capture Error:", err);
              setError("Payment processed but failed to verify. Please contact support.");
            }
          }}
          onError={(err) => {
              console.error("PayPal Error:", err);
              setError("An error occurred with PayPal.");
            }}
        />
      </PayPalScriptProvider>

      {error && <p className="text-red-400 mt-2 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}

      {/* Safety Disclosure */}
      <div className="bg-gray-800/50 border border-white/10 rounded-lg p-3 text-xs text-gray-400 flex items-start gap-2 mt-4">
        <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-gray-200 flex items-center gap-1.5">
            Secure Transaction <Lock size={10} className="text-gray-500" />
          </p>
          <p className="leading-relaxed">
            Your payment is securely processed by PayPal. We do not store your credit card details. 
            You are protected by PayPal Buyer Protection.
          </p>
        </div>
      </div>
    </div>
  );
}
