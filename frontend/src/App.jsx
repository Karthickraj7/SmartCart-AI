import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import Chat from "./components/Chat";
import Page from "./components/Page";
import { useUI } from "./context/UI";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Compare = lazy(() => import("./pages/Compare"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Orders = lazy(() => import("./pages/Orders"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Account = lazy(() => import("./pages/Account"));
const Notifications = lazy(() => import("./pages/Notifications"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const Reset = lazy(() => import("./pages/Reset"));
const Info = lazy(() => import("./pages/Info"));

const wrap = (title, el, narrow = false) => <Page title={title} crumbs={[{ label: title }]} narrow={narrow}>{el}</Page>;

export default function App() {
  const { toast } = useUI();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:p-2">Skip to content</a>
      <Header />
      <main id="main">
        <Suspense fallback={<p className="container-page animate-pulse py-20">Loading…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/products/:id" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={wrap("My Account", <Login />, true)} />
            <Route path="/reset" element={wrap("Reset Password", <Reset />, true)} />
            <Route path="/orders" element={wrap("My Orders", <Orders />)} />
            <Route path="/wishlist" element={wrap("Wishlist", <Wishlist />)} />
            <Route path="/account" element={wrap("My Account", <Account />)} />
            <Route path="/notifications" element={wrap("Notifications", <Notifications />)} />
            <Route path="/payment/:outcome" element={wrap("Payment", <PaymentResult />)} />
            <Route path="/info/:slug" element={<Info />} />
            <Route path="*" element={wrap("Page not found", <p>The page you are looking for does not exist.</p>)} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <Chat />
      {toast && <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded bg-g1 px-5 py-3 text-sm text-white shadow-lg">{toast}</div>}
    </>
  );
}
