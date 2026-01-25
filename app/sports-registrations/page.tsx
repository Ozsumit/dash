"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  User,
  Search,
  RefreshCcw,
  Trash2,
  List,
  LayoutGrid,
  Crown,
  Download,
  X,
  GraduationCap,
  BookOpen,
  BarChart3,
  Gamepad2,
  ChevronRight,
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

// --- CONSTANTS ---
const E_SPORTS_LIST = [
  "PUBG Mobile",
  "Free Fire",
  "Clash Royale",
  "Mobile Legends",
  "FIFA",
  "eFootball",
];

// --- HELPER: SMART PARSER ---
// Extracts structured data from the unstructured message field
const parseDetails = (message?: string) => {
  if (!message)
    return { faculty: "N/A", semester: "N/A", roster: [] as string[] };

  const lines = message
    .split(/[\n,]/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let faculty = "N/A";
  let semester = "N/A";
  const roster: string[] = [];

  lines.forEach((line) => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.startsWith("faculty:")) {
      faculty = line.split(":")[1]?.trim() || "N/A";
    } else if (lowerLine.startsWith("semester:")) {
      semester = line.split(":")[1]?.trim() || "N/A";
    } else if (
      lowerLine.includes("academic details") ||
      lowerLine.includes("roster:")
    ) {
      return;
    } else {
      // Clean up numbering like "1. Name" or "P1 - Name"
      const cleanName = line.replace(/^[\d-pP]+\.?\)?\s*[-:]?\s*/, "").trim();
      if (cleanName.length > 1) roster.push(cleanName);
    }
  });

  return { faculty, semester, roster };
};

