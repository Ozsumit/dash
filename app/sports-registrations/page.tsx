"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  User,
  Search,
  RefreshCcw,
  Trophy,
  Gamepad2,
  Mail,
  Phone,
  Trash2,
  List,
  LayoutGrid,
  Crown,
} from "lucide-react";

// --- Types ---
type Registration = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sport: string;
  participationType: "Solo" | "Team";
  teamName?: string;
  message?: string;
  createdAt: string;
};

const E_SPORTS_LIST = [
  "PUBG Mobile",
  "Free Fire",
  "Clash Royale",
  "Mobile Legends",
];

export default function SportsAdminPage() {
  const [data, setData] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // --- ORIGINAL FETCH LOGIC ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Points to the working API route we built earlier
      const res = await fetch("/api/sports-registrations");

      if (!res.ok) throw new Error("Failed to fetch");

      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
      alert("Failed to load data. Ensure /api/register route exists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ORIGINAL DELETE LOGIC ---
  const handleDelete = async (item: Registration) => {
    if (!confirm("Are you sure you want to delete this registration?")) return;

    try {
      const response = await fetch(`/api/sports-registrations/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete registration");
      }

      toast({
        title: "Success",
        description: "Registration deleted successfully",
      });

      fetchRegistrations();
    } catch (error) {
      console.error("Failed to delete registration:", error);
      toast({
        title: "Error",
        description: "Failed to delete registration",
        // variant: "destructive",
      });
    }
  };

  // --- Stats Logic (Memoized) ---
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};

    // initialize counts
    E_SPORTS_LIST.forEach((game) => {
      counts[game] = 0;
    });

    let teamCount = 0;
    let soloCount = 0;

    data.forEach((reg) => {
      // count participation type
      if (reg.participationType === "Team") {
        teamCount++;
      } else {
        soloCount++;
      }

      // 🔥 handle multiple sports
      if (typeof reg.sport === "string") {
        const selectedSports = reg.sport.split(",").map((s) => s.trim()); // remove spaces

        selectedSports.forEach((sport) => {
          if (E_SPORTS_LIST.includes(sport)) {
            counts[sport] += 1;
          }
        });
      }
    });

    let maxVotes = 0;
    let winner = "None";

    Object.entries(counts).forEach(([game, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winner = game;
      }
    });

    return {
      counts,
      winner,
      maxVotes,
      teamCount,
      soloCount,
    };
  }, [data]);

  // --- Filter Logic ---
  const filteredData = data.filter((item) => {
    const s = search.toLowerCase();
    return (
      item.firstName.toLowerCase().includes(s) ||
      item.lastName.toLowerCase().includes(s) ||
      item.sport.toLowerCase().includes(s) ||
      (item.teamName && item.teamName.toLowerCase().includes(s))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
          <p className="text-zinc-500 font-bold animate-pulse">
            Loading Data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] p-6 md:p-12 font-sans text-zinc-900">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Admin Dashboard
            </h5>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">
              Sports Overview
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="h-12 px-6 rounded-2xl bg-white border border-zinc-100 hover:border-zinc-300 font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
            <div className="h-12 px-2 rounded-2xl bg-white border border-zinc-100 flex items-center p-1 shadow-sm">
              <button
                onClick={() => setViewMode("list")}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  viewMode === "list"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  viewMode === "grid"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* --- Bento Grid Stats --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Card */}
          <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-xl md:col-span-1 flex flex-col justify-between relative overflow-hidden min-h-[200px]">
            <div className="relative z-10">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                Total Entries
              </p>
              <h2 className="text-6xl font-bold mt-4">{data.length}</h2>
            </div>
            <div className="flex gap-4 mt-8 relative z-10">
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold">
                  Solo
                </p>
                <p className="text-xl font-bold">{stats.soloCount}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold">
                  Teams
                </p>
                <p className="text-xl font-bold">{stats.teamCount}</p>
              </div>
            </div>
            {/* Decor */}
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-zinc-800 rounded-full blur-2xl opacity-50" />
          </div>

          {/* E-Sports Leaderboard */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm md:col-span-3 border border-zinc-100 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">E-Sports Voting</h3>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wide">
                  Live Results
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {E_SPORTS_LIST.map((game) => {
                const count = stats.counts[game] || 0;
                const isLeader = stats.winner === game && count > 0;
                return (
                  <div
                    key={game}
                    className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                      isLeader
                        ? "bg-amber-50 border-amber-200"
                        : "bg-zinc-50 border-zinc-100"
                    }`}
                  >
                    {isLeader && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-sm whitespace-nowrap">
                        <Crown className="w-3 h-3" /> Leader
                      </div>
                    )}
                    <div className="text-center">
                      <h4 className="font-bold text-zinc-900 text-sm mb-1">
                        {game}
                      </h4>
                      <p className="text-3xl font-bold text-zinc-900">
                        {count}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- Search & Results --- */}
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white p-2 pl-6 pr-2 rounded-[2rem] shadow-sm border border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-3 w-full">
              <Search className="text-zinc-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, team, sport or email..."
                className="w-full h-12 outline-none text-zinc-700 font-medium placeholder:text-zinc-300 bg-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="bg-zinc-100 px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 uppercase tracking-wide whitespace-nowrap">
              {filteredData.length} Results
            </div>
          </div>

          {/* --- View Mode: LIST (Swiss Style Table) --- */}
          {viewMode === "list" && (
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden p-2">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50/50 text-zinc-400 uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="px-8 py-6 rounded-l-2xl">Participant</th>
                    <th className="px-6 py-6">Details</th>
                    <th className="px-6 py-6">Sport Info</th>
                    <th className="px-6 py-6 w-1/3">Notes / Roster</th>
                    <th className="px-6 py-6 text-right rounded-r-2xl">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-zinc-600 text-sm">
                  {filteredData.map((row) => (
                    <tr
                      key={row.id}
                      className="group border-b border-zinc-50 hover:bg-zinc-50/80 transition-colors last:border-0"
                    >
                      <td className="px-8 py-6 align-top">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold text-lg group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0">
                            {row.firstName[0]}
                            {row.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 text-base">
                              {row.firstName} {row.lastName}
                            </p>
                            {row.participationType === "Team" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 mt-1">
                                <Users className="w-3 h-3" /> Team Captain
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 mt-1">
                                <User className="w-3 h-3" /> Solo Player
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <Mail className="w-3.5 h-3.5 text-zinc-300" />{" "}
                            {row.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <Phone className="w-3.5 h-3.5 text-zinc-300" />{" "}
                            {row.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <div className="space-y-2">
                          <span className="inline-block px-3 py-1 rounded-lg bg-zinc-100 text-zinc-700 font-bold text-xs border border-zinc-200">
                            {row.sport}
                          </span>
                          {row.teamName && row.teamName !== "-" && (
                            <div className="text-xs font-bold text-zinc-500">
                              Team:{" "}
                              <span className="text-zinc-900">
                                {row.teamName}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                          <pre className="whitespace-pre-wrap font-bold text-[1rem] text-black leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
                            {row.message || "No notes"}
                          </pre>
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top text-right">
                        {/* <button
                          onClick={() => handleDelete(row.id)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-300 hover:bg-red-50 hover:text-red-500 transition-all"
                          title="Delete Registration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* --- View Mode: GRID (Card Layout) --- */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.map((row) => (
                <div
                  key={row.id}
                  className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-zinc-100 flex flex-col gap-6 group hover:border-zinc-300 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold text-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0">
                        {row.firstName[0]}
                        {row.lastName[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 text-lg">
                          {row.firstName} {row.lastName}
                        </h4>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mt-1">
                          {row.participationType}
                        </p>
                      </div>
                    </div>
                    {/* <button
                      onClick={() => handleDelete(row.id)}
                      className="w-10 h-10 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-300 hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button> */}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-2xl">
                      <span className="text-xs font-bold text-zinc-400 uppercase">
                        Sport
                      </span>
                      <span className="font-bold text-zinc-900 text-sm">
                        {row.sport}
                      </span>
                    </div>
                    {row.teamName && (
                      <div className="flex justify-between items-center px-3">
                        <span className="text-xs font-bold text-zinc-400 uppercase">
                          Team
                        </span>
                        <span className="font-bold text-zinc-900 text-sm">
                          {row.teamName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">
                      Notes / Roster
                    </p>
                    <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 h-32 overflow-y-auto custom-scrollbar">
                      <pre className="whitespace-pre-wrap font-bold text-[.7rem] text-black leading-relaxed">
                        {row.message || "No notes provided."}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-bold">No results found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function toast(arg0: { title: string; description: string }) {
  throw new Error("Function not implemented.");
}

function fetchRegistrations() {
  throw new Error("Function not implemented.");
}
