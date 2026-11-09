import axios from "axios";
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1" });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("access");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(null, async (err) => {
  const orig = err.config, refresh = localStorage.getItem("refresh");
  if (err.response?.status === 401 && refresh && !orig._retry) {
    orig._retry = true;
    try {
      const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh/`, { refresh });
      localStorage.setItem("access", data.access);
      return api(orig);
    } catch { localStorage.clear(); }
  }
  return Promise.reject(err);
});
export const errMsg = (e) => {
  const d = e.response?.data;
  if (!d) return "Network error. The server may be waking up; try again in a few seconds.";
  const x = d.detail || d.errors || d;
  return typeof x === "string" ? x : Object.values(x).flat().join(" ");
};
