import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/Auth";
import { UIProvider } from "./context/UI";
export function renderApp(ui, { route = "/" } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={[route]}><AuthProvider><UIProvider>{ui}</UIProvider></AuthProvider></MemoryRouter></QueryClientProvider>);
}
