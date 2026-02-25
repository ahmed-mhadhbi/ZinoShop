"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

const statusOptions = [
  { value: "pending", label: "En attente" },
  { value: "processing", label: "En cours" },
  { value: "on_the_way", label: "En livraison" },
  { value: "delivered", label: "Livree" },
  { value: "cancelled", label: "Annulee" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    const onOrderChanged = () => fetchOrders();
    window.addEventListener("ordersUpdated", onOrderChanged);
    return () => window.removeEventListener("ordersUpdated", onOrderChanged);
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/orders?limit=100&includeItems=false&_t=" + Date.now());
      setOrders(Array.isArray(res.data) ? res.data : res.data.orders || []);
    } catch (error) {
      toast.error("Echec du chargement des commandes");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}`, { status: newStatus });
      toast.success("Statut mis a jour");
      fetchOrders();
    } catch (error) {
      toast.error("Echec de mise a jour du statut");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="container-custom">
        <h1 className="text-4xl font-bold mb-8">Gerer les commandes</h1>
        {isLoading ? (
          <div>Chargement des commandes...</div>
        ) : orders.length === 0 ? (
          <div>Aucune commande trouvee.</div>
        ) : (
          <div className="card p-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Commande #</th>
                  <th className="px-4 py-2">Utilisateur</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Statut</th>
                  <th className="px-4 py-2">Sous-total</th>
                  <th className="px-4 py-2">Creee le</th>
                  <th className="px-4 py-2">Mettre a jour</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="px-4 py-2 font-mono">
                      <Link href={`/admin/orders/${order.id}`} className="text-primary-600 hover:underline">
                        {order.orderNumber || order.id}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{order.userId}</td>
                    <td className="px-4 py-2">{order.email || order.customerEmail || "-"}</td>
                    <td className="px-4 py-2 capitalize">{order.status}</td>
                    <td className="px-4 py-2">{order.subtotal?.toLocaleString()} tnd</td>
                    <td className="px-4 py-2">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</td>
                    <td className="px-4 py-2">
                      <select
                        className="input-field"
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
