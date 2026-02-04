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
  Pencil,
  Save,
  Layers,
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

// New Type for Normalized Data
type GroupedRegistrant = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  registrations: Registration[];
  uniqueSports: string[];
  types: ("Solo" | "Team")[];
  latestDate: string;
};

// --- CONSTANTS ---
const E_SPORTS_LIST = [
  "PUBG Mobile",
  "Free Fire",
  "Clash Royale",
  "Mobile Legends",
];

// --- HELPER: SMART PARSER ---
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

  // SELECTION & EDITING
  const [selectedGroup, setSelectedGroup] = useState<GroupedRegistrant | null>(
    null,
  );
  // Which specific registration ID inside the group are we editing?
  const [editingRegId, setEditingRegId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Registration>>({});

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

  // --- NORMALIZE DATA (GROUP BY EMAIL) ---
  const normalizedData = useMemo(() => {
    const map = new Map<string, GroupedRegistrant>();

    data.forEach((reg) => {
      // Normalize email to lowercase for grouping
      const key = reg.email.toLowerCase().trim();

      if (!map.has(key)) {
        map.set(key, {
          email: reg.email,
          firstName: reg.firstName,
          lastName: reg.lastName,
          phone: reg.phone,
          registrations: [],
          uniqueSports: [],
          types: [],
          latestDate: reg.createdAt,
        });
      }

      const entry = map.get(key)!;
      entry.registrations.push(reg);

      // Update aggregation arrays
      if (!entry.uniqueSports.includes(reg.sport)) {
        entry.uniqueSports.push(reg.sport);
      }
      if (!entry.types.includes(reg.participationType)) {
        entry.types.push(reg.participationType);
      }

      // Keep latest info for the "Main" profile details
      if (new Date(reg.createdAt) > new Date(entry.latestDate)) {
        entry.latestDate = reg.createdAt;
        entry.firstName = reg.firstName;
        entry.lastName = reg.lastName;
        entry.phone = reg.phone;
      }
    });

    // Convert map to array and sort by latest date
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime(),
    );
  }, [data]);

  // --- FILTERED NORMALIZED DATA ---
  const filteredNormalizedData = useMemo(() => {
    const s = search.toLowerCase();
    return normalizedData.filter((group) => {
      // 1. Text Search
      const matchesSearch =
        group.firstName.toLowerCase().includes(s) ||
        group.lastName.toLowerCase().includes(s) ||
        group.email.toLowerCase().includes(s) ||
        group.registrations.some(
          (r) =>
            r.sport.toLowerCase().includes(s) ||
            (r.teamName && r.teamName.toLowerCase().includes(s)),
        );

      // 2. Category Filter
      const matchesCategory =
        selectedCategory === "All" ||
        group.uniqueSports.some((sport) => sport.includes(selectedCategory));

      // 3. Type Filter
      const matchesType =
        filterType === "All" || group.types.includes(filterType);

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [normalizedData, search, selectedCategory, filterType]);

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
      totalRegistrations: data.length,
      totalUniqueUsers: normalizedData.length,
    };
  }, [data, normalizedData]);

  const categories = useMemo(
    () => ["All", ...stats.sortedSports.map((s) => s.name)],
    [stats],
  );

  // --- ACTION HANDLERS ---
  const initEdit = (reg: Registration) => {
    setEditForm(reg);
    setEditingRegId(reg.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this specific entry?"))
      return;
    try {
      await fetch(`/api/sports-registrations/${id}`, { method: "DELETE" });
      const updatedData = data.filter((item) => item.id !== id);
      setData(updatedData);

      if (selectedGroup) {
        const updatedGroupRegs = selectedGroup.registrations.filter(
          (r) => r.id !== id,
        );
        if (updatedGroupRegs.length === 0) {
          setSelectedGroup(null);
        } else {
          setSelectedGroup({
            ...selectedGroup,
            registrations: updatedGroupRegs,
          });
        }
      }
    } catch (error) {
      console.error(error);
      alert("Failed to delete");
    }
  };

  const handleUpdate = async () => {
    if (!editingRegId || !editForm) return;

    try {
      const res = await fetch(`/api/sports-registrations/${editingRegId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updatedItem = await res.json();

      const newData = data.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      );
      setData(newData);

      if (selectedGroup) {
        const newGroupRegs = selectedGroup.registrations.map((r) =>
          r.id === updatedItem.id ? updatedItem : r,
        );
        setSelectedGroup({ ...selectedGroup, registrations: newGroupRegs });
      }

      setEditingRegId(null);
    } catch (error) {
      console.error(error);
      alert("Failed to update registration");
    }
  };

  const handleExport = () => {
    if (data.length === 0) return alert("No data to export");
    const headers = [
      "Registration ID",
      "Participant Name",
      "Email Address",
      "Phone Number",
      "Sport / Event",
      "Participation Type",
      "Team Name",
      "Faculty",
      "Semester",
      "Roster / Notes",
      "Registration Date",
    ];

    const rows = data
      .filter((item) => {
        const s = search.toLowerCase();
        const matchesSearch =
          item.firstName.toLowerCase().includes(s) ||
          item.lastName.toLowerCase().includes(s) ||
          item.sport.toLowerCase().includes(s);
        const matchesCat =
          selectedCategory === "All" || item.sport.includes(selectedCategory);
        const matchesType =
          filterType === "All" || item.participationType === filterType;
        return matchesSearch && matchesCat && matchesType;
      })
      .map((item) => {
        const { faculty, semester, roster } = parseDetails(item.message);
        let noteContent = "";
        if (item.participationType === "Team" && roster.length > 0) {
          noteContent = "Team Members: " + roster.join(" | ");
        } else {
          noteContent = (item.message || "")
            .replace(/faculty:.*|semester:.*|academic details:|roster:/gi, "")
            .replace(/[\n\r]+/g, " ")
            .trim();
        }
        if (!noteContent) noteContent = "N/A";
        const formattedDate = new Date(item.createdAt).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
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

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    const safeCategory = selectedCategory.replace(/ /g, "_");
    link.download = `Sports_${safeCategory}_${filterType}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

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

        {/* --- STATS SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 text-white p-6 rounded-[2rem] shadow-xl md:col-span-1 flex flex-col justify-between relative overflow-hidden min-h-[200px]">
            <div className="relative z-10">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                Total Registrations
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <h2 className="text-5xl md:text-6xl font-bold">
                  {stats.totalRegistrations}
                </h2>
                <span className="text-zinc-500 font-bold text-sm">
                  ({stats.totalUniqueUsers} Users)
                </span>
              </div>
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
                    width: `${(stats.soloCount / Math.max(stats.totalRegistrations, 1)) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${(stats.teamCount / Math.max(stats.totalRegistrations, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-zinc-800 rounded-full blur-2xl opacity-50" />
          </div>

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
          </div>
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
                    {cat === "All"
                      ? stats.totalRegistrations
                      : stats.sportCounts[cat] || 0}
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
                placeholder="Search name, email, sport..."
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

        {/* --- NORMALIZED DATA VIEW --- */}
        {viewMode === "list" ? (
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden p-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px] md:min-w-full">
                <thead className="bg-zinc-50/50 text-zinc-400 uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-4 rounded-l-xl">Participant</th>
                    <th className="px-6 py-4">Events</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right rounded-r-xl">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="text-zinc-600 text-sm">
                  {filteredNormalizedData.map((group) => {
                    // Determine Role display
                    const hasSolo = group.types.includes("Solo");
                    const hasTeam = group.types.includes("Team");
                    let roleDisplay;
                    if (hasSolo && hasTeam) {
                      roleDisplay = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-bold whitespace-nowrap">
                          <Layers className="w-3 h-3" /> Mixed
                        </span>
                      );
                    } else if (hasTeam) {
                      roleDisplay = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold whitespace-nowrap">
                          <Users className="w-3 h-3" /> Team
                        </span>
                      );
                    } else {
                      roleDisplay = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold whitespace-nowrap">
                          <User className="w-3 h-3" /> Solo
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={group.email}
                        onClick={() => setSelectedGroup(group)}
                        className="group border-b border-zinc-50 hover:bg-zinc-50/80 transition-colors last:border-0 cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0">
                              {group.firstName[0]}
                              {group.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-zinc-900 truncate">
                                  {group.firstName} {group.lastName}
                                </p>
                                {group.registrations.length > 1 && (
                                  <span className="bg-zinc-900 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                                    +{group.registrations.length}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 truncate">
                                {group.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-bold text-zinc-900 line-clamp-2">
                              {group.uniqueSports.join(", ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{roleDisplay}</td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight className="w-4 h-4 text-zinc-300 ml-auto" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredNormalizedData.length === 0 && (
              <div className="p-12 text-center text-zinc-400 font-medium">
                No results found.
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNormalizedData.map((group) => {
              const hasTeam = group.types.includes("Team");
              return (
                <div
                  key={group.email}
                  onClick={() => setSelectedGroup(group)}
                  className="bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-sm hover:border-zinc-300 cursor-pointer transition-all flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-500 font-bold text-lg">
                      {group.firstName[0]}
                      {group.lastName[0]}
                    </div>
                    {group.registrations.length > 1 && (
                      <span className="bg-zinc-100 text-zinc-900 border border-zinc-200 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
                        {group.registrations.length} Entries
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-lg">
                      {group.firstName} {group.lastName}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {group.uniqueSports.join(", ")}
                    </p>
                  </div>
                  <div className="mt-auto pt-3 border-t border-zinc-50 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      Contact
                    </span>
                    <span className="text-xs font-bold text-zinc-900">
                      {group.phone}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- DRAWER (Normalized Group View) --- */}
      {selectedGroup && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedGroup(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 p-0 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10">
              <h2 className="text-lg font-bold text-zinc-900">
                {editingRegId ? "Edit Registration" : "User Profile"}
              </h2>
              <div className="flex items-center gap-2">
                {editingRegId && (
                  <button
                    onClick={() => {
                      setEditingRegId(null);
                      setEditForm({});
                    }}
                    className="px-3 py-1.5 bg-zinc-100 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-200"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F9F9F9]">
              {editingRegId ? (
                // --- EDIT FORM (Specific Registration) ---
                <div className="space-y-4 bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editForm.firstName || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editForm.lastName || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, lastName: e.target.value })
                        }
                        className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                  </div>

                  {/* Sport & Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Sport
                    </label>
                    <input
                      type="text"
                      value={editForm.sport || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, sport: e.target.value })
                      }
                      className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Participation Type
                    </label>
                    <div className="flex gap-2">
                      {["Solo", "Team"].map((type) => (
                        <button
                          key={type}
                          onClick={() =>
                            setEditForm({
                              ...editForm,
                              participationType: type as "Solo" | "Team",
                            })
                          }
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border ${editForm.participationType === type ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-500 border-zinc-200"}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editForm.participationType === "Team" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={editForm.teamName || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, teamName: e.target.value })
                        }
                        className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Raw Message Data (Faculty/Roster)
                    </label>
                    <textarea
                      rows={6}
                      value={editForm.message || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, message: e.target.value })
                      }
                      className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleUpdate}
                    className="w-full h-12 bg-zinc-900 rounded-xl font-bold text-white hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              ) : (
                // --- PROFILE VIEW ---
                <div className="space-y-6">
                  {/* User Card */}
                  <div className="bg-white rounded-[2rem] p-6 text-center shadow-sm border border-zinc-100">
                    <div className="w-20 h-20 bg-zinc-900 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white mb-3">
                      {selectedGroup.firstName[0]}
                      {selectedGroup.lastName[0]}
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">
                      {selectedGroup.firstName} {selectedGroup.lastName}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mt-2 text-zinc-400 text-sm font-medium">
                      <span>{selectedGroup.email}</span>
                      <span>•</span>
                      <span
                        className="hover:text-zinc-900 cursor-pointer"
                        onClick={() => copyToClipboard(selectedGroup.phone)}
                      >
                        {selectedGroup.phone}
                      </span>
                    </div>
                  </div>

                  {/* Registrations List */}
                  <div>
                    <h4 className="px-2 mb-2 text-xs font-bold uppercase text-zinc-400 tracking-wider">
                      Registrations ({selectedGroup.registrations.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedGroup.registrations.map((reg) => {
                        const { faculty, semester, roster } = parseDetails(
                          reg.message,
                        );
                        return (
                          <div
                            key={reg.id}
                            className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <span
                                className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${reg.participationType === "Team" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}
                              >
                                {reg.participationType}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => initEdit(reg)}
                                  className="w-7 h-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(reg.id)}
                                  className="w-7 h-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-bold text-zinc-900 text-lg">
                              {reg.sport}
                            </h4>
                            {reg.teamName && (
                              <p className="text-xs text-zinc-500 font-bold mt-0.5">
                                Team: {reg.teamName}
                              </p>
                            )}

                            {/* Details Grid */}
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-zinc-50 p-2 rounded-lg">
                                <span className="block text-[9px] font-bold text-zinc-400 uppercase">
                                  Faculty
                                </span>
                                <span className="font-semibold text-zinc-700">
                                  {faculty}
                                </span>
                              </div>
                              <div className="bg-zinc-50 p-2 rounded-lg">
                                <span className="block text-[9px] font-bold text-zinc-400 uppercase">
                                  Semester
                                </span>
                                <span className="font-semibold text-zinc-700">
                                  {semester}
                                </span>
                              </div>
                            </div>

                            {/* Roster if applicable (Original UI Style) */}
                            {reg.participationType === "Team" &&
                              roster.length > 0 && (
                                <div className="mt-4">
                                  <span className="block text-[10px] font-bold text-zinc-400 uppercase mb-2 ml-1">
                                    Full Roster
                                  </span>
                                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl overflow-hidden">
                                    {roster.map((m, i) => (
                                      <div
                                        key={i}
                                        className="p-3 border-b border-zinc-100 last:border-0 flex items-center gap-3 bg-white/50"
                                      >
                                        <div className="w-6 h-6 rounded bg-white border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-400 shadow-sm">
                                          {i + 1}
                                        </div>
                                        <span className="text-xs font-bold text-zinc-700 capitalize">
                                          {m}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
