import { api } from "./api";

export function loadRazorpay() {
  return new Promise((res, rej) => {
    if (window.Razorpay) return res();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = res; s.onerror = () => rej(new Error("Could not load the payment window. Check your connection and try again."));
    document.body.appendChild(s);
  });
}

// Opens Razorpay for an existing pending order. The order is confirmed only after the server verifies the payment signature.
export async function startPayment(orderId, { onSuccess, onFailure, prefill } = {}) {
  const { data: pay } = await api.post("/payments/create/", { order_id: orderId });
  await loadRazorpay();
  const rzp = new window.Razorpay({
    key: pay.key_id, order_id: pay.razorpay_order_id, amount: Math.round(Number(pay.amount) * 100), currency: pay.currency, prefill,
    handler: async (r) => { try { await api.post("/payments/verify/", r); onSuccess?.(); } catch { onFailure?.(); } },
    modal: { ondismiss: () => onFailure?.() },
  });
  rzp.on("payment.failed", () => onFailure?.());
  rzp.open();
}
