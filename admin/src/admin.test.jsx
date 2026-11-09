import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("./services/api", async () => {
  const actual = await vi.importActual("./services/api");
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(), defaults: { baseURL: "" } } };
});
import { api } from "./services/api";
import App from "./App";
import Orders from "./pages/Orders";
import SitePages from "./pages/SitePages";
import People from "./pages/People";
import Inbox from "./pages/Inbox";
import Knowledge from "./pages/Knowledge";

const wrap = (ui) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
beforeEach(() => vi.resetAllMocks());

describe("Admin access", () => {
  it("shows the sign-in form when logged out", () => {
    wrap(<App />);
    expect(screen.getByRole("heading", { name: "Admin sign in" })).toBeInTheDocument();
  });
  it("blocks customer accounts from the admin UI", async () => {
    localStorage.setItem("access", "A");
    api.get.mockResolvedValue({ data: { email: "c@x.com", role: "customer" } });
    wrap(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent("does not have admin access");
    expect(screen.queryByText("Revenue")).not.toBeInTheDocument();
  });
  it("lets staff in and shows role", async () => {
    localStorage.setItem("access", "A");
    api.get.mockImplementation((url) => Promise.resolve({ data: url === "/auth/me/" ? { email: "pm@x.com", role: "product_manager" } : url === "/notifications/" ? [{ id: 1, message: "Low stock: Tee has 5 left.", is_read: false }] : { revenue: "1500", orders: 3, paid_orders: 2, customers: 4, sales_by_day: [], top_products: [], low_stock: [], recent_activity: [] } }));
    wrap(<App />);
    expect(await screen.findByText(/pm@x.com · product_manager/)).toBeInTheDocument();
    expect(await screen.findByText("Revenue")).toBeInTheDocument();
    expect(await screen.findByText("Low stock: Tee has 5 left.")).toBeInTheDocument();
  });
});

describe("Orders admin", () => {
  it("offers only valid next statuses and a refund for returned orders", async () => {
    api.get.mockResolvedValue({ data: [
      { id: 1, user_email: "a@x.com", total: "500", status: "pending" },
      { id: 2, user_email: "b@x.com", total: "700", status: "returned" }] });
    wrap(<Orders />);
    await screen.findByText("a@x.com");
    expect(screen.getAllByRole("button", { name: "confirmed" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "shipped" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "refund" })).toHaveLength(1);
  });
  it("shows the server's error when a transition is rejected", async () => {
    api.get.mockResolvedValue({ data: [{ id: 1, user_email: "a@x.com", total: "500", status: "pending" }] });
    api.post.mockRejectedValue({ response: { data: { detail: "You do not have permission to perform this action." } } });
    wrap(<Orders />);
    await userEvent.click(await screen.findByRole("button", { name: "confirmed" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("permission");
  });
});

describe("Site pages editor", () => {
  it("loads, edits and publishes a page; shows permission errors", async () => {
    api.get.mockResolvedValue({ data: { slug: "about", title: "About us", body: "Old text" } });
    api.put.mockRejectedValue({ response: { data: { detail: "You do not have permission to perform this action." } } });
    wrap(<SitePages />);
    const body = await screen.findByLabelText("Body");
    await waitFor(() => expect(body).toHaveValue("Old text"));
    await userEvent.clear(body); await userEvent.type(body, "New text");
    await userEvent.click(screen.getByRole("button", { name: "Publish" }));
    expect(api.put).toHaveBeenCalledWith("/pages/about/", { title: "About us", body: "New text" });
    expect(await screen.findByRole("status")).toHaveTextContent("permission");
  });
});

describe("Customers and chat", () => {
  it("opens a customer's orders and a chat transcript with feedback", async () => {
    api.get.mockImplementation((url) => Promise.resolve({ data:
      url === "/admin/customers/" ? [{ id: 5, email: "c@x.com", name: "C", orders: 1 }]
      : url === "/admin/conversations/" ? { feedback: { true: 1 }, conversations: [] }
      : url === "/admin/customers/5/" ? { id: 5, email: "c@x.com", total_spent: "900", joined: "2026-01-01T00:00:00Z", orders: [{ id: 3, status: "shipped", total: "900" }], conversations: [{ id: 8, messages: 2 }] }
      : { id: 8, messages: [{ id: 1, role: "user", content: "hi", feedback: [] }, { id: 2, role: "assistant", content: "hello!", feedback: [true] }] } }));
    wrap(<People />);
    await userEvent.click(await screen.findByRole("button", { name: "View" }));
    expect(await screen.findByText(/Order #3 · shipped/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Chat #8/ }));
    expect(await screen.findByText(/hello!/)).toBeInTheDocument();
  });
});

describe("Assistant tools", () => {
  it("runs the retrieval tester and shows scores and index type", async () => {
    api.get.mockImplementation((url) => Promise.resolve({ data: url === "/knowledge/config/" ? { min_score: 0.2, top_k: 4, llm_enabled: true, embedding_provider: "hash" } : [] }));
    api.post.mockResolvedValue({ data: { latency_ms: 3.2, vector_index: true, results: [{ score: 0.71, document: "Return Policy", embedder: "hash", snippet: "7 days" }] } });
    wrap(<Knowledge />);
    await userEvent.type(await screen.findByLabelText("Test question"), "returns?");
    await userEvent.click(screen.getByRole("button", { name: "Test" }));
    expect(await screen.findByText(/pgvector index/)).toBeInTheDocument();
    expect(screen.getByText("0.71")).toBeInTheDocument();
  });
});

describe("Inbox", () => {
  it("lists contact messages and marks one as handled", async () => {
    api.get.mockResolvedValue({ data: { subscribers: 3, messages: [{ id: 4, name: "Asha", email: "a@x.com", subject: "Delivery", message: "Do you deliver to Pune?", handled: false, created_at: "2026-01-01T00:00:00Z" }] } });
    api.post.mockResolvedValue({ data: { id: 4, handled: true } });
    wrap(<Inbox />);
    expect(await screen.findByText("Do you deliver to Pune?")).toBeInTheDocument();
    expect(screen.getByText(/3 newsletter subscribers/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mark as handled" }));
    expect(api.post).toHaveBeenCalledWith("/admin/inbox/4/handled/", { handled: true });
  });
  it("shows a permission error", async () => {
    api.get.mockRejectedValue({ response: { data: { detail: "You do not have permission to perform this action." } } });
    wrap(<Inbox />);
    expect(await screen.findByRole("alert")).toHaveTextContent("permission");
  });
});
