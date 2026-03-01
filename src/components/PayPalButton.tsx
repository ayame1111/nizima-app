'use client';

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import axios from "axios";

interface PayPalButtonProps {
  amount: number;
  productId: string;
  onSuccess: (orderData: any) => void;
}

export default function PayPalButtonComponent({ amount, productId, onSuccess }: PayPalButtonProps) {
  const [error, setError] = useState<string | null>(null);

  // In production, clientId should be from env
  const initialOptions = {
    clientId: "test", // "test" enables sandbox mode
    currency: "USD",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="w-full max-w-md">
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect" }}
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: amount.toString(),
                    currency_code: "USD"
                  },
                  description: `Live2D Model #${productId}`
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
        {error && <p className="text-red-600 mt-2 text-sm bg-red-50 p-2 rounded">{error}</p>}
      </div>
    </PayPalScriptProvider>
  );
}
