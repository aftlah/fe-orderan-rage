"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  startTransition,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/alert";

interface Member {
  id: string;
  nama: string;
}

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  category_id: string;
  name: string;
  price: number;
}

interface CartItem {
  itemId: string;
  itemName: string;
  category: string;
  price: number;
  qty: number;
}

interface OrderWindow {
  id: string;
  order_no?: string;
  start_time: string;
  end_time: string;
  status?: string;
}

interface OrderWindowRow extends OrderWindow {
  orderanke?: number;
  announced_open?: boolean;
  announced_close?: boolean;
  is_active?: boolean;
}

interface MyOrder {
  item: string;
  qty: number;
  subtotal: number;
}

export default function OrderPage() {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const CATALOG: Record<string, { name: string; price: number }[]> = useMemo(
    () => ({
      Gun: [
        { name: "PISTOL .50", price: 9100 },
        { name: "CERAMIC PISTOL", price: 26000 },
        { name: "TECH 9", price: 26000 },
        { name: "MINI SMG", price: 29900 },
        { name: "MICRO SMG", price: 29900 },
        { name: "SMG", price: 39000 },
        { name: "SHOTGUN", price: 65000 },
        { name: "NAVY REVOLVER", price: 71500 },
        { name: "PISTOL X17", price: 32500 },
        { name: "BLACK REVOLVER", price: 91000 },
        { name: "KVR", price: 78000 },
      ],
      Ammo: [
        { name: "AMMO 9MM", price: 2730 },
        { name: "AMMO 44 MAGNUM", price: 5200 },
        { name: "AMMO 0.45", price: 5200 },
        { name: "AMMO 12 GAUGE", price: 6500 },
        { name: "AMMO .50", price: 750 },
      ],
      Attachment: [
        { name: "Tactical Flashlight", price: 3000 },
        { name: "Suppressor", price: 10000 },
        { name: "Tactical Suppressor", price: 10000 },
        { name: "Grip", price: 3000 },
        { name: "Extended Pistol Clip", price: 3000 },
        { name: "Extended SMG Clip", price: 5000 },
        { name: "Extended Rifle Clip", price: 15000 },
        { name: "SMG Drum", price: 10000 },
        { name: "Rifle Drum", price: 20000 },
        { name: "Macro Scope", price: 3000 },
        { name: "Medium Scope", price: 3000 },
      ],
      Others: [
        { name: "VEST", price: 2600 },
        { name: "VEST MEDIUM", price: 1300 },
        { name: "LOCKPICK", price: 1300 },
      ],
    }),
    []
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [orderNo, setOrderNo] = useState("");
  const [orderWindow, setOrderWindow] = useState<OrderWindowRow | null>(null);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [memberFilteredName, setMemberFilteredName] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [orderankeValue, setOrderankeValue] = useState("");
  const openAnnounceLock = useRef(new Set<string>());
  const closeAnnounceLock = useRef(new Set<string>());

  const ITEM_MAX_LIMITS: Record<string, number> = useMemo(
    () => ({
      "PISTOL .50": 60,
      "CERAMIC PISTOL": 30,
      "MICRO SMG": 20,
      "AMMO 9MM": 250,
      "AMMO .50": 100,
      VEST: 125,
      "VEST MEDIUM": 150,
      LOCKPICK: 60,
    }),
    []
  );

  const showAlert = useCallback(
    (message: string, type: "success" | "error") => {
      setAlertMessage(message);
      setAlertType(type);
      setTimeout(() => setAlertMessage(""), 3000);
    },
    []
  );

  const computeOrderNo = () => {
    const d = new Date();
    const month = d.getMonth() + 1;
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const offset = first.getDay();
    const week = Math.ceil((d.getDate() + offset) / 7);
    const value = month * 10 + week;
    const label = `M${month}-W${week}`;
    return { month, week, value, label };
  };

  const parseOrderanke = (orderNoStr?: string): number | null => {
    if (!orderNoStr) return null;
    const m = orderNoStr.match(/M(\d+)-W(\d+)/i);
    if (!m) return null;
    const month = Number(m[1]);
    const week = Number(m[2]);
    if (!month || !week) return null;
    return month * 10 + week;
  };

  const getNowIso = () => new Date().toISOString();

  const fmtDateTime = (iso?: string) => {
    try {
      return new Date(iso ?? "").toLocaleString();
    } catch {
      return String(iso ?? "");
    }
  };

  const fmtUiDateTime = (iso?: string) => {
    const d = new Date(iso ?? "");
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(
      d.getMonth() + 1
    )}/${d.getFullYear()}, ${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(
      d.getSeconds()
    )}`;
  };

  const discordWebhook = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL || "";
  const postToDiscord = useCallback(
    async (message: string) => {
      if (!discordWebhook) return;
      try {
        await fetch(discordWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message }),
        });
      } catch {}
    },
    [discordWebhook]
  );

  const announceOpenedWindows = useCallback(async () => {
    try {
      const now = getNowIso();
      const res = await fetch(`${baseUrl}/api/windows`);
      if (!res.ok) return;
      const data = await res.json();
      const rows: OrderWindowRow[] = Array.isArray(data) ? data : [];
      let announced: string[] = [];
      try {
        announced = JSON.parse(localStorage.getItem("open_announced") || "[]");
      } catch {}
      const set = new Set<string>(announced);
      for (const r of rows) {
        if (!r || !r.id) continue;
        if (r.announced_open === true) continue;
        if (set.has(String(r.id))) continue;
        if (openAnnounceLock.current.has(String(r.id))) continue;
        openAnnounceLock.current.add(String(r.id));
        const v = r.orderanke ?? parseOrderanke(r.order_no);
        const label = v
          ? `M${Math.floor(Number(v) / 10)}-W${Number(v) % 10}`
          : "Periode";
        const start = fmtDateTime(r.start_time);
        const end = fmtDateTime(r.end_time);
        const msg = `@here\n# Open Order\nPeriode ${label}\nDibuka dari ${start} sampai ${end}\nSilakan submit sebelum tutup periode.`;
        await postToDiscord(msg);
        set.add(String(r.id));
        // Hanya GET status dari endpoint windows dan kirim ke Discord.
        // Tidak perlu memanggil endpoint announce-open lagi.
        openAnnounceLock.current.delete(String(r.id));
      }
      try {
        localStorage.setItem("open_announced", JSON.stringify(Array.from(set)));
      } catch {}
    } catch {}
  }, [baseUrl, postToDiscord]);

  const expireOrderWindows = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/windows`);
      if (!res.ok) return;
      const data = await res.json();
      const rows: OrderWindowRow[] = Array.isArray(data) ? data : [];
      let announced: string[] = [];
      try {
        announced = JSON.parse(
          localStorage.getItem("closed_announced") || "[]"
        );
      } catch {}
      const set = new Set<string>(announced);
      for (const r of rows) {
        if (!r || !r.id) continue;
        // Hanya announce close jika window sudah tidak aktif dan belum ditandai announced_close
        if (r.is_active === true) continue;
        if (r.announced_close === true) continue;
        if (set.has(String(r.id))) continue;
        if (closeAnnounceLock.current.has(String(r.id))) continue;
        closeAnnounceLock.current.add(String(r.id));
        const v = r.orderanke ?? parseOrderanke(r.order_no);
        const label = v
          ? `M${Math.floor(Number(v) / 10)}-W${Number(v) % 10}`
          : "Periode";
        const start = fmtDateTime(r.start_time);
        const end = fmtDateTime(r.end_time);
        const msg = `@here\n# Orderan periode ${label} telah ditutup.\nDibuka dari ${start} sampai ${end}\nDi tunggu open order selanjutnya yaa`;
        await postToDiscord(msg);
        set.add(String(r.id));
        try {
          const token = localStorage.getItem("auth_token") || "";
          await fetch(`${baseUrl}/api/windows/${r.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ announced_close: true }),
          });
        } catch {}
        closeAnnounceLock.current.delete(String(r.id));
      }
      try {
        localStorage.setItem(
          "closed_announced",
          JSON.stringify(Array.from(set))
        );
      } catch {}
    } catch {}
  }, [baseUrl, postToDiscord]);

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, windowRes] = await Promise.all([
        fetch(`${baseUrl}/api/members`),
        fetch(`${baseUrl}/api/windows`),
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }

      const categoriesData: Category[] = Object.keys(CATALOG).map((name) => ({
        id: name,
        name,
      }));
      const itemsData: Item[] = Object.entries(CATALOG).flatMap(
        ([categoryName, items]) =>
          items.map((it) => ({
            id: it.name,
            category_id: categoryName,
            name: it.name,
            price: it.price,
          }))
      );
      setCategories(categoriesData);
      setItems(itemsData);
      const defaultCat = "Gun";
      const defaultItem =
        itemsData.find((i) => i.category_id === defaultCat)?.id ?? "";
      setSelectedCategory((prev) => prev || defaultCat);
      setSelectedItem((prev) => prev || defaultItem);

      if (windowRes.ok) {
        const windows: OrderWindowRow[] = await windowRes.json();
        const active = Array.isArray(windows)
          ? windows.find((w) => w.is_active)
          : null;
        setOrderWindow(active ?? null);
        const v = active?.orderanke ?? parseOrderanke(active?.order_no);
        if (v) {
          setOrderankeValue(String(v));
          const m = Math.floor(Number(v) / 10);
          const w = Number(v) % 10;
          setOrderNo(`M${m}-W${w} (#${v})`);
        } else {
          const c = computeOrderNo();
          setOrderankeValue(String(c.value));
          setOrderNo(`${c.label} (#${c.value})`);
        }
      } else {
        const c = computeOrderNo();
        setOrderankeValue(String(c.value));
        setOrderNo(`${c.label} (#${c.value})`);
      }

      await announceOpenedWindows();
      await expireOrderWindows();

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      showAlert("Failed to load data", "error");
      setLoading(false);
    }
  }, [baseUrl, CATALOG, showAlert, announceOpenedWindows, expireOrderWindows]);

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
  }, [fetchData]);

  const fetchMyOrders = async (memberId: string) => {
    if (!memberId) {
      setMyOrders([]);
      return;
    }
    try {
      const response = await fetch(`${baseUrl}/api/orders/member/${memberId}`);
      if (response.ok) {
        const data = await response.json();
        setMyOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch my orders:", err);
    }
  };

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category_id === selectedCategory)
    : [];
  const filteredMembers = members.filter((m) =>
    (m?.nama ?? "")
      .toLowerCase()
      .includes((memberFilteredName ?? "").toLowerCase())
  );

  const isOrderWindowOpen =
    !!orderWindow &&
    orderWindow.is_active === true &&
    new Date(orderWindow.start_time) <= new Date() &&
    new Date() <= new Date(orderWindow.end_time);

  const handleAddItem = () => {
    if (!selectedItem || !selectedMemberId) {
      showAlert("Pilih nama dan item terlebih dahulu", "error");
      return;
    }

    const item = items.find((i) => i.id === selectedItem);
    const category = categories.find((c) => c.id === item?.category_id);

    if (item && category) {
      const existingItem = cart.find((c) => c.itemId === selectedItem);
      if (existingItem) {
        setCart(
          cart.map((c) =>
            c.itemId === selectedItem ? { ...c, qty: c.qty + quantity } : c
          )
        );
      } else {
        setCart([
          ...cart,
          {
            itemId: item.id,
            itemName: item.name,
            category: category.name,
            price: item.price,
            qty: quantity,
          },
        ]);
      }
      setQuantity(1);
      // showAlert("", "success");
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(cart.filter((c) => c.itemId !== itemId));
    showAlert("Item removed from cart", "success");
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      showAlert("Please add items to order", "error");
      return;
    }

    if (!selectedMemberId) {
      showAlert("Please select a member", "error");
      return;
    }

    try {
      const payload = {
        memberId: Number(selectedMemberId),
        orderanke: Number(orderankeValue) || undefined,
        delivered: false,
        items: cart.map((c) => ({
          itemId: c.itemId,
          itemName: c.itemName,
          kategori: c.category,
          harga: c.price,
          qty: c.qty,
          ...(ITEM_MAX_LIMITS[c.itemName] !== undefined
            ? { maxQty: ITEM_MAX_LIMITS[c.itemName] }
            : {}),
        })),
      };

      const response = await fetch(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(payload),
      });

      console.log(JSON.stringify(payload));

      if (response.ok) {
        setCart([]);
        setSelectedMemberId("");
        setMemberFilteredName("");
        showAlert("Order submitted successfully", "success");
        fetchMyOrders(selectedMemberId);
        fetchData();
      } else {
        showAlert("Failed to submit order", "error");
      }
    } catch (err) {
      console.error("Failed to submit order:", err);
      showAlert("Failed to submit order", "error");
    }
  };

  const handleReset = () => {
    setCart([]);
    setSelectedMemberId("");
    setSelectedCategory("");
    setSelectedItem("");
    setQuantity(1);
    setMyOrders([]);
  };

  const handleMemberSelect = (memberId: string, memberName: string) => {
    setSelectedMemberId(memberId);
    setMemberFilteredName(memberName);
    setShowMemberDropdown(false);
    fetchMyOrders(memberId);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalMyOrders = myOrders.reduce(
    (sum, order) => sum + order.subtotal,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-slate-500 dark:text-yellow-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Alert message={alertMessage} type={alertType} />
      <main className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        <section id="orderSection">
          {/* Order Form Section */}
          <div className="rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg hover:shadow-xl transition p-8 mb-8">
            <h2 className="section-title text-xl font-extrabold mb-6 text-yellow-100 flex items-center gap-3">
              <span className="section-divider w-1 h-6 rounded-full bg-linear-to-b from-amber-600 to-yellow-500"></span>
              Order Form
            </h2>

            {orderWindow && (
              <>
                <div
                  className={`mb-2 px-4 py-2 rounded-lg text-white font-medium ${
                    isOrderWindowOpen ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {isOrderWindowOpen
                    ? "Order sedang dibuka"
                    : "Order Sedang Ditutup"}
                </div>
                <p className="mb-4 text-xs md:text-sm text-slate-600 dark:text-yellow-300/80">
                  {isOrderWindowOpen
                    ? `Buka: ${fmtUiDateTime(
                        orderWindow.start_time
                      )} • Tutup: ${fmtUiDateTime(
                        orderWindow.end_time
                      )} • Periode: ${(() => {
                        const v =
                          orderWindow.orderanke ??
                          parseOrderanke(orderWindow.order_no);
                        return v
                          ? `M${Math.floor(Number(v) / 10)}-W${
                              Number(v) % 10
                            } (#${v})`
                          : "";
                      })()}`
                    : "Menunggu informasi jendela order…"}
                </p>
              </>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="nama"
                    className="text-sm font-semibold  text-yellow-200"
                  >
                    Customer Name
                  </label>
                  <div className="relative">
                    <input
                      id="nama"
                      type="text"
                      autoComplete="off"
                      placeholder="Enter name"
                      value={memberFilteredName}
                      onChange={(e) => {
                        setMemberFilteredName(e.target.value);
                        setShowMemberDropdown(true);
                      }}
                      onFocus={() => setShowMemberDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowMemberDropdown(false), 150)
                      }
                      disabled={!isOrderWindowOpen}
                      className="w-full px-4 py-3 rounded-lg bg-[#0a0805] border border-[#3d342d] text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    {showMemberDropdown && (
                      <div className="absolute left-0 right-0 mt-1 bg-[#1f1410] border border-[#3d342d] rounded-lg shadow max-h-60 overflow-auto z-50">
                        {filteredMembers.length > 0 ? (
                          filteredMembers.slice(0, 10).map((m) => (
                            <div
                              key={m.id}
                              onClick={() => handleMemberSelect(m.id, m.nama)}
                              className="px-4 py-2 hover:bg-amber-900/20 cursor-pointer text-[#fef3c7]"
                            >
                              {m.nama}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-slate-400">
                            No members found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="orderNo"
                    className="text-sm font-semibold  text-yellow-200"
                  >
                    Order No.
                  </label>
                  <input
                    id="orderNo"
                    type="text"
                    readOnly
                    value={orderNo}
                    className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none font-[var(--font-mono)]"
                  />
                  <input
                    id="orderankeHidden"
                    type="hidden"
                    value={orderankeValue}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold  text-yellow-200">
                    Total Items
                  </label>
                  <div className="px-4 py-3 rounded-lg bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-amber-300 dark:border-yellow-600 text-amber-900 text-yellow-200 font-semibold">
                    <span id="total-items" className="font-[var(--font-mono)]">
                      {totalItems}
                    </span>{" "}
                    items
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="kategori"
                    className="text-sm font-semibold  text-yellow-200"
                  >
                    Category
                  </label>
                  <select
                    id="kategori"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedItem("");
                    }}
                    disabled={!isOrderWindowOpen}
                    className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label
                    htmlFor="item"
                    className="text-sm font-semibold  text-yellow-200"
                  >
                    Item
                  </label>
                  <select
                    id="item"
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    disabled={!isOrderWindowOpen}
                    className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {filteredItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (${item.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="qty"
                    className="text-sm font-semibold  text-yellow-200"
                  >
                    Qty
                  </label>
                  <input
                    id="qty"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(1, Number.parseInt(e.target.value) || 1)
                      )
                    }
                    disabled={!isOrderWindowOpen}
                    className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  id="addBtn"
                  onClick={handleAddItem}
                  disabled={!isOrderWindowOpen}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 text-[#1f1410] font-semibold shadow hover:shadow-lg hover:-translate-y-0.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg hover:shadow-xl transition p-8 mb-8">
            <h2 className="section-title text-xl font-extrabold mb-6 flex items-center gap-3 text-yellow-100">
              <span className="section-divider w-1 h-6 rounded-full bg-gradient-to-b from-amber-600 to-yellow-500"></span>
              Order Summary
            </h2>

            <div className="overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-yellow-700/30">
                    <th className="px-4 py-4 text-left font-semibold  text-yellow-200">
                      Item
                    </th>
                    <th className="px-4 py-4 text-left font-semibold  text-yellow-200">
                      Category
                    </th>
                    <th className="px-4 py-4 text-right font-semibold  text-yellow-200">
                      Price
                    </th>
                    <th className="px-4 py-4 text-center font-semibold  text-yellow-200">
                      Qty
                    </th>
                    <th className="px-4 py-4 text-right font-semibold  text-yellow-200">
                      Subtotal
                    </th>
                    <th className="px-4 py-4 text-center font-semibold  text-yellow-200">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-yellow-700/20">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div
                          id="emptyState"
                          className="flex flex-col items-center justify-center"
                        >
                          <svg
                            className="w-16 h-16 mb-4 opacity-40 text-slate-400 dark:text-yellow-300/40"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                          <p className="text-slate-600 text-yellow-200 font-medium">
                            Your order is empty
                          </p>
                          <p className="text-slate-400 dark:text-yellow-300/60 text-sm">
                            Add items to get started
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cart.map((item) => (
                      <tr key={item.itemId} className="table-row-hover">
                        <td className="px-4 py-4 text-[#1a1410] dark:text-[#fef3c7]">
                          {item.itemName}
                        </td>
                        <td className="px-4 py-4 text-[#1a1410] dark:text-[#fef3c7]">
                          {item.category}
                        </td>
                        <td className="px-4 py-4 text-right text-[#1a1410] dark:text-[#fef3c7] font-[var(--font-mono)]">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-center text-[#1a1410] dark:text-[#fef3c7] font-[var(--font-mono)]">
                          {item.qty}
                        </td>
                        <td className="px-4 py-4 text-right text-[#1a1410] dark:text-[#fef3c7] font-[var(--font-mono)]">
                          ${(item.price * item.qty).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.itemId)}
                            className="px-3 py-1 rounded-lg border-2 border-yellow-600 text-yellow-300 hover:bg-yellow-900/30 transition"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 sm:p-6 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-yellow-900/40 dark:to-amber-900/40 rounded-xl border-2 border-amber-300 dark:border-yellow-600">
                <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-yellow-100">
                  Total Price
                </span>
                <strong
                  id="totalAmount"
                  className="text-base sm:text-2xl bg-gradient-to-br from-amber-600 to-yellow-500 bg-clip-text text-transparent font-[var(--font-mono)]"
                >
                  ${totalAmount.toFixed(2)}
                </strong>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
                <button
                  id="submitBtn"
                  onClick={handleSubmitOrder}
                  disabled={
                    cart.length === 0 || !selectedMemberId || !isOrderWindowOpen
                  }
                  className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-gradient-to-r from-orange-700 to-amber-600 text-white font-semibold shadow hover:shadow-lg hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none text-sm sm:text-base"
                >
                  Submit Order
                </button>
                <button
                  id="resetBtn"
                  onClick={handleReset}
                  disabled={!isOrderWindowOpen}
                  className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg border-2 border-yellow-600 dark:border-yellow-500 text-yellow-700 dark:text-yellow-300 font-semibold hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                <div
                  id="status"
                  className="flex-1 text-xs sm:text-sm text-slate-600 dark:text-yellow-300/70 flex items-center"
                ></div>
              </div>
            </div>
          </div>

          {/* Your Orders (This Period) Section */}
          <div className="rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg hover:shadow-xl transition p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title text-xl font-bold flex items-center gap-3 text-yellow-100">
                <span className="section-divider w-1 h-6 rounded-full bg-gradient-to-b from-amber-600 to-yellow-500"></span>
                Your Orders (This Period)
              </h2>
              <div className="flex items-center gap-3">
                <span
                  id="myOrdersPeriod"
                  className="text-sm text-slate-500 dark:text-yellow-300/70"
                ></span>
                <button
                  id="myOrdersEditBtn"
                  className="hidden px-3 py-1 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 text-yellow-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                >
                  Edit
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-yellow-700/30">
                    <th className="text-left px-2 py-2 font-semibold  text-yellow-200">
                      Item
                    </th>
                    <th className="text-center px-2 py-2 font-semibold  text-yellow-200">
                      Qty
                    </th>
                    <th className="text-right px-2 py-2 font-semibold  text-yellow-200">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody
                  id="myOrdersBody"
                  className="divide-y divide-slate-100 dark:divide-yellow-700/20"
                >
                  {myOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-sm text-slate-500 dark:text-yellow-300/70 mt-3 px-2 py-3"
                      >
                        Belum ada order di periode ini
                      </td>
                    </tr>
                  ) : (
                    myOrders.map((order, idx) => (
                      <tr key={idx} className="table-row-hover">
                        <td className="px-2 py-2 text-[#1a1410] dark:text-[#fef3c7]">
                          {order.item}
                        </td>
                        <td className="px-2 py-2 text-center text-[#1a1410] dark:text-[#fef3c7]">
                          {order.qty}
                        </td>
                        <td className="px-2 py-2 text-right text-[#1a1410] dark:text-[#fef3c7]">
                          ${order.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div
              id="myOrdersEmpty"
              className={`text-sm text-slate-500 dark:text-yellow-300/70 mt-3 ${
                myOrders.length > 0 ? "hidden" : ""
              }`}
            >
              Belum ada order di periode ini
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-sm font-semibold  text-yellow-200">
                Total:
              </span>
              <span
                id="myOrdersTotal"
                className="ml-2 text-sm font-semibold  text-yellow-200"
              >
                ${totalMyOrders.toFixed(2)}
              </span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
