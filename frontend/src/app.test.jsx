import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderApp } from "./test-utils";

vi.mock("./services/api", async () => {
  const actual = await vi.importActual("./services/api");
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), defaults: { baseURL: "" } } };
});
vi.mock("./services/payment", () => ({ startPayment: vi.fn(), loadRazorpay: vi.fn() }));
import { api } from "./services/api";
import { startPayment } from "./services/payment";
import { useUI } from "./context/UI";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Compare from "./pages/Compare";
import Contact from "./pages/Contact";
import Info from "./pages/Info";
import Chat from "./components/Chat";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import ProductCard from "./components/ProductCard";

const product = (o = {}) => ({ id: 1, name: "Wooden Train", category_name: "Toys", category_slug: "toys", final_price: "899.00", price: "899.00", discount_percent: 0,
  images: [], stock: 5, description: "A sturdy train.", variants: [], specifications: {}, created_at: "2020-01-01T00:00:00Z", ...o });
const cartData = (o = {}) => ({ items: [{ id: 1, product_id: 1, name: "Wooden Train", variant: null, image: null, unit_price: "899.00", quantity: 2, line_total: "1798.00" }],
  subtotal: "1798.00", discount: "0.00", delivery_fee: "0.00", tax: "323.64", total: "2121.64", coupon_error: null, ...o });
const signIn = () => localStorage.setItem("access", "A");
beforeEach(() => vi.resetAllMocks());

describe("Login", () => {
  it("shows the API error message and does not log in", async () => {
    api.post.mockRejectedValue({ response: { data: { detail: "No active account found" } } });
    renderApp(<Login />);
    await userEvent.type(screen.getByPlaceholderText("Email"), "a@x.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No active account found");
    expect(localStorage.getItem("access")).toBeNull();
  });
  it("stores tokens on success", async () => {
    api.post.mockResolvedValue({ data: { access: "A", refresh: "R" } });
    renderApp(<Login />);
    await userEvent.type(screen.getByPlaceholderText("Email"), "a@x.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "S3cure-pass!");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(localStorage.getItem("access")).toBe("A"));
  });
});

describe("Home", () => {
  const feed = (results) => api.get.mockImplementation((url) => Promise.resolve({ data: url === "/categories/" ? [{ id: 1, name: "Dining", slug: "dining" }] : { results, count: results.length } }));
  it("renders the template hero, category tile and live product prices", async () => {
    feed([product()]);
    renderApp(<Home />);
    expect(screen.getByRole("heading", { name: "Discover Our New Collection" })).toBeInTheDocument();
    expect(await screen.findByText("Wooden Train")).toBeInTheDocument();
    expect(screen.getByText("₹899.00")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Dining/ })).toHaveAttribute("href", "/shop?category=dining");
  });
  it("shows an empty state and an error state", async () => {
    feed([]);
    renderApp(<Home />);
    expect(await screen.findByText(/No products yet/)).toBeInTheDocument();
  });
  it("surfaces API errors", async () => {
    api.get.mockImplementation((url) => (url === "/categories/" ? Promise.resolve({ data: [] }) : Promise.reject({ response: { data: { detail: "Server down" } } })));
    renderApp(<Home />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Server down");
  });
});

