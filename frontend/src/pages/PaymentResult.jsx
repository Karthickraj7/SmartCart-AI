import { Link, useParams } from "react-router-dom";
export default function PaymentResult() {
  const ok = useParams().outcome === "success";
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-3xl font-medium">{ok ? "Payment received" : "Payment didn't go through"}</h1>
      <p className="my-3 text-stone-600">{ok ? "Thank you! Your order is being confirmed. Track it under Orders." : "No money was taken. Your order is still pending; you can retry from the cart or it will be cancelled automatically."}</p>
      <Link className="btn" to={ok ? "/orders" : "/cart"}>{ok ? "View orders" : "Back to cart"}</Link>
    </div>
  );
}
