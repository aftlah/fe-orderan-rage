"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/alert";

interface Member {
  id: string;
  name: string;
  created_at: string;
}

interface OrderWindow {
  id: string;
  order_no: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface OrderData {
  member_name: string;
  items: Array<{
    name: string;
    qty: number;
    subtotal: number;
  }>;
  total: number;
}

interface OrderDetailRow {
  order_no: string;
  member_name: string;
  created_at: string;
  item_name: string;
  qty: number;
  subtotal: number;
  delivered?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [windows, setWindows] = useState<OrderWindow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedName, setSelectedName] = useState("");
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [dashboardData, setDashboardData] = useState<OrderData[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetailRow[]>([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [winStart, setWinStart] = useState("");
  const [winEnd, setWinEnd] = useState("");
  const [winMonth, setWinMonth] = useState("");
  const [winWeek, setWinWeek] = useState("");
  const [editingWindowId, setEditingWindowId] = useState<string | null>(null);

  const GROUP_ORDER = [
    "ORDER KE HIGH TABEL",
    "ORDER KE ALLSTAR",
    "ORDER KE RDMC",
    "LAINNYA",
  ];

  const GROUP_ITEMS: Record<string, string[]> = {
    "ORDER KE HIGH TABEL": [
      "SMG",
      "SHOTGUN",
      "NAVY REVOLVER",
      "PISTOL X17",
      "BLACK REVOLVER",
      "KVR",
      "TECH 9",
      "TECH9",
      "MINI SMG",
      "AMMO 44 MAGNUM",
      "AMMO 0.45",
      "AMMO 12 GAUGE",
      "VEST",
    ],
    "ORDER KE ALLSTAR": [
      "PISTOL .50",
      "CERAMIC PISTOL",
      "MICRO SMG",
      "AMMO 9MM",
      "AMMO .50",
      "VEST MEDIUM",
      "LOCKPICK",
    ],
    "ORDER KE RDMC": [
      "Tactical Flashlight",
      "Suppressor",
      "Tactical Suppressor",
      "Grip",
      "Extended Pistol Clip",
      "Extended SMG Clip",
      "Extended Rifle Clip",
      "SMG Drum",
      "Rifle Drum",
      "Macro Scope",
      "Medium Scope",
    ],
    LAINNYA: [],
  };

  const formatCurrency = (n: number) =>
    (Number(n) || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  const groupAggregates: Map<
    string,
    Map<string, { qty: number; harga: number; subtotal: number }>
  > = useMemo(() => {
    const groups = new Map<
      string,
      Map<string, { qty: number; harga: number; subtotal: number }>
    >();
    for (const order of dashboardData) {
      for (const it of order.items || []) {
        const itemName = it.name;
        const groupName =
          GROUP_ORDER.find((g) => (GROUP_ITEMS[g] || []).includes(itemName)) ||
          "LAINNYA";
        const unitPrice = it.qty ? Number(it.subtotal) / Number(it.qty) : 0;
        if (!groups.has(groupName)) groups.set(groupName, new Map());
        const map = groups.get(groupName)!;
        const prev = map.get(itemName) || {
          qty: 0,
          harga: unitPrice,
          subtotal: 0,
        };
        prev.qty += Number(it.qty || 0);
        prev.subtotal += Number(it.subtotal || 0);
        prev.harga = prev.qty ? prev.subtotal / prev.qty : unitPrice;
        map.set(itemName, prev);
      }
    }
    return groups;
  }, [dashboardData, GROUP_ITEMS, GROUP_ORDER]);

  const groupTotals: Map<string, number> = useMemo(() => {
    const totals = new Map<string, number>();
    for (const [g, items] of groupAggregates.entries()) {
      let sum = 0;
      for (const v of items.values()) sum += v.subtotal;
      totals.set(g, sum);
    }
    return totals;
  }, [groupAggregates]);

  const showAlert = (message: string, type: "success" | "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => setAlertMessage(""), 3000);
  };

  const fetchDashboardData = async (force = false) => {
    try {
      const params = new URLSearchParams();
      params.append("month", String(selectedMonth));
      params.append("week", String(selectedWeek));
      if (selectedName) params.append("name", selectedName);
      const res = await fetch(`${baseUrl}/api/dashboard?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      showAlert("Failed to load dashboard", "error");
    }
  };

  const fetchOrderDetails = async (force = false) => {
    try {
      const params = new URLSearchParams();
      params.append("month", String(selectedMonth));
      params.append("week", String(selectedWeek));

      // console.log("Selected Month:", selectedMonth);
      // console.log("Selected Week:", selectedWeek);
      // console.log("Selected Name:", selectedName);
      const nameParam = (selectedName || "").trim();
      if (nameParam && nameParam.toLowerCase() !== "semua") {
        params.append("name", nameParam);
      }
      const res = await fetch(
        `${baseUrl}/api/orders/details?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      // console.log("Response:", res);
      if (!res.ok) throw new Error("Failed to fetch order details");
      const data = await res.json();
      setOrderDetails(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load order details:", err);
      showAlert("Failed to load order details", "error");
    }
  };

  const loadWindows = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/windows`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch windows");
      const data = await res.json();
      setWindows(data);
    } catch (err) {
      console.error("Failed to load windows:", err);
      showAlert("Failed to load windows", "error");
    }
  };

  const announceOpenedWindows = async () => {
    try {
      await fetch(`${baseUrl}/api/windows`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
    } catch (err) {
      console.error("Failed to announce windows:", err);
    }
  };

  const expireOrderWindows = async () => {
    try {
      await fetch(`${baseUrl}/api/windows`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
    } catch (err) {
      console.error("Failed to expire windows:", err);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const [membersRes, activeWindowRes] = await Promise.all([
          fetch(`${baseUrl}/api/members`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }),
          fetch(`${baseUrl}/api/windows/active`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }),
        ]);

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData);
        }

        if (activeWindowRes.ok) {
          const activeWindow = await activeWindowRes.json();
          if (activeWindow && activeWindow.orderanke) {
            const val = parseInt(activeWindow.orderanke, 10);
            if (!Number.isNaN(val) && val) {
              const m = Math.floor(val / 10);
              const w = val % 10;
              setSelectedMonth(m);
              setSelectedWeek(w);
            }
          }
        }

        setLoading(false);
        await fetchDashboardData(true);
        await fetchOrderDetails(true);
        await loadWindows();
        await announceOpenedWindows();
        await expireOrderWindows();
      } catch (err) {
        console.error("Failed to initialize:", err);
        showAlert("Failed to initialize", "error");
        setLoading(false);
      }
    })();
  }, [router, baseUrl]);

  useEffect(() => {
    fetchDashboardData(false);
    fetchOrderDetails(false);
  }, [selectedMonth, selectedWeek, selectedName]);

  const fetchData = async () => {
    try {
      const [membersRes] = await Promise.all([
        fetch(`${baseUrl}/api/members`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }),
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }

      await fetchDashboardData(true);
      await fetchOrderDetails(true);
      await loadWindows();
    } catch (err) {
      console.error("Failed to fetch data:", err);
      showAlert("Failed to load data", "error");
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      showAlert("Nama member kosong", "error");
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ name: newMemberName.trim() }),
      });

      if (response.ok) {
        setNewMemberName("");
        setShowMemberModal(false);
        showAlert("Member added successfully", "success");
        fetchData();
      } else {
        showAlert("Failed to add member", "error");
      }
    } catch (err) {
      console.error("Failed to add member:", err);
      showAlert("Failed to add member", "error");
    }
  };

  const handleCreateWindow = async () => {
    if (!winStart || !winEnd || !winMonth || !winWeek) {
      showAlert("Please fill in all fields", "error");
      return;
    }

    try {
      const orderanke = parseInt(winMonth, 10) * 10 + parseInt(winWeek, 10);
      const body = {
        start_time: new Date(winStart).toISOString(),
        end_time: new Date(winEnd).toISOString(),
        orderanke,
        is_active: true,
      };

      const endpoint = editingWindowId
        ? `${baseUrl}/api/windows/${editingWindowId}`
        : `${baseUrl}/api/windows`;
      const method = editingWindowId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setWinStart("");
        setWinEnd("");
        setWinMonth("");
        setWinWeek("");
        setEditingWindowId(null);
        showAlert(
          editingWindowId ? "Jadwal diupdate" : "Jadwal dibuat",
          "success"
        );
        await loadWindows();
      } else {
        showAlert("Failed to create/update order window", "error");
      }
    } catch (err) {
      console.error("Failed to create window:", err);
      showAlert("Failed to create order window", "error");
    }
  };

  const startEditWindow = (
    window: Pick<OrderWindow, "id" | "start_time" | "end_time"> & {
      orderanke?: number;
    }
  ) => {
    setWinStart(new Date(window.start_time).toISOString().slice(0, 16));
    setWinEnd(new Date(window.end_time).toISOString().slice(0, 16));
    if (window.orderanke) {
      const m = Math.floor(window.orderanke / 10);
      const w = window.orderanke % 10;
      setWinMonth(String(m));
      setWinWeek(String(w));
    }
    setEditingWindowId(window.id);
  };

  const deleteOrderWindow = async (id: string) => {
    try {
      const res = await fetch(`${baseUrl}/api/windows/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete");
      showAlert("Jadwal dihapus", "success");
      await loadWindows();
    } catch (err) {
      console.error("Failed to delete window:", err);
      showAlert("Failed to delete window", "error");
    }
  };

  const cancelEditWindow = () => {
    setEditingWindowId(null);
    setWinStart("");
    setWinEnd("");
    setWinMonth("");
    setWinWeek("");
  };

  const shareDashboardToDiscord = async () => {
    try {
      const params = new URLSearchParams();
      params.append("month", String(selectedMonth));
      params.append("week", String(selectedWeek));
      if (selectedName) params.append("name", selectedName);
      const res = await fetch(
        `${baseUrl}/api/dashboard/discord?${params.toString()}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to share");
      showAlert("Dashboard dikirim ke Discord", "success");
    } catch (err) {
      console.error("Failed to share to Discord:", err);
      showAlert("Failed to share to Discord", "error");
    }
  };

  const filteredMembers = members.filter((m) =>
    (m?.name ?? "").toLowerCase().includes((selectedName ?? "").toLowerCase())
  );

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleDateString("en-US", { month: "long" }),
  }));

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

  const winOrderNoLabel =
    winMonth && winWeek
      ? `M${winMonth}-W${winWeek} (#${
          parseInt(winMonth) * 10 + parseInt(winWeek)
        })`
      : "";

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
        {/* Dashboard Section */}
        <div className="rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg hover:shadow-xl transition p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title text-xl font-bold flex items-center gap-3">
              <span className="section-divider w-1 h-6 rounded-full"></span>
              Dashboard
            </h2>
            <div className="flex items-center gap-3">
              <button
                id="dashAddMember"
                onClick={() => setShowMemberModal(true)}
                className="px-4 py-2.5 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200 hover:bg-amber-50 dark:hover:bg-yellow-900/20 transition"
              >
                Tambah Member
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end mb-6">
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                Bulan
              </label>
              <select
                id="dashMonth"
                value={selectedMonth}
                onChange={(e) =>
                  setSelectedMonth(Number.parseInt(e.target.value))
                }
                className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                Minggu
              </label>
              <select
                id="dashWeek"
                value={selectedWeek}
                onChange={(e) =>
                  setSelectedWeek(Number.parseInt(e.target.value))
                }
                className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Week {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                Nama
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="dashNameInput"
                    type="text"
                    autoComplete="off"
                    placeholder="Semua"
                    value={selectedName}
                    onChange={(e) => {
                      setSelectedName(e.target.value);
                      setShowNameDropdown(true);
                    }}
                    onFocus={() => setShowNameDropdown(true)}
                    className="w-full min-w-[220px] px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div
                    id="dashNameDropdown"
                    className={`absolute left-0 right-0 mt-1 bg-[#1f1410] border border-[#3d342d] rounded-lg shadow max-h-60 overflow-auto z-50 ${
                      showNameDropdown && selectedName ? "" : "hidden"
                    }`}
                  >
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedName(m.name);
                            setShowNameDropdown(false);
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
                </div>
              </div>
            </div>
            <button
              id="refreshDashboard"
              onClick={() => fetchData()}
              className="px-6 py-3 rounded-lg bg-linear-to-r from-orange-700 to-amber-600 text-white font-semibold shadow hover:shadow-lg hover:-translate-y-0.5 transition"
            >
              Refresh
            </button>
            <button
              id="dashShareDiscord"
              onClick={shareDashboardToDiscord}
              className="px-6 py-3 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200 hover:bg-amber-50 dark:hover:bg-yellow-900/20 transition"
            >
              Kirim ke Discord
            </button>
          </div>

          <div id="dashboardBody" className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-yellow-700/30">
                  <th className="px-4 py-4 text-left font-semibold text-slate-700 dark:text-yellow-200">
                    Member
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-700 dark:text-yellow-200">
                    Items
                  </th>
                  <th className="px-4 py-4 text-right font-semibold text-slate-700 dark:text-yellow-200">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-yellow-700/20">
                {dashboardData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-slate-500 dark:text-yellow-300"
                    >
                      No order data for selected period
                    </td>
                  </tr>
                ) : (
                  dashboardData.map((order, idx) => (
                    <tr key={idx} className="table-row-hover">
                      <td className="px-4 py-4 text-[#1a1410] dark:text-[#fef3c7] font-semibold">
                        {order.member_name}
                      </td>
                      <td className="px-4 py-4 text-[#1a1410] dark:text-[#fef3c7] text-sm">
                        {order.items.map((item) => (
                          <div key={item.name}>
                            {item.name} x{item.qty}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-4 text-right text-[#1a1410] dark:text-[#fef3c7] font-semibold">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-8 rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-yellow-100">
              Total Orderan
            </h3>
            {GROUP_ORDER.map((group) => {
              const items = groupAggregates.get(group);
              if (!items || items.size === 0) return null;
              return (
                <div key={group} className="mb-8">
                  <h4 className="text-md font-extrabold mb-3 text-yellow-100">
                    {group}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-200 dark:border-yellow-700/30">
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-yellow-200">
                            Item
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-yellow-200">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-yellow-200">
                            Harga
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-yellow-200">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-yellow-700/20">
                        {Array.from(items.entries()).map(([name, v]) => (
                          <tr key={name} className="table-row-hover">
                            <td className="px-4 py-3 text-[#1a1410] dark:text-[#fef3c7]">
                              {name}
                            </td>
                            <td className="px-4 py-3 text-[#1a1410] dark:text-[#fef3c7]">
                              {v.qty}
                            </td>
                            <td className="px-4 py-3 text-[#1a1410] dark:text-[#fef3c7]">
                              {formatCurrency(v.harga)}
                            </td>
                            <td className="px-4 py-3 text-right text-[#1a1410] dark:text-[#fef3c7] font-semibold">
                              {formatCurrency(v.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-3 text-right text-slate-700 dark:text-yellow-200 font-semibold"
                          >
                            Total {group}:
                          </td>
                          <td className="px-4 py-3 text-right text-[#1a1410] dark:text-[#fef3c7] font-bold">
                            {formatCurrency(groupTotals.get(group) || 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
            <div className="rounded-xl bg-amber-50 dark:bg-yellow-900/10 border border-amber-200 dark:border-yellow-700/20 p-4">
              <div className="font-bold text-slate-800 dark:text-yellow-100">
                Batch M{selectedMonth}-W{selectedWeek}
              </div>
              <div className="text-sm text-slate-700 dark:text-yellow-200">
                Total:{" "}
                {formatCurrency(
                  dashboardData.reduce((sum, d) => sum + (d.total || 0), 0)
                )}
              </div>
            </div>
            {/* Order Details */}
            <div className="mt-8 rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-yellow-100">
                Order Details
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 dark:border-yellow-700/30">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-yellow-200">
                        Order No.
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-yellow-200">
                        Nama
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-yellow-200">
                        Waktu
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-yellow-200">
                        Item
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-yellow-200">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-yellow-200">
                        Subtotal
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-yellow-200">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-yellow-700/20">
                    {orderDetails.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-slate-500 dark:text-yellow-300"
                        >
                          Tidak ada order untuk periode ini
                        </td>
                      </tr>
                    ) : (
                      orderDetails
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime()
                        )
                        .map((row, idx) => (
                          <tr
                            key={`${row.order_no}-${idx}`}
                            className="table-row-hover"
                          >
                            <td className="px-4 py-3 text-[#1a1410] dark:text-[#fef3c7] font-medium">
                              {row.order_no}
                            </td>
                            <td className="px-4 py-3 text-[#1a1410] dark:text-[#fef3c7]">
                              {row.member_name}
                            </td>
                            <td className="px-4 py-3 text-[#1a1410] dark:text-[#fef3c7]">
                              {fmtUiDateTime(row.created_at)}
                            </td>
                            <td className="px-4 py-3 text-[#1a1410] dark:text-[#fef3c7]">
                              {row.item_name}
                            </td>
                            <td className="px-4 py-3 text-[#1a1410] dark:text-[#fef3c7]">
                              {row.qty}
                            </td>
                            <td className="px-4 py-3 text-right text-[#1a1410] dark:text-[#fef3c7] font-semibold">
                              {formatCurrency(row.subtotal)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-3 py-1 rounded text-xs font-semibold ${
                                  row.delivered
                                    ? "bg-green-600 text-white"
                                    : "bg-amber-700 text-amber-100"
                                }`}
                              >
                                {row.delivered ? "Sudah" : "Belum"}
                              </span>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div
          id="memberModal"
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${
            showMemberModal ? "" : "hidden"
          }`}
        >
          <div className="rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg p-6 w-[90%] max-w-md">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-yellow-100">
              Tambah Member
            </h3>
            <div className="flex flex-col gap-3">
              <input
                id="memberNameInput"
                type="text"
                placeholder="Nama member baru"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex gap-3 justify-end">
                <button
                  id="memberCancelBtn"
                  onClick={() => {
                    setShowMemberModal(false);
                    setNewMemberName("");
                  }}
                  className="px-4 py-3 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200 hover:bg-amber-50 dark:hover:bg-yellow-900/20 transition"
                >
                  Batal
                </button>
                <button
                  id="memberSaveBtn"
                  onClick={handleAddMember}
                  className="px-4 py-3 rounded-lg bg-linear-to-r from-orange-700 to-amber-600 text-white font-semibold shadow hover:shadow-lg transition"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Order Windows Section */}
        <div className="rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg hover:shadow-xl transition p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title text-xl font-bold flex items-center gap-3">
              <span className="section-divider w-1 h-6 rounded-full bg-linear-to-b from-amber-600 to-yellow-500"></span>
              Order Schedule
            </h2>
            <div className="flex gap-3">
              <button
                id="refreshWindows"
                onClick={loadWindows}
                className="px-4 py-2 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200 hover:bg-amber-50 dark:hover:bg-yellow-900/20 transition text-sm"
              >
                Refresh
              </button>
              <button
                id="winAnnounceBtn"
                onClick={announceOpenedWindows}
                className="px-4 py-2 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200 hover:bg-amber-50 dark:hover:bg-yellow-900/20 transition text-sm"
              >
                Announce
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-6 bg-amber-50 dark:bg-yellow-900/10 p-6 rounded-xl border border-amber-200 dark:border-yellow-700/20">
            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                Start
              </label>
              <input
                id="winStart"
                type="datetime-local"
                value={winStart}
                onChange={(e) => setWinStart(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                End
              </label>
              <input
                id="winEnd"
                type="datetime-local"
                value={winEnd}
                onChange={(e) => setWinEnd(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                Month
              </label>
              <select
                id="winMonth"
                value={winMonth}
                onChange={(e) => setWinMonth(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select Month</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                Week
              </label>
              <select
                id="winWeek"
                value={winWeek}
                onChange={(e) => setWinWeek(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select Week</option>
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Week {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                Order No.
              </label>
              <input
                id="winOrderNoLabel"
                type="text"
                value={winOrderNoLabel}
                readOnly
                className="w-full px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] opacity-70"
              />
            </div>

            <button
              id="winCreateBtn"
              onClick={handleCreateWindow}
              className="px-6 py-3 rounded-lg bg-linear-to-r from-orange-700 to-amber-600 text-white font-semibold shadow hover:shadow-lg hover:-translate-y-0.5 transition text-sm md:col-span-1"
            >
              {editingWindowId ? "Update" : "Create"}
            </button>
            <button
              id="winCancelBtn"
              onClick={cancelEditWindow}
              className="px-6 py-3 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200 hover:bg-amber-50 dark:hover:bg-yellow-900/20 transition text-sm md:col-span-1"
            >
              Cancel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-yellow-700/30">
                  <th className="px-4 py-4 text-left font-semibold text-slate-700 dark:text-yellow-200">
                    Order No.
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-700 dark:text-yellow-200">
                    Start
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-700 dark:text-yellow-200">
                    End
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-700 dark:text-yellow-200">
                    Status
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-700 dark:text-yellow-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                id="windowsTableBody"
                className="divide-y divide-slate-100 dark:divide-yellow-700/20"
              >
                {windows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-500 dark:text-yellow-300"
                    >
                      No order windows created
                    </td>
                  </tr>
                ) : (
                  windows.map((window) => {
                    const now = Date.now();
                    const st = !window.is_active
                      ? "Nonaktif"
                      : new Date(window.start_time).getTime() > now
                      ? "Belum dimulai"
                      : new Date(window.end_time).getTime() < now
                      ? "Berakhir"
                      : "Aktif sekarang";
                    const val = window.order_no || null;
                    const label = val || "-";
                    return (
                      <tr key={window.id} className="table-row-hover">
                        <td className="px-4 py-4 text-[#1a1410] dark:text-[#fef3c7] font-semibold">
                          {label}
                        </td>
                        <td className="px-4 py-4 text-[#1a1410] dark:text-[#fef3c7] text-sm">
                          {new Date(window.start_time).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-[#1a1410] dark:text-[#fef3c7] text-sm">
                          {new Date(window.end_time).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-[#1a1410] dark:text-[#fef3c7] text-sm">
                          {st}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditWindow(window)}
                              className="px-3 py-1 rounded border border-yellow-600 text-yellow-200 hover:bg-yellow-600/20 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteOrderWindow(window.id)}
                              className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg p-6 w-[90%] max-w-md">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-yellow-100">
              Tambah Member
            </h3>
            <input
              type="text"
              placeholder="Nama member baru"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setNewMemberName("");
                }}
                className="px-4 py-3 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200 hover:bg-amber-50 dark:hover:bg-yellow-900/20 transition"
              >
                Batal
              </button>
              <button
                onClick={handleAddMember}
                className="px-4 py-3 rounded-lg bg-linear-to-r from-orange-700 to-amber-600 text-white font-semibold shadow hover:shadow-lg transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
