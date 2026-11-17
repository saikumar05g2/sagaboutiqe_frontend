import apiClient from "./client";

export const storeApi = {
  login: (data) => apiClient.post("/auth/login", data),
  register: (data) => apiClient.post("/auth/register", data),
  getProducts: (category = "ALL", page, limit) => {
    const params = new URLSearchParams({ category });
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    return apiClient.get(`/store/products?${params.toString()}`);
  },
  getCategories: () => apiClient.get("/store/categories"),
  getMeasurementFields: () => apiClient.get("/store/measurement-fields"),
  saveMeasurement: (data) => apiClient.post("/store/measurements", data),
  getMeasurements: () => apiClient.get("/store/measurements"),
  createCheckout: (data) => apiClient.post("/store/checkout", data),
  verifyPayment: (data) => apiClient.post("/store/verify-payment", data),
  getMyOrders: () => apiClient.get("/store/my-orders"),
};