export default function SportsAdminPage() {
  const [data, setData] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // FILTERS
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [filterType, setFilterType] = useState<"All" | "Solo" | "Team">("All");
  const [selectedItem, setSelectedItem] = useState<Registration | null>(null);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sports-registrations");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- DELETE ---
  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this registration?")) return;
    try {
      await fetch(`/api/sports-registrations/${id}`, { method: "DELETE" });
      fetchData();
      setSelectedItem(null);
    } catch (error) {
      console.error(error);
    }
  };

  // --- IMPROVED EXPORT CSV ---
  const handleExport = () => {
    if (filteredData.length === 0) return alert("No data to export");

    // 1. Define Professional Headers
    const headers = [
      "Registration ID",
      "Participant Name",
      "Email Address",
      "Phone Number",
      "Sport / Event",
      "Participation Type",
      "Team Name",
      "Faculty", // Extracted
      "Semester", // Extracted
      "Roster / Notes", // Cleaned
      "Registration Date",
    ];

    // 2. Process Rows with Formatting
    const rows = filteredData.map((item) => {
      // Parse the messy message field to extract clean details
      const { faculty, semester, roster } = parseDetails(item.message);

      // Format Roster/Notes:
      // If Team, join roster with commas. If Solo, just clean up newlines.
      let noteContent = "";
      if (item.participationType === "Team" && roster.length > 0) {
        noteContent = "Team Members: " + roster.join(" | ");
      } else {
        // Remove headers (Faculty:, Semester:) from the note text to avoid duplication
        noteContent = (item.message || "")
          .replace(/faculty:.*|semester:.*|academic details:|roster:/gi, "")
          .replace(/[\n\r]+/g, " ")
          .trim();
      }
      if (!noteContent) noteContent = "N/A";

      // Format Date (Readable)
      const formattedDate = new Date(item.createdAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Safe CSV String (Handles commas inside data by wrapping in quotes)
      const safe = (str: string) => `"${(str || "").replace(/"/g, '""')}"`;

      return [
        safe(item.id),
        safe(`${item.firstName} ${item.lastName}`),
        safe(item.email),
        safe(item.phone),
        safe(item.sport),
        safe(item.participationType),
        safe(item.teamName || "N/A"),
        safe(faculty),
        safe(semester),
        safe(noteContent),
        safe(formattedDate),
      ].join(",");
    });

    // 3. Generate File with Dynamic Name
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;

    // Clean filename (e.g. "Sports_PUBG_Mobile_Team_2024-01-01.csv")
    const safeCategory = selectedCategory.replace(/ /g, "_");
    const safeDate = new Date().toISOString().split("T")[0];
    link.download = `Sports_${safeCategory}_${filterType}_${safeDate}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- STATS LOGIC ---
  const stats = useMemo(() => {
    const sportCounts: Record<string, number> = {};
    const eSportsCounts: Record<string, number> = {};
    E_SPORTS_LIST.forEach((game) => (eSportsCounts[game] = 0));
    let teamCount = 0;
    let soloCount = 0;

    data.forEach((reg) => {
      if (reg.participationType === "Team") teamCount++;
      else soloCount++;
      const sports = reg.sport.split(",").map((s) => s.trim());
      sports.forEach((s) => {
        if (!s) return;
        sportCounts[s] = (sportCounts[s] || 0) + 1;
        const matchedESport = E_SPORTS_LIST.find((e) =>
          s.toLowerCase().includes(e.toLowerCase()),
        );
        if (matchedESport) eSportsCounts[matchedESport] += 1;
      });
    });

    const sortedSports = Object.entries(sportCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));

    let maxVotes = 0;
    let winner = "None";
    Object.entries(eSportsCounts).forEach(([game, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winner = game;
      }
    });

    return {
      sportCounts,
      sortedSports,
      eSportsCounts,
      eSportsWinner: winner,
      teamCount,
      soloCount,
      total: data.length,
    };
  }, [data]);

  const categories = useMemo(
    () => ["All", ...stats.sortedSports.map((s) => s.name)],
    [stats],
  );

  // --- FILTER LOGIC ---
  const filteredData = data.filter((item) => {
    const s = search.toLowerCase();
    const matchesSearch =
      item.firstName.toLowerCase().includes(s) ||
      item.lastName.toLowerCase().includes(s) ||
      (item.teamName && item.teamName.toLowerCase().includes(s)) ||
      item.sport.toLowerCase().includes(s);
    const matchesCategory =
      selectedCategory === "All" ? true : item.sport.includes(selectedCategory);
    const matchesType =
      filterType === "All" ? true : item.participationType === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F2F2F2] p-4 md:p-8 font-sans text-zinc-900 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Admin Dashboard
            </h5>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900">
              Sports Overview
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-zinc-300/50"
            >
              <Download className="w-3 h-3 md:w-4 md:h-4" /> Export CSV
            </button>
            <button
              onClick={fetchData}
              className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 shadow-sm"
            >
              <RefreshCcw className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* --- AT A GLANCE --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Stats */}
          <div className="bg-zinc-900 text-white p-6 rounded-[2rem] shadow-xl md:col-span-1 flex flex-col justify-between relative overflow-hidden min-h-[200px]">
            <div className="relative z-10">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                Total Entries
              </p>
              <h2 className="text-5xl md:text-6xl font-bold mt-2">
                {stats.total}
              </h2>
            </div>
            <div className="relative z-10 space-y-2 mt-4">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <span>Solo ({stats.soloCount})</span>
                <span>Teams ({stats.teamCount})</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${(stats.soloCount / Math.max(stats.total, 1)) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${(stats.teamCount / Math.max(stats.total, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-zinc-800 rounded-full blur-2xl opacity-50" />
          </div>

          {/* E-SPORTS VOTING */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 md:col-span-1 lg:col-span-3 overflow-hidden flex flex-col relative">
            <div className="flex items-center gap-3 mb-4 z-10">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-lg leading-tight">
                  E-Sports Voting
                </h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Live Popularity
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 z-10">
              {E_SPORTS_LIST.map((game) => {
                const count = stats.eSportsCounts[game] || 0;
                const isWinner = stats.eSportsWinner === game && count > 0;
                return (
                  <div
                    key={game}
                    className={`relative p-4 rounded-2xl border transition-all ${isWinner ? "bg-amber-50 border-amber-200" : "bg-zinc-50 border-zinc-100"}`}
                  >
                    {isWinner && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Winner
                      </div>
                    )}
                    <div className="text-center">
                      <h4 className="font-bold text-zinc-900 text-xs md:text-sm mb-1 truncate">
                        {game}
                      </h4>
                      <p className="text-2xl font-bold text-zinc-900">
                        {count}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-zinc-50 to-transparent pointer-events-none" />
          </div>

          {/* BREAKDOWN */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 md:col-span-2 lg:col-span-4 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-zinc-400" />
              <h3 className="font-bold text-zinc-900">Entries per Sport</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {stats.sortedSports.map((sport, idx) => (
                <div
                  key={sport.name}
                  className={`flex-shrink-0 p-4 rounded-2xl border min-w-[120px] md:min-w-[140px] flex flex-col items-center justify-center gap-1 transition-all ${idx === 0 ? "bg-zinc-100 border-zinc-300" : "bg-zinc-50 border-zinc-100"}`}
                >
                  {idx === 0 && (
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      Most Popular
                    </span>
                  )}
                  <span className="text-xl md:text-2xl font-bold text-zinc-900">
                    {sport.count}
                  </span>
                  <span className="text-[10px] md:text-xs font-bold text-zinc-500 text-center uppercase tracking-tight">
                    {sport.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- FILTERS --- */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sticky top-2 z-30 pointer-events-none">
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 pointer-events-auto bg-[#F2F2F2]/95 p-2 rounded-2xl backdrop-blur-md w-full xl:w-auto shadow-sm md:shadow-none border md:border-none border-zinc-200">
            <div className="bg-white p-1 rounded-xl border border-zinc-200 shadow-sm flex h-10 w-full md:w-fit shrink-0">
              {(["All", "Solo", "Team"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 md:flex-none px-4 rounded-lg text-xs font-bold transition-all ${filterType === type ? "bg-zinc-900 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50"}`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto w-full md:max-w-[50vw] xl:max-w-[40vw] scrollbar-hide items-center pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-10 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 shrink-0 ${selectedCategory === cat ? "bg-white border-zinc-300 text-black shadow-md" : "bg-white/50 border-zinc-200 text-zinc-400 hover:bg-white"}`}
                >
                  {cat}{" "}
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] bg-zinc-100`}
                  >
                    {cat === "All" ? stats.total : stats.sportCounts[cat] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pointer-events-auto w-full xl:w-auto">
            <div className="relative w-full xl:w-64 group">
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-800 transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white shadow-sm transition-all"
              />
            </div>
            <div className="hidden md:flex bg-white p-1 rounded-xl border border-zinc-200 shadow-sm h-10 shrink-0">
              <button
                onClick={() => setViewMode("list")}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${viewMode === "list" ? "bg-zinc-100 text-black" : "text-zinc-400"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-zinc-100 text-black" : "text-zinc-400"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* --- DATA VIEW --- */}
        {viewMode === "list" ? (
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden p-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px] md:min-w-full">
                <thead className="bg-zinc-50/50 text-zinc-400 uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-4 rounded-l-xl">Participant</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Sport</th>
                    <th className="px-6 py-4 text-right rounded-r-xl">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="text-zinc-600 text-sm">
                  {filteredData.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedItem(row)}
                      className="group border-b border-zinc-50 hover:bg-zinc-50/80 transition-colors last:border-0 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0">
                            {row.firstName[0]}
                            {row.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 truncate">
                              {row.firstName} {row.lastName}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">
                              {row.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {row.participationType === "Team" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold whitespace-nowrap">
                            <Users className="w-3 h-3" /> Team Captain
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold whitespace-nowrap">
                            <User className="w-3 h-3" /> Solo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-bold text-zinc-900 whitespace-nowrap">
                            {row.sport}
                          </span>
                          {row.teamName && (
                            <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wide whitespace-nowrap">
                              Team: {row.teamName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-zinc-300 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length === 0 && (
              <div className="p-12 text-center text-zinc-400 font-medium">
                No results found.
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((row) => (
              <div
                key={row.id}
                onClick={() => setSelectedItem(row)}
                className="bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-sm hover:border-zinc-300 cursor-pointer transition-all flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-500 font-bold text-lg">
                    {row.firstName[0]}
                    {row.lastName[0]}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${row.participationType === "Team" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}
                  >
                    {row.participationType}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-lg">
                    {row.firstName} {row.lastName}
                  </h4>
                  <p className="text-xs text-zinc-400 font-bold uppercase mt-1">
                    {row.sport}
                  </p>
                </div>
                {row.teamName && (
                  <div className="mt-auto pt-3 border-t border-zinc-50 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      Team
                    </span>
                    <span className="text-xs font-bold text-zinc-900">
                      {row.teamName}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- DRAWER --- */}
      {selectedItem && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedItem(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 p-0 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10">
              <h2 className="text-lg font-bold text-zinc-900">Details</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              <div className="bg-zinc-900 rounded-3xl p-6 text-white text-center shadow-lg shadow-zinc-300">
                <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-3">
                  {selectedItem.firstName[0]}
                  {selectedItem.lastName[0]}
                </div>
                <h3 className="text-2xl font-bold">
                  {selectedItem.firstName} {selectedItem.lastName}
                </h3>
                <p className="text-zinc-400 text-sm font-medium mt-1 break-all">
                  {selectedItem.email}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-bold">
                    {selectedItem.sport}
                  </span>
                  {selectedItem.participationType === "Team" && (
                    <span className="px-3 py-1 bg-blue-600 rounded-full text-xs font-bold">
                      Captain
                    </span>
                  )}
                </div>
              </div>
              {(() => {
                const { faculty, semester, roster } = parseDetails(
                  selectedItem.message,
                );
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1 text-zinc-400">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase">
                            Faculty
                          </span>
                        </div>
                        <p className="font-bold text-zinc-900 capitalize">
                          {faculty}
                        </p>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1 text-zinc-400">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase">
                            Semester
                          </span>
                        </div>
                        <p className="font-bold text-zinc-900">{semester}</p>
                      </div>
                    </div>
                    <div className="bg-white border border-zinc-100 rounded-2xl p-4 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-500 font-bold">
                          Phone
                        </span>
                        <span
                          className="text-sm font-bold text-zinc-900 cursor-pointer hover:text-blue-600"
                          onClick={() => copyToClipboard(selectedItem.phone)}
                        >
                          {selectedItem.phone}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-500 font-bold">
                          Team Name
                        </span>
                        <span className="text-sm font-bold text-zinc-900 text-right">
                          {selectedItem.teamName || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-500 font-bold">
                          Registered
                        </span>
                        <span className="text-sm font-bold text-zinc-900">
                          {new Date(
                            selectedItem.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {selectedItem.participationType === "Team" && (
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wide text-zinc-400 mb-3 ml-1">
                          Full Roster
                        </h4>
                        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl overflow-hidden">
                          {roster.length > 0 ? (
                            roster.map((m, i) => (
                              <div
                                key={i}
                                className="p-3 border-b border-zinc-100 last:border-0 flex items-center gap-3"
                              >
                                <div className="w-6 h-6 rounded bg-white border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                  {i + 1}
                                </div>
                                <span className="text-sm font-bold text-zinc-700 capitalize">
                                  {m}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="p-4 text-xs text-zinc-400 italic text-center">
                              No roster details found.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="p-5 border-t border-zinc-100 bg-zinc-50 flex gap-3">
              <button
                onClick={(e) => handleDelete(selectedItem.id, e)}
                className="flex-1 h-12 border border-zinc-200 rounded-xl font-bold text-zinc-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
