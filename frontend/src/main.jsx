import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/Auth";
import { UIProvider } from "./context/UI";
import App from "./App";
import "./index.css";
createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={new QueryClient()}><BrowserRouter><AuthProvider><UIProvider><App /></UIProvider></AuthProvider></BrowserRouter></QueryClientProvider>
);
