"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Alert } from "@/components/alert";

interface Member {
  id: string;
  name: string;
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
  order_no: string;
  start_time: string;
  end_time: string;
  status: string;
}

 

export default function OrderPage() {
  const router = useRouter();
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
  const [orderWindow, setOrderWindow] = useState<OrderWindow | null>(null);
  
  const [memberFilteredName, setMemberFilteredName] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      router.push("/login");
      return;
    }
    // fetchData() is hoisted; safe to call here
  }, [router]);

  

  const fetchData = async () => {
    try {
      const [membersRes, categoriesRes, itemsRes, windowRes] =
        await Promise.all([
          fetch("/api/members"),
          fetch("/api/categories"),
          fetch("/api/items"),
          fetch("/api/order-window"),
        ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData);
      }

      if (windowRes.ok) {
        const windowData = await windowRes.json();
        setOrderNo(windowData.order_no || "");
        setOrderWindow(windowData);
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      showAlert("Failed to load data", "error");
      setLoading(false);
    }
  };

  const showAlert = (message: string, type: "success" | "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => setAlertMessage(""), 3000);
  };

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category_id === selectedCategory)
    : [];
  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(memberFilteredName.toLowerCase())
  );

  const handleAddItem = () => {
    if (!selectedItem || !selectedMemberId) {
      showAlert("Please select member and item", "error");
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
      setSelectedItem("");
      setQuantity(1);
      showAlert("Item added to cart", "success");
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
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          memberId: selectedMemberId,
          items: cart,
          total: totalAmount,
        }),
      });

      if (response.ok) {
        setCart([]);
        setSelectedMemberId("");
        showAlert("Order submitted successfully", "success");
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
  };

  const isOrderWindowOpen =
    orderWindow &&
    new Date(orderWindow.start_time) <= new Date() &&
    new Date() <= new Date(orderWindow.end_time);

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
      <Header />
      <Alert message={alertMessage} type={alertType} />
      <main className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        {/* Order Form */}
        <div className="rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg hover:shadow-xl transition p-8 mb-8">
          <h2 className="section-title text-xl font-bold mb-6 flex items-center gap-3">
            <span className="section-divider w-1 h-6 rounded-full bg-linear-to-b from-amber-600 to-yellow-500"></span>
            Order Form
          </h2>

          {orderWindow && (
            <div
              className={`mb-4 px-4 py-2 rounded-lg text-white font-semibold ${
                isOrderWindowOpen ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {isOrderWindowOpen
                ? "Order sedang dibuka"
                : "Order window closed"}
            </div>
          )}
          {orderWindow && (
            <p className="mb-4 text-xs md:text-sm text-slate-600 dark:text-yellow-300/80">
              Window: {new Date(orderWindow.start_time).toLocaleString()} to{" "}
              {new Date(orderWindow.end_time).toLocaleString()}
            </p>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                  Customer Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Enter name"
                    value={memberFilteredName}
                    onChange={(e) => {
                      setMemberFilteredName(e.target.value);
                      setShowMemberDropdown(true);
                    }}
                    onFocus={() => setShowMemberDropdown(true)}
                    className="w-full px-4 py-3 rounded-lg bg-[#0a0805] border border-[#3d342d] text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {showMemberDropdown && memberFilteredName && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#1f1410] border border-[#3d342d] rounded-lg shadow max-h-60 overflow-auto z-50">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setMemberFilteredName(m.name);
                              setSelectedMemberId(m.id);
                              setShowMemberDropdown(false);
                            }}
                            className="px-4 py-2 hover:bg-amber-900/20 cursor-pointer text-[#fef3c7]"
                          >
                            {m.name}
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
                <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                  Order No.
                </label>
                <input
                  type="text"
                  readOnly
                  value={orderNo}
                  className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                  Total Items
                </label>
                <div className="px-4 py-3 rounded-lg bg-linear-to-r from-amber-100 to-yellow-100 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200 font-semibold">
                  <span>{cart.reduce((sum, item) => sum + item.qty, 0)}</span>{" "}
                  items
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedItem("");
                  }}
                  className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                  Item
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Item</option>
                  {filteredItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (${item.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                  Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(1, Number.parseInt(e.target.value) || 1)
                    )
                  }
                  className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={handleAddItem}
                className="px-6 py-3 rounded-lg bg-linear-to-r from-amber-600 to-yellow-500 text-[#1f1410] font-semibold shadow hover:shadow-lg hover:-translate-y-0.5 transition"
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg hover:shadow-xl transition p-8">
          <h2 className="section-title text-xl font-bold mb-6 flex items-center gap-3">
            <span className="section-divider w-1 h-6 rounded-full bg-linear-to-b from-amber-600 to-yellow-500"></span>
            Order Summary
          </h2>

          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-yellow-700/30">
                  <th className="px-4 py-4 text-left font-semibold text-slate-700 dark:text-yellow-200">
                    Item
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-700 dark:text-yellow-200">
                    Category
                  </th>
                  <th className="px-4 py-4 text-right font-semibold text-slate-700 dark:text-yellow-200">
                    Price
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-slate-700 dark:text-yellow-200">
                    Qty
                  </th>
                  <th className="px-4 py-4 text-right font-semibold text-slate-700 dark:text-yellow-200">
                    Subtotal
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-slate-700 dark:text-yellow-200">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-yellow-700/20">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
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
                        <p className="text-slate-600 dark:text-yellow-200 font-medium">
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
                      <td className="px-4 py-4 text-right text-[#1a1410] dark:text-[#fef3c7]">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-center text-[#1a1410] dark:text-[#fef3c7]">
                        {item.qty}
                      </td>
                      <td className="px-4 py-4 text-right text-[#1a1410] dark:text-[#fef3c7]">
                        ${(item.price * item.qty).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.itemId)}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 sm:p-6 bg-linear-to-r from-amber-100 to-yellow-100 dark:from-yellow-900/40 dark:to-amber-900/40 rounded-xl border-2 border-amber-300 dark:border-yellow-600">
              <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-yellow-100">
                Total Price
              </span>
              <strong className="text-base sm:text-2xl bg-linear-to-br from-amber-600 to-yellow-500 bg-clip-text text-transparent">
                ${totalAmount.toFixed(2)}
              </strong>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || !selectedMemberId}
                className="px-6 py-3 rounded-lg bg-linear-to-r from-orange-700 to-amber-600 text-white font-semibold shadow hover:shadow-lg hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Submit Order
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-lg border-2 border-yellow-600 dark:border-yellow-500 text-yellow-700 dark:text-yellow-300 font-semibold hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition text-sm sm:text-base"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
