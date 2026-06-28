import API from "../services/api";
import loadRazorpay from "./loadRazorpay";

export const payNow = async ({ bookingId, user }) => {
  // ✅ Load Razorpay script
  const loaded = await loadRazorpay();
  if (!loaded) {
    alert("Razorpay SDK failed to load. Check internet.");
    return;
  }

  try {
    // ✅ Step 1: Create Order from backend
    const orderRes = await API.post("/payments/create-order", { bookingId });

    const { orderId, amount, key } = orderRes.data;

    // ✅ Step 2: Open Razorpay Checkout
    const options = {
      key: key,
      amount: amount * 100,
      currency: "INR",
      name: "Monastery360",
      description: "Trip Booking Payment",
      order_id: orderId,

      handler: async function (response) {
        try {
          // ✅ Step 3: Verify Payment (VERY IMPORTANT)
          const verifyRes = await API.post("/payments/verify", {
            bookingId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
          });

          alert("Payment Successful ✅ Booking Confirmed");
          return verifyRes.data;
        } catch (err) {
          console.log("VERIFY ERROR =>", err);
          alert(err?.response?.data?.message || "Payment verify failed");
        }
      },

      prefill: {
        name: user?.name || "User",
        email: user?.email || "user@mail.com",
        contact: user?.phone || "9999999999",
      },

      theme: {
        color: "#7c3aed",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.log("PAY NOW ERROR =>", err);
    alert(err?.response?.data?.message || "Payment failed");
  }
};
