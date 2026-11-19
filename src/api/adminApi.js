import apiClient from "./client";

export const adminApi = {
  createCategory: (data) => apiClient.post("/admin/categories", data),
  deleteCategory: (categoryId) =>
    apiClient.delete(`/admin/categories/${categoryId}`),
  createMeasurementField: (data) =>
    apiClient.post("/admin/measurement-fields", data),
  deleteMeasurementField: (fieldId) =>
    apiClient.delete(`/admin/measurement-fields/${fieldId}`),
  addStock: (data) => apiClient.post("/admin/products", data),
  updateProductStock: (productId, products) =>
    apiClient.patch(`/admin/products/${productId}/stock`, products),
  getAllOrders: () => apiClient.get("/admin/orders"),
  updateOrderStatus: (orderId, status) =>
    apiClient.patch(`/admin/orders/${orderId}/status`, { status }),
  cancelOrder: (orderId, cancellationReason) =>
    apiClient.post(`/admin/orders/${orderId}/cancel`, { cancellationReason }),
  getCustomers: () => apiClient.get("/admin/customers"),
  deleteCustomer: (customerId) =>
    apiClient.delete(`/admin/customers/${customerId}`),
  getOfflineCustomers: () => apiClient.get("/admin/offline-customers"),
  createOfflineCustomer: (data) =>
    apiClient.post("/admin/offline-customers", data),
  updateOfflineCustomer: (id, data) =>
    apiClient.put(`/admin/offline-customers/${id}`, data),
  deleteOfflineCustomer: (id) =>
    apiClient.delete(`/admin/offline-customers/${id}`),
};
