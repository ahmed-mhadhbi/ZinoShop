"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params as any)?.id;
  const [order, setOrder] = useState<any | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;
    fetchOrder(id);
  }, [id]);

  const fetchOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      const orderData = res.data;
      setOrder(orderData);

      if (orderData.customerFirstName || orderData.customerLastName) {
        setUserName(`${orderData.customerFirstName || ""} ${orderData.customerLastName || ""}`.trim());
      } else if (orderData.userId) {
        try {
          const userRes = await api.get(`/users/${orderData.userId}`);
          const user = userRes.data;
          setUserName(`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email);
        } catch (err) {
          // noop
        }
      }
    } catch (error) {
      toast.error("Echec du chargement de la commande");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="pt-24">Chargement de la commande...</div>;
  if (!order) return <div className="pt-24">Commande introuvable</div>;

  const address = [
    order.shippingAddress,
    order.shippingCity,
    order.shippingState,
    order.shippingZipCode,
    order.shippingCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Details de la commande</h1>
          <Link href="/admin/orders" className="text-sm text-primary-600 hover:underline">Retour a la liste</Link>
        </div>

        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Commande #{order.orderNumber || order.id}</h2>
              <p className="text-sm text-gray-600 mb-4">Statut: <span className="capitalize">{order.status}</span></p>

              <h3 className="text-sm font-semibold">Client</h3>
              <p className="mb-4">{userName || order.email || order.customerEmail || "-"}</p>

              <h3 className="text-sm font-semibold">Email</h3>
              <p className="mb-4">{order.email || order.customerEmail || "-"}</p>

              <h3 className="text-sm font-semibold">Telephone</h3>
              <p className="mb-4">{order.shippingPhone || "-"}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Adresse de livraison</h3>
              <p className="mb-4">{address || "-"}</p>

              <h3 className="text-sm font-semibold">Notes</h3>
              <p className="mb-4 text-sm text-gray-700">{order.notes || "-"}</p>

              <h3 className="text-sm font-semibold">Sous-total</h3>
              <p className="mb-4">{order.subtotal?.toLocaleString() || 0} tnd</p>

              <h3 className="text-sm font-semibold">Total</h3>
              <p className="mb-4">{order.total?.toLocaleString() || 0} tnd</p>
            </div>
          </div>
        </div>

        <div className="card p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Articles</h2>
          {order.items && order.items.length > 0 ? (
            <ul className="space-y-3">
              {order.items.map((item: any) => (
                <li key={item.id || `${item.productId}-${item.quantity}`} className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{item.productName || item.name || item.productId}</div>
                    {item.productSku && <div className="text-sm text-gray-500">SKU: {item.productSku}</div>}
                    {item.variant && <div className="text-sm text-gray-500">Variante: {item.variant}</div>}
                  </div>
                  <div className="text-sm">Qt: <span className="font-semibold">{item.quantity}</span></div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">Aucun article trouve pour cette commande.</p>
          )}
        </div>
      </div>
    </div>
  );
}