describe("ProductCard", () => {
  it("shows discount badge, strikethrough price and sold-out state", () => {
    renderApp(<ProductCard p={product({ discount_percent: 30, price: "1000.00", final_price: "700.00", stock: 0 })} />);
    expect(screen.getByText("-30%")).toBeInTheDocument();
    expect(screen.getByText("₹1000.00").tagName).toBe("S");
    expect(screen.getByRole("button", { name: "Sold out" })).toBeDisabled();
  });
  it("shows a New badge for recent products only", () => {
    renderApp(<ProductCard p={product({ created_at: new Date().toISOString() })} />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });
  it("adds to cart for signed-in users", async () => {
    signIn(); api.post.mockResolvedValue({ data: {} }); api.get.mockResolvedValue({ data: cartData() });
    renderApp(<ProductCard p={product()} />);
    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/cart/items/", { product_id: 1, quantity: 1 }));
  });
  it("does not call the API for a product that needs a variant", async () => {
    signIn();
    renderApp(<ProductCard p={product({ variants: [{ id: 7, name: "Large", price: "650.00" }] })} />);
    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe("Shop", () => {
  const feed = (count = 20, results = [product()]) => api.get.mockImplementation((url) => Promise.resolve({ data: url === "/categories/" ? [{ id: 1, name: "Toys", slug: "toys" }] : { results, count } }));
  it("passes URL filters to the API and shows result range", async () => {
    feed(20);
    renderApp(<Shop />, { route: "/shop?category=toys&page_size=8&search=train" });
    expect(await screen.findByText("Showing 1–8 of 20 results")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/products/", { params: expect.objectContaining({ category: "toys", page_size: 8, search: "train", page: 1 }) });
  });
  it("paginates with Next", async () => {
    feed(20);
    renderApp(<Shop />, { route: "/shop?page_size=8" });
    await userEvent.click(await screen.findByRole("button", { name: "Next" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/products/", { params: expect.objectContaining({ page: 2 }) }));
    expect(await screen.findByText("Showing 9–16 of 20 results")).toBeInTheDocument();
  });
  it("shows an empty state with a way to clear filters", async () => {
    feed(0, []);
    renderApp(<Shop />, { route: "/shop?search=zzz" });
    expect(await screen.findByText(/No products found/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });
});

describe("Product page", () => {
  const view = () => renderApp(<Routes><Route path="/products/:id" element={<Product />} /></Routes>, { route: "/products/1" });
  const feed = (extra = {}) => api.get.mockImplementation((url) => Promise.resolve({ data: url.includes("reviews") ? { results: [{ rating: 5, comment: "Great", author: "Asha" }], count: 1, average: 5 }
    : url.includes("related") ? [product({ id: 2, name: "Stacking Rings" })] : product(extra) }));
  it("requires a variant before add-to-cart and updates the price", async () => {
    signIn(); feed({ variants: [{ id: 7, name: "Large", price: "650.00" }] });
    view();
    const btn = await screen.findByRole("button", { name: "Add To Cart" });
    expect(btn).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Large" }));
    expect(btn).toBeEnabled();
    expect(screen.getByText(/₹650.00/, { selector: "p" })).toBeInTheDocument();
  });
  it("sends variant and quantity to the cart API", async () => {
    signIn(); feed({ variants: [{ id: 7, name: "Large", price: "650.00" }] }); api.post.mockResolvedValue({ data: {} });
    view();
    await userEvent.click(await screen.findByRole("button", { name: "Large" }));
    await userEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    await userEvent.click(screen.getByRole("button", { name: "Add To Cart" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/cart/items/", { product_id: "1", variant_id: "7", quantity: 2 }));
  });
  it("disables add-to-cart when out of stock", async () => {
    feed({ stock: 0 }); view();
    expect(await screen.findByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add To Cart" })).toBeDisabled();
  });
  it("switches tabs and lists related products", async () => {
    feed({ specifications: { material: "beech" } }); view();
    await userEvent.click(await screen.findByRole("tab", { name: "Additional Information" }));
    expect(screen.getByText("beech")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /Reviews/ }));
    expect(screen.getByText("Great")).toBeInTheDocument();
    expect(await screen.findByText("Stacking Rings")).toBeInTheDocument();
  });
});

describe("Cart", () => {
  it("asks anonymous users to log in", () => {
    renderApp(<Cart />);
    expect(screen.getByText(/to see your cart/)).toBeInTheDocument();
  });
  it("shows totals from the server and updates quantity / removes items", async () => {
    signIn(); api.get.mockResolvedValue({ data: cartData() }); api.patch.mockResolvedValue({ data: {} }); api.delete.mockResolvedValue({ data: {} });
    renderApp(<Cart />);
    const totals = await screen.findByLabelText("Cart totals");
    expect(within(totals).getByText("₹2121.64")).toBeInTheDocument();
    expect(within(totals).getByText("Free")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Increase Wooden Train" }));
    expect(api.patch).toHaveBeenCalledWith("/cart/items/1/", { quantity: 3 });
    await userEvent.click(screen.getByRole("button", { name: "Remove Wooden Train" }));
    expect(api.delete).toHaveBeenCalledWith("/cart/items/1/");
    expect(screen.getByRole("link", { name: "Check Out" })).toHaveAttribute("href", "/checkout");
  });
  it("shows the stock error returned by the API", async () => {
    signIn(); api.get.mockResolvedValue({ data: cartData() });
    api.patch.mockRejectedValue({ response: { data: { errors: ["Only 2 of Wooden Train available."] } } });
    renderApp(<Cart />);
    await userEvent.click(await screen.findByRole("button", { name: "Increase Wooden Train" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Only 2");
  });
});

describe("Checkout", () => {
  const feed = (cart = cartData()) => api.get.mockImplementation((url) => Promise.resolve({ data: url === "/cart/" ? cart : url === "/auth/me/" ? { email: "a@x.com" } : { results: [] } }));
  const fill = async () => {
    for (const [label, v] of [["First Name", "Asha"], ["Last Name", "Rao"], ["Street address", "1 MG Road"], ["Town / City", "Pune"], ["State", "Maharashtra"], ["PIN code", "411001"], ["Phone", "9876543210"]])
      await userEvent.type(screen.getByLabelText(label), v);
  };
  it("validates fields before creating an order", async () => {
    signIn(); feed(); renderApp(<Checkout />);
    await userEvent.click(await screen.findByRole("button", { name: "Place order" }));
    expect((await screen.findAllByText("Required")).length).toBeGreaterThan(2);
    expect(screen.getByText("Enter a 6-digit PIN code")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
  it("creates the order, then starts payment for that order", async () => {
    signIn(); feed(); api.post.mockResolvedValue({ data: { id: 42 } }); startPayment.mockResolvedValue();
    renderApp(<Checkout />);
    await screen.findByRole("button", { name: "Place order" }); await fill();
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));
    await waitFor(() => expect(startPayment).toHaveBeenCalledWith(42, expect.objectContaining({ onSuccess: expect.any(Function), onFailure: expect.any(Function) })));
    expect(api.post).toHaveBeenCalledWith("/orders/", { coupon_code: undefined, address: expect.objectContaining({ name: "Asha Rao", pincode: "411001", country: "India" }) });
  });
  it("shows a stock error and never opens the payment window", async () => {
    signIn(); feed(); api.post.mockRejectedValue({ response: { data: { errors: ["Insufficient stock for Wooden Train."] } } });
    renderApp(<Checkout />);
    await screen.findByRole("button", { name: "Place order" }); await fill();
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Insufficient stock");
    expect(startPayment).not.toHaveBeenCalled();
  });
  it("tells the customer the order is saved if payment cannot start", async () => {
    signIn(); feed(); api.post.mockResolvedValue({ data: { id: 7 } }); startPayment.mockRejectedValue({ response: { status: 503, data: { detail: "Payment gateway is not configured or unreachable." } } });
    renderApp(<Checkout />);
    await screen.findByRole("button", { name: "Place order" }); await fill();
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/order #7 was saved/);
  });
  it("asks the server to price the coupon and shows its message", async () => {
    signIn(); feed(cartData({ coupon_error: "Invalid coupon." })); renderApp(<Checkout />);
    await userEvent.type(await screen.findByLabelText("Coupon"), "NOPE");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/cart/", { params: { coupon: "NOPE" } }));
    expect(await screen.findByText("Invalid coupon.")).toBeInTheDocument();
  });
});

describe("Compare", () => {
  it("builds a spec table from the selected products", async () => {
    localStorage.setItem("compare", "[1,2]");
    api.get.mockImplementation((url) => {
      if (url === "/products/1/") return Promise.resolve({ data: product({ id: 1, name: "Sofa A", specifications: { material: "beech", weight: "40 kg" } }) });
      if (url === "/products/2/") return Promise.resolve({ data: product({ id: 2, name: "Sofa B", specifications: { material: "pine" } }) });
      if (url.includes("reviews")) return Promise.resolve({ data: { average: 4.5, count: 2, results: [] } });
      return Promise.resolve({ data: { results: [] } });
    });
    renderApp(<Compare />);
    expect(await screen.findByRole("link", { name: "Sofa A" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sofa B" })).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /material/i });
    expect(within(row).getByText("beech")).toBeInTheDocument();
    expect(within(row).getByText("pine")).toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /weight/i })).getByText("–")).toBeInTheDocument();
  });
  it("shows an empty state", async () => {
    api.get.mockResolvedValue({ data: { results: [] } });
    renderApp(<Compare />);
    expect(await screen.findByText(/Nothing to compare yet/)).toBeInTheDocument();
  });
});

describe("Contact", () => {
  const fill = async () => {
    await userEvent.type(screen.getByLabelText("Your name"), "Asha");
    await userEvent.type(screen.getByLabelText("Email address"), "asha@x.com");
    await userEvent.type(screen.getByLabelText("Message"), "Do you deliver to Pune?");
  };
  it("sends the message and confirms", async () => {
    api.post.mockResolvedValue({ data: { detail: "Thanks! We'll get back to you soon." } });
    renderApp(<Contact />); await fill();
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Thanks!");
    expect(api.post).toHaveBeenCalledWith("/contact/", { name: "Asha", email: "asha@x.com", subject: "", message: "Do you deliver to Pune?" });
  });
  it("shows field errors from the server", async () => {
    api.post.mockRejectedValue({ response: { status: 400, data: { errors: { email: "Enter a valid email address." } } } });
    renderApp(<Contact />); await fill();
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("valid email");
  });
  it("explains rate limiting", async () => {
    api.post.mockRejectedValue({ response: { status: 429, data: { detail: "Request was throttled." } } });
    renderApp(<Contact />); await fill();
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Too many messages");
  });
});

describe("Footer newsletter", () => {
  it("subscribes and confirms, or shows the validation error", async () => {
    api.post.mockResolvedValueOnce({ data: { detail: "You're subscribed." } });
    renderApp(<Footer />);
    await userEvent.type(screen.getByLabelText("Email address"), "a@x.com");
    await userEvent.click(screen.getByRole("button", { name: "SUBSCRIBE" }));
    expect(await screen.findByRole("status")).toHaveTextContent("subscribed");
    expect(api.post).toHaveBeenCalledWith("/newsletter/", { email: "a@x.com" });
    api.post.mockRejectedValueOnce({ response: { data: { errors: { email: "Enter a valid email address." } } } });
    await userEvent.type(screen.getByLabelText("Email address"), "b@x.com");
    await userEvent.click(screen.getByRole("button", { name: "SUBSCRIBE" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("valid email");
  });
});

describe("Cart drawer", () => {
  function Harness() { const { setCartOpen } = useUI(); return <><button onClick={() => setCartOpen(true)}>open</button><CartDrawer /></>; }
  it("opens, lists items with subtotal, removes, and closes with Escape", async () => {
    signIn(); api.get.mockResolvedValue({ data: cartData() }); api.delete.mockResolvedValue({ data: {} });
    renderApp(<Harness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("open"));
    expect(await screen.findByRole("dialog", { name: "Shopping cart" })).toBeInTheDocument();
    expect(await screen.findByText("Wooden Train")).toBeInTheDocument();
    expect(screen.getByText("₹1798.00", { selector: "span" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove Wooden Train" }));
    expect(api.delete).toHaveBeenCalledWith("/cart/items/1/");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("prompts anonymous users to log in", async () => {
    renderApp(<Harness />);
    await userEvent.click(screen.getByText("open"));
    expect(await screen.findByText(/to see your cart/)).toBeInTheDocument();
  });
});

describe("Chat widget", () => {
  it("sends a message and renders answer with sources", async () => {
    api.post.mockResolvedValue({ data: { conversation_id: 1, message_id: 9, answer: "Returns within 7 days.", sources: [{ title: "Return Policy" }] } });
    renderApp(<Chat />);
    await userEvent.click(screen.getByLabelText("Open assistant"));
    await userEvent.type(screen.getByLabelText("Message"), "return policy?");
    await userEvent.click(screen.getByLabelText("Send"));
    expect(await screen.findByText("Returns within 7 days.")).toBeInTheDocument();
    expect(screen.getByText(/Sources: Return Policy/)).toBeInTheDocument();
  });
  it("shows a friendly message when the API is unreachable", async () => {
    api.post.mockRejectedValue({});
    renderApp(<Chat />);
    await userEvent.click(screen.getByLabelText("Open assistant"));
    await userEvent.type(screen.getByLabelText("Message"), "hi");
    await userEvent.click(screen.getByLabelText("Send"));
    expect(await screen.findByText(/server may be waking up/)).toBeInTheDocument();
  });
});

describe("Info pages", () => {
  const view = (slug) => renderApp(<Routes><Route path="/info/:slug" element={<Info />} /></Routes>, { route: `/info/${slug}` });
  it("shows owner-published content from the API under the template banner", async () => {
    api.get.mockResolvedValue({ data: { slug: "about", title: "Our story", body: "We make furniture." } });
    view("about");
    expect(await screen.findByText("We make furniture.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Our story" })).toBeInTheDocument();
  });
  it("falls back to a neutral default when nothing is published", async () => {
    api.get.mockRejectedValue({ response: { status: 404, data: { detail: "Not found." } } });
    view("privacy");
    expect(await screen.findByText(/has not been published yet/)).toBeInTheDocument();
  });
});
