"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [windows, setWindows] = useState<OrderWindow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedName, setSelectedName] = useState("");
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [dashboardData, setDashboardData] = useState<OrderData[]>([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [winStart, setWinStart] = useState("");
  const [winEnd, setWinEnd] = useState("");
  const [winMonth, setWinMonth] = useState("");
  const [winWeek, setWinWeek] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      router.push("/login");
    }
    // fetchData(); // moved into useCallback below to avoid TDZ error
  }, []);

  const checkAuth = () => {
    if (!localStorage.getItem("auth_token")) {
      router.push("/login");
    }
  };

  const showAlert = (message: string, type: "success" | "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => setAlertMessage(""), 3000);
  };

  const fetchData = async () => {
    try {
      const [membersRes, windowsRes] = await Promise.all([
        fetch("/api/members", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }),
        fetch("/api/order-windows", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }),
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }

      if (windowsRes.ok) {
        const windowsData = await windowsRes.json();
        setWindows(windowsData);
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      showAlert("Failed to load data", "error");
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      showAlert("Please enter member name", "error");
      return;
    }

    try {
      const response = await fetch("/api/members", {
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
      const response = await fetch("/api/order-windows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          start_time: new Date(winStart).toISOString(),
          end_time: new Date(winEnd).toISOString(),
          month: Number.parseInt(winMonth),
          week: Number.parseInt(winWeek),
        }),
      });

      if (response.ok) {
        setWinStart("");
        setWinEnd("");
        setWinMonth("");
        setWinWeek("");
        showAlert("Order window created successfully", "success");
        fetchData();
      } else {
        showAlert("Failed to create order window", "error");
      }
    } catch (err) {
      console.error("Failed to create window:", err);
      showAlert("Failed to create order window", "error");
    }
  };

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(selectedName.toLowerCase())
  );

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleDateString("en-US", { month: "long" }),
  }));

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
        {/* Dashboard Section */}
        <div className="rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg hover:shadow-xl transition p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title text-xl font-bold flex items-center gap-3">
              <span className="section-divider w-1 h-6 rounded-full bg-gradient-to-b from-amber-600 to-yellow-500"></span>
              Dashboard
            </h2>
            <button
              onClick={() => setShowMemberModal(true)}
              className="px-4 py-2.5 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200 hover:bg-amber-50 dark:hover:bg-yellow-900/20 transition"
            >
              Tambah Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                Bulan
              </label>
              <select
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                Minggu
              </label>
              <select
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
              <div className="relative">
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Semua"
                  value={selectedName}
                  onChange={(e) => {
                    setSelectedName(e.target.value);
                    setShowNameDropdown(true);
                  }}
                  onFocus={() => setShowNameDropdown(true)}
                  className="w-full px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {showNameDropdown && selectedName && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#1f1410] border border-[#3d342d] rounded-lg shadow max-h-60 overflow-auto z-50">
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
                )}
              </div>
            </div>

            <button
              onClick={() => fetchData()}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-orange-700 to-amber-600 text-white font-semibold shadow hover:shadow-lg hover:-translate-y-0.5 transition text-sm sm:text-base"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
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
                        ${order.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Windows Section */}
        <div className="rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg hover:shadow-xl transition p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title text-xl font-bold flex items-center gap-3">
              <span className="section-divider w-1 h-6 rounded-full bg-gradient-to-b from-amber-600 to-yellow-500"></span>
              Order Schedule
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => fetchData()}
                className="px-4 py-2 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200 hover:bg-amber-50 dark:hover:bg-yellow-900/20 transition text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-6 bg-amber-50 dark:bg-yellow-900/10 p-6 rounded-xl border border-amber-200 dark:border-yellow-700/20">
            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                Start
              </label>
              <input
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
                type="datetime-local"
                value={winEnd}
                onChange={(e) => setWinEnd(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-yellow-200">
                Month
              </label>
              <select
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

            <button
              onClick={handleCreateWindow}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-orange-700 to-amber-600 text-white font-semibold shadow hover:shadow-lg hover:-translate-y-0.5 transition text-sm md:col-span-1"
            >
              Create
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-yellow-700/20">
                {windows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-500 dark:text-yellow-300"
                    >
                      No order windows created
                    </td>
                  </tr>
                ) : (
                  windows.map((window) => {
                    const isActive =
                      new Date(window.start_time) <= new Date() &&
                      new Date() <= new Date(window.end_time);
                    return (
                      <tr key={window.id} className="table-row-hover">
                        <td className="px-4 py-4 text-[#1a1410] dark:text-[#fef3c7] font-semibold">
                          {window.order_no}
                        </td>
                        <td className="px-4 py-4 text-[#1a1410] dark:text-[#fef3c7] text-sm">
                          {new Date(window.start_time).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-[#1a1410] dark:text-[#fef3c7] text-sm">
                          {new Date(window.end_time).toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                              isActive ? "bg-green-600" : "bg-slate-400"
                            }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
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
                className="px-4 py-3 rounded-lg bg-gradient-to-r from-orange-700 to-amber-600 text-white font-semibold shadow hover:shadow-lg transition"
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
