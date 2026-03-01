"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

const statusOptions = [
  { value: "pending", label: "En attente" },
  { value: "processing", label: "En cours" },
  { value: "shipped", label: "En livraison" },
  { value: "delivered", label: "Livree" },
  { value: "cancelled", label: "Annulee" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const formatOrderDateTime = (value: any) => {
    if (!value) return "-";
    const date = new Date(value);
    return isNaN(date.getTime()) ? "-" : date.toLocaleString();
  };

  const fetchOrders = useCallback(async (targetPage: number = 1) => {
    setIsLoading(true);
    try {
      const res = await api.get(
        `/orders?paginated=true&page=${targetPage}&limit=20&includeItems=false&_t=${Date.now()}`,
      );
      const data = res.data;
      if (Array.isArray(data)) {
        setOrders(data);
        setPage(targetPage);
        setTotal(data.length);
        setTotalPages(1);
      } else {
        setOrders(data.orders || []);
        setPage(data.page || targetPage);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      toast.error("Echec du chargement des commandes");
      setOrders([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
    const onOrderChanged = () => fetchOrders(page);
    window.addEventListener("ordersUpdated", onOrderChanged);
    return () => window.removeEventListener("ordersUpdated", onOrderChanged);
  }, [fetchOrders, page]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}`, { status: newStatus });
      toast.success("Statut mis a jour");
      fetchOrders(page);
    } catch (error) {
      toast.error("Echec de mise a jour du statut");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Gerer les commandes</h1>
          <p className="text-gray-600">Total: {total}</p>
        </div>
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
                    <td className="px-4 py-2">{formatOrderDateTime(order.createdAt)}</td>
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

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => fetchOrders(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Precedent
            </button>
            <span className="text-gray-700">
              Page {page} sur {totalPages}
            </span>
            <button
              onClick={() => fetchOrders(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || isLoading}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
