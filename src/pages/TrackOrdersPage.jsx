import React, { useEffect, useState } from "react";
import { storeApi } from "../api/storeApi";
import OrderTracker from "../components/OrderTracker";

export default function TrackOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeApi
      .getMyOrders()
      .then((res) => setOrders(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <h2 className="page-title">My Custom Tailoring Orders</h2>
      {loading ? (
        <p>Loading your orders...</p>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          You haven't placed any custom orders yet.
        </div>
      ) : (
        orders.map((order) => <OrderTracker key={order.id} order={order} />)
      )}
    </div>
  );
}
