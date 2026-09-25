import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpToLine,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Command,
  Download,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  PackageSearch,
  Pill,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Settings2,
  ShoppingCart,
  Sparkles,
  Sun,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import "./styles.css";
import PixelBlast from "./components/PixelBlast";
import Hyperspeed from "./components/Hyperspeed";

const API = "/api";

function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("pharma-auth") === "1");
  if (!authenticated) {
    return <LoginPage onLogin={(username) => { localStorage.setItem("pharma-auth", "1"); localStorage.setItem("pharma-username", username); setAuthenticated(true); }} />;
  }
  return <AppShell userName={localStorage.getItem("pharma-username") || "User"} onLogout={() => { localStorage.removeItem("pharma-auth"); setAuthenticated(false); }} />;
}

function AppShell({ userName, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [serverOnline, setServerOnline] = useState(false);
  const [toast, setToast] = useState(null);
  const [saleOpen, setSaleOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("pharma-sidebar") === "1");
  const [dark, setDark] = useState(() => localStorage.getItem("pharma-theme") === "dark");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [addMedicineOpen, setAddMedicineOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("pharma-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("pharma-sidebar", collapsed ? "1" : "0");
  }, [collapsed]);

  const loadMedicines = async () => {
    try {
      const response = await fetch(`${API}/medicines`);
      if (!response.ok) throw new Error();
      setMedicines(await response.json());
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      const response = await fetch(`${API}/sales`);
      if (!response.ok) throw new Error();
      setSales(await response.json());
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    loadMedicines();
    loadSales();
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("global-search")?.focus();
      }
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredMedicines = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return medicines;
    return medicines.filter((m) =>
      [m.id, m.name, m.category].some((value) => value.toLowerCase().includes(q))
    );
  }, [medicines, search]);

  const lowStock = medicines.filter((m) => m.stock <= 5 && m.status !== "EXPIRED");
  const expired = medicines.filter((m) => m.status === "EXPIRED");
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

  const notify = (message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(window.__pharmaToast);
    window.__pharmaToast = window.setTimeout(() => setToast(null), 3000);
  };

  const navigate = (next) => {
    setTab(next);
    setMobileOpen(false);
    setGlobalSearch("");
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      loadMedicines();
      return;
    }
    try {
      const response = await fetch(`${API}/search?q=${encodeURIComponent(search)}`);
      const result = await response.json();
      setMedicines(result);
      setServerOnline(true);
    } catch {
      notify("Could not connect to the Java server.", "error");
    }
  };

  const addMedicine = async (data) => {
    const body = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => body.append(key, value));
    try {
      const response = await fetch(`${API}/medicine`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) { notify(result.error || "Could not add medicine.", "error"); return false; }
      notify(`${result.name} added to inventory.`);
      setAddMedicineOpen(false);
      await loadMedicines();
      return true;
    } catch {
      notify("Java server is offline.", "error");
      return false;
    }
  };

  const updateStock = async (id, adjustment) => {
    if (String(adjustment).trim() === "" || Number.isNaN(Number(adjustment))) {
      notify("Enter a valid stock adjustment.", "error");
      return;
    }
    const body = new URLSearchParams();
    body.append("id", id);
    body.append("adjustment", adjustment);
    try {
      const response = await fetch(`${API}/stock`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) {
        notify(result.error || "Stock update failed.", "error");
        return;
      }
      notify("Stock updated successfully.");
      setStockOpen(null);
      loadMedicines();
    } catch {
      notify("Java server is offline.", "error");
    }
  };

  const createSale = async (data) => {
    const body = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => body.append(key, value));
    try {
      const response = await fetch(`${API}/sale`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) {
        notify(result.error || "Sale failed.", "error");
        return false;
      }
      notify(`${result.billNumber} created successfully.`);
      setLastBill(result);
      setSaleOpen(false);
      await Promise.all([loadMedicines(), loadSales()]);
      return result;
    } catch {
      notify("Java server is offline.", "error");
      return false;
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([loadMedicines(), loadSales()]);
    notify("Workspace refreshed.");
  };

  const globalMatches = globalSearch.trim()
    ? medicines.filter((m) => `${m.id} ${m.name} ${m.category}`.toLowerCase().includes(globalSearch.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className={`mobile-overlay ${mobileOpen ? "show" : ""}`} onClick={() => setMobileOpen(false)} />
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-head">
          <div className="brand">
            <div className="brand-icon"><Pill size={21} strokeWidth={2.4} /></div>
            <div className="brand-copy">
              <div className="brand-name">PharmaCare</div>
              <div className="brand-team">TEAM 12 · OPERATIONS</div>
            </div>
          </div>
          <button className="sidebar-collapse" onClick={() => setCollapsed((v) => !v)} aria-label="Toggle sidebar">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <SideButton icon={<LayoutDashboard />} label="Overview" active={tab === "dashboard"} collapsed={collapsed} onClick={() => navigate("dashboard")} />
          <SideButton icon={<Boxes />} label="Inventory" active={tab === "inventory"} collapsed={collapsed} onClick={() => navigate("inventory")} />
          <SideButton icon={<ShoppingCart />} label="Billing" active={tab === "billing"} collapsed={collapsed} onClick={() => navigate("billing")} />
          <SideButton icon={<ReceiptText />} label="Sales records" active={tab === "sales"} collapsed={collapsed} onClick={() => navigate("sales")} />
        </nav>

        <div className="side-divider" />
        <div className="side-label">SYSTEM</div>
        <button className="side-mini-link" onClick={() => notify("All systems are configured for local development.")} title="System settings">
          <Settings2 size={17} /><span>System settings</span>
        </button>

        <div className="sidebar-spacer" />
        <div className="server-card">
          <span className={`pulse ${serverOnline ? "online" : "offline"}`} />
          <div className="server-copy">
            <strong>{serverOnline ? "Java server online" : "Server offline"}</strong>
            <small>localhost:8080</small>
          </div>
          {!collapsed && <span className="server-live">LIVE</span>}
        </div>
        {!collapsed && <div className="tech-note"><Sparkles size={14} /> React UI · Java backend</div>}
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
            <div className="breadcrumbs"><span>PharmaCare</span><ChevronRight size={13} /><strong>{pageName(tab)}</strong></div>
            <h1>{pageTitle(tab)}</h1>
          </div>
          <div className="top-actions">
            <div className="global-search-wrap">
              <Search size={16} />
              <input id="global-search" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="Search medicines..." aria-label="Search medicines" />
              <kbd>⌘ K</kbd>
              {globalMatches.length > 0 && (
                <div className="global-results">
                  {globalMatches.map((m) => (
                    <button key={m.id} onClick={() => { setSearch(m.name); navigate("inventory"); setGlobalSearch(""); }}>
                      <span className="result-icon"><Pill size={14} /></span>
                      <span><strong>{m.name}</strong><small>{m.id} · {m.category}</small></span>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="icon-button" onClick={refreshAll} title="Refresh data" aria-label="Refresh data"><RefreshCw size={17} /></button>
            <div className="popover-wrap">
              <button className={`icon-button notification-button ${notificationsOpen ? "selected" : ""}`} onClick={() => { setNotificationsOpen((v) => !v); setProfileOpen(false); }} aria-label="Notifications">
                <Bell size={17} />
                {(lowStock.length + expired.length) > 0 && <span className="notification-dot" />}
              </button>
              {notificationsOpen && <NotificationPopover lowStock={lowStock} expired={expired} onInventory={() => navigate("inventory")} />}
            </div>
            <button className="new-sale" onClick={() => setSaleOpen(true)}><Plus size={17} /> <span>New sale</span></button>
            <div className="profile-wrap">
              <button className="profile-button" onClick={() => { setProfileOpen((v) => !v); setNotificationsOpen(false); }}>
                <span className="avatar">{initials(userName)}</span><span className="profile-text"><strong>{userName}</strong><small>Administrator</small></span><ChevronDown size={14} />
              </button>
              {profileOpen && <div className="profile-popover">
                <div className="profile-popover-head"><span className="avatar large">{initials(userName)}</span><div><strong>{userName}</strong><small>Administrator</small></div></div>
                <button onClick={() => { setDark((v) => !v); setProfileOpen(false); }}>{dark ? <Sun size={16} /> : <Moon size={16} />} {dark ? "Light mode" : "Dark mode"}</button>
                <button className="profile-logout" onClick={() => { setProfileOpen(false); onLogout(); }}><LogOut size={16} /> Sign out</button>
              </div>}
            </div>
          </div>
        </header>

        <div className="page-content">
          {tab === "dashboard" && <Dashboard userName={userName} medicines={medicines} sales={sales} lowStock={lowStock} expired={expired} revenue={revenue} loading={loading} onInventory={() => navigate("inventory")} onSale={() => setSaleOpen(true)} />}
          {tab === "inventory" && <Inventory medicines={filteredMedicines} allMedicines={medicines} search={search} setSearch={setSearch} onSearch={handleSearch} onRefresh={loadMedicines} onStock={setStockOpen} onAdd={() => setAddMedicineOpen(true)} loading={loading} />}
          {tab === "billing" && <BillingPage medicines={medicines} onSubmit={createSale} initialBill={lastBill} onClearBill={() => setLastBill(null)} />}
          {tab === "sales" && <Sales sales={sales} revenue={revenue} loading={loading} />}
        </div>
      </main>

      {saleOpen && <SaleModal medicines={medicines} onClose={() => setSaleOpen(false)} onSubmit={createSale} onSuccess={() => navigate("billing")} />}
      {stockOpen && <StockModal medicine={stockOpen} onClose={() => setStockOpen(null)} onUpdate={updateStock} />}
      {addMedicineOpen && <AddMedicineModal onClose={() => setAddMedicineOpen(false)} onSubmit={addMedicine} />}
      {toast && <div className={`toast ${toast.type}`} role="status"><span className="toast-icon">{toast.type === "success" ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}</span><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss"><X size={14} /></button></div>}
    </div>
  );
}

const LOGIN_HYPERSPEED_OPTIONS = {
  distortion: "turbulentDistortion",
  length: 220,
  roadWidth: 8,
  islandWidth: 1.5,
  lanesPerRoad: 3,
  fov: 85,
  fovSpeedUp: 120,
  speedUp: 1.5,
  carLightsFade: 0.45,
  totalSideLightSticks: 14,
  lightPairsPerRoadWay: 28,
  shoulderLinesWidthPercentage: 0.04,
  brokenLinesWidthPercentage: 0.08,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.1, 0.35],
  lightStickHeight: [1.1, 1.5],
  movingAwaySpeed: [45, 65],
  movingCloserSpeed: [-90, -130],
  carLightsLength: [7, 40],
  carLightsRadius: [0.04, 0.1],
  carWidthPercentage: [0.25, 0.45],
  carShiftX: [-0.7, 0.7],
  carFloorSeparation: [0, 3],
  colors: {
    roadColor: 0x080b10,
    islandColor: 0x0b0d12,
    background: 0x05070a,
    shoulderLines: 0x49d6b0,
    brokenLines: 0x6ee7d0,
    leftCars: [0x49d6b0, 0x22c7a6, 0x9cf4e2],
    rightCars: [0x4f8cff, 0x7c5cff, 0x8fb4ff],
    sticks: 0x49d6b0
  }
};

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    window.setTimeout(() => {
      if (username.trim() && password === "admin123") {
        onLogin(username.trim());
      } else {
        setError("Invalid username or password. Password must be admin123.");
        setSubmitting(false);
      }
    }, 350);
  };

  return <div className="login-shell">
    <div className="login-pixel-background" aria-hidden="true">
      <div className="pixel-layer pixel-layer-main">
        <PixelBlast
          variant="circle"
          pixelSize={5}
          color="#49d6b0"
          patternScale={2.8}
          patternDensity={1.15}
          pixelSizeJitter={0.08}
          enableRipples
          rippleSpeed={0.22}
          rippleThickness={0.14}
          rippleIntensityScale={2.4}
          liquid
          liquidStrength={0.08}
          liquidRadius={1.2}
          liquidWobbleSpeed={4.8}
          speed={0.42}
          edgeFade={0.08}
          transparent
        />
      </div>
      <div className="pixel-layer pixel-layer-blue" aria-hidden="true">
        <PixelBlast
          variant="circle"
          pixelSize={9}
          color="#4f8cff"
          patternScale={3.6}
          patternDensity={0.82}
          pixelSizeJitter={0.03}
          enableRipples={false}
          speed={0.20}
          edgeFade={0.16}
          transparent
        />
      </div>
    </div>
    <div className="login-glow login-glow-one" /><div className="login-glow login-glow-two" />
    <div className="login-brand" aria-label="PharmaCare"><div className="brand-icon"><Pill size={22} /></div><div><strong>PharmaCare</strong></div></div>
    <main className="login-card">
      <div className="login-hyperspeed" aria-hidden="true">
        <Hyperspeed effectOptions={LOGIN_HYPERSPEED_OPTIONS} />
      </div>
      <div className="login-icon"><LockKeyhole size={22} /></div>
      <div className="login-heading"><p className="section-kicker">SECURE WORKSPACE</p><h1>Welcome back</h1><p>Sign in to manage your pharmacy inventory, billing and sales.</p></div>
      <form onSubmit={submit} className="login-form">
        <div className="login-field"><label htmlFor="login-user">Username</label><div className="login-input"><UserRound size={16} /><input id="login-user" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" required /></div></div>
        <div className="login-field"><label htmlFor="login-pass">Password</label><div className="login-input"><LockKeyhole size={16} /><input id="login-pass" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button></div></div>
        {error && <div className="login-error"><CircleAlert size={15} />{error}</div>}
        <button className="login-submit" type="submit" disabled={submitting}>{submitting ? <><RefreshCw size={16} className="spin" /> Signing in...</> : <>Sign in <ChevronRight size={16} /></>}</button>
      </form>
      <div className="login-footer"><CheckCircle2 size={14} /> Local Java backend protected by application login</div>
    </main>
  </div>;
}

function pageName(tab) { return { dashboard: "Overview", inventory: "Inventory", billing: "Billing", sales: "Sales records" }[tab]; }
function pageTitle(tab) { return { dashboard: "Overview", inventory: "Medicine inventory", billing: "Create a bill", sales: "Sales records" }[tab]; }

function SideButton({ icon, label, active, onClick, collapsed }) {
  return <button className={`side-button ${active ? "active" : ""}`} onClick={onClick} title={collapsed ? label : undefined} aria-current={active ? "page" : undefined}>{React.cloneElement(icon, { size: 18 })}<span>{label}</span>{active && !collapsed && <ChevronRight size={14} className="side-arrow" />}</button>;
}

function Dashboard({ userName, medicines, sales, lowStock, expired, revenue, loading, onInventory, onSale }) {
  const recentSales = [...sales].reverse().slice(0, 5);
  const available = medicines.filter((m) => m.status === "Available").length;
  const healthPercent = medicines.length ? Math.round((available / medicines.length) * 100) : 0;

  return <div className="dashboard-stack">
    <section className="hero">
      <div className="hero-copy">
        <div className="hero-chip"><span className="live-dot" /> LIVE WORKSPACE <span className="hero-separator" /> {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
        <h2>Welcome, {userName}.<br /><span>Everything your pharmacy needs.</span></h2>
        <p>Monitor inventory, keep stock healthy, and process customer sales from a focused workspace built for speed.</p>
        <div className="hero-buttons"><button className="hero-primary" onClick={onSale}><ShoppingCart size={17} /> Process sale</button><button className="hero-secondary" onClick={onInventory}>Open inventory <ArrowDownToLine size={15} /></button></div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="hero-grid" />
        <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-pill"><Pill size={51} /></div>
        <div className="float-card fc-one"><div className="float-icon"><Boxes size={15} /></div><span>Stock health<strong>{healthPercent}%</strong></span></div>
        <div className="float-card fc-two"><div className="float-icon"><ReceiptText size={15} /></div><span>Transactions<strong>{sales.length}</strong></span></div>
      </div>
    </section>

    <section className="stat-grid">
      <StatCard icon={<Boxes />} label="Total medicines" value={medicines.length} meta="Across inventory" tone="teal" />
      <StatCard icon={<AlertTriangle />} label="Low stock" value={lowStock.length} meta={lowStock.length ? "Needs attention" : "All levels healthy"} tone="amber" />
      <StatCard icon={<ReceiptText />} label="Completed sales" value={sales.length} meta="Lifetime transactions" tone="blue" />
      <StatCard icon={<TrendingUp />} label="Total revenue" value={money(revenue)} meta="From completed sales" tone="green" />
    </section>

    <div className="dashboard-grid">
      <section className="panel health-panel">
        <PanelHeader title="Inventory health" subtitle="A quick view of your current stock position" icon={<Activity size={17} />} action={<span className="panel-live"><span /> Live</span>} />
        <div className="health-overview"><div className="health-ring" style={{ "--value": `${healthPercent * 3.6}deg` }}><div><strong>{healthPercent}%</strong><span>healthy</span></div></div><div className="health-copy"><strong>{available} of {medicines.length} medicines</strong><p>currently have a healthy stock level.</p><button className="text-button" onClick={onInventory}>Review inventory <ChevronRight size={14} /></button></div></div>
        <div className="health-list"><HealthRow label="Available" value={available} total={medicines.length} type="good" /><HealthRow label="Low stock" value={lowStock.length} total={medicines.length} type="warn" /><HealthRow label="Expired" value={expired.length} total={medicines.length} type="bad" /></div>
      </section>

      <section className="panel activity-panel">
        <PanelHeader title="Recent activity" subtitle="Latest completed transactions" icon={<Clock3 size={17} />} action={<button className="panel-link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Updated now</button>} />
        {loading ? <ActivitySkeleton /> : recentSales.length === 0 ? <EmptyState icon={<ReceiptText />} text="No sales yet" hint="Completed sales will appear here." /> : <div className="activity-list">{recentSales.map((sale) => <div className="activity-row" key={sale.billNumber}><div className="activity-icon"><ReceiptText size={15} /></div><div className="activity-main"><strong>{sale.customerName}</strong><span>{sale.billNumber} · {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}</span></div><div className="activity-side"><strong>{money(sale.total)}</strong><span>{sale.date}</span></div></div>)}</div>}
      </section>
    </div>

    <section className="panel quick-panel"><PanelHeader title="Quick inventory" subtitle="Your most important medicines at a glance" icon={<Pill size={17} />} action={<button className="panel-link" onClick={onInventory}>View all <ChevronRight size={14} /></button>} />{loading ? <TableSkeleton /> : <MedicineTable medicines={medicines.slice(0, 5)} compact />}</section>
  </div>;
}

function Inventory({ medicines, allMedicines, search, setSearch, onSearch, onRefresh, onStock, onAdd, loading }) {
  const [filter, setFilter] = useState("all");
  const categories = [...new Set(allMedicines.map((m) => m.category))];
  const displayed = filter === "all" ? medicines : filter === "low" ? medicines.filter((m) => m.stock <= 5) : filter === "expired" ? medicines.filter((m) => m.status === "EXPIRED") : medicines.filter((m) => m.category === filter);
  return <div className="page-stack">
    <div className="page-intro"><div><p className="section-kicker">INVENTORY CONTROL</p><h2>Keep every medicine accounted for.</h2><p>Search, monitor and adjust stock without leaving the workspace.</p></div><div className="page-actions"><button className="secondary-button" onClick={onRefresh}><RefreshCw size={16} /> Sync inventory</button><button className="primary-button" onClick={onAdd}><Plus size={16} /> Add medicine</button></div></div>
    <div className="inventory-toolbar">
      <div className="search-box large"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSearch()} placeholder="Search ID, medicine or category" />{search && <button onClick={() => { setSearch(""); onRefresh(); }} aria-label="Clear search"><X size={14} /></button>}</div>
      <button className="secondary-button" onClick={onSearch}><Search size={15} /> Search</button>
      <div className="filter-group"><FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All <span>{allMedicines.length}</span></FilterButton><FilterButton active={filter === "low"} onClick={() => setFilter("low")}>Low stock <span>{allMedicines.filter(m => m.stock <= 5).length}</span></FilterButton><FilterButton active={filter === "expired"} onClick={() => setFilter("expired")}>Expired <span>{allMedicines.filter(m => m.status === "EXPIRED").length}</span></FilterButton>{categories.slice(0, 2).map(c => <FilterButton key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</FilterButton>)}</div>
    </div>
    <section className="panel"><PanelHeader title="Medicine catalog" subtitle={`${displayed.length} shown · sorted through Java TreeMap`} icon={<Boxes size={17} />} action={<span className="data-chip"><Zap size={12} /> Synced</span>} />{loading ? <TableSkeleton /> : <MedicineTable medicines={displayed} onStock={onStock} />}</section>
  </div>;
}

function FilterButton({ active, onClick, children }) { return <button className={`filter-button ${active ? "active" : ""}`} onClick={onClick}>{children}</button>; }

function MedicineTable({ medicines, onStock, compact = false }) {
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>MEDICINE</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>EXPIRY</th><th>STATUS</th>{!compact && <th className="action-col">ACTION</th>}</tr></thead><tbody>{medicines.map((m) => <tr key={m.id}><td><div className="medicine-cell"><div className="medicine-icon"><Pill size={15} /></div><div><strong>{m.name}</strong><span>{m.id}</span></div></div></td><td><span className="category">{m.category}</span></td><td><strong>{money(m.price)}</strong></td><td><span className={`stock-number ${m.stock <= 5 ? "danger" : ""}`}>{m.stock}<small> units</small></span></td><td><span className="expiry-cell"><CalendarDays size={13} /> {m.expiry}</span></td><td><StatusBadge status={m.status} /></td>{!compact && <td><button className="small-button" onClick={() => onStock(m)}><ArrowUpToLine size={13} /> Update</button></td>}</tr>)}</tbody></table>{medicines.length === 0 && <EmptyState icon={<PackageSearch />} text="No medicines found" hint="Try a different search or filter." />}</div>;
}

function BillingPage({ medicines, onSubmit, initialBill, onClearBill }) {
  const [form, setForm] = useState({ customerName: "", phone: "", medicineId: "", quantity: 1 });
  const [bill, setBill] = useState(initialBill || null);
  useEffect(() => { if (initialBill) setBill(initialBill); }, [initialBill]);
  const [submitting, setSubmitting] = useState(false);
  const selected = medicines.find((m) => m.id === form.medicineId.toUpperCase());
  const quantity = Number(form.quantity || 0);
  const total = selected ? selected.price * quantity : 0;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await onSubmit(form);
    setSubmitting(false);
    if (result) setBill(result);
  };

  return <div className="page-stack"><div className="page-intro"><div><p className="section-kicker">CHECKOUT</p><h2>Process a customer purchase.</h2><p>Enter the customer and medicine details. The Java backend handles validation and stock deduction.</p></div><div className="checkout-status"><span className="status-dot" /> Ready to bill</div></div><div className="billing-layout"><section className="panel billing-form"><PanelHeader title="Sale details" subtitle="Customer and medicine information" icon={<ShoppingCart size={17} />} /><form onSubmit={submit}><FormSectionTitle>Customer information</FormSectionTitle><div className="form-grid"><Field label="Customer name" icon={<UserRound size={15} />} value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} placeholder="e.g. Rahul Patil" required /><Field label="Phone number" icon={<UsersRound size={15} />} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Optional" /></div><FormSectionTitle>Medicine details</FormSectionTitle><div className="form-grid"><Field label="Medicine ID" icon={<Pill size={15} />} value={form.medicineId} onChange={(v) => setForm({ ...form, medicineId: v.toUpperCase() })} placeholder="e.g. M101" required /><Field label="Quantity" icon={<Boxes size={15} />} type="number" value={form.quantity} onChange={(v) => setForm({ ...form, quantity: v })} min="1" max={selected?.stock || undefined} required /></div>{selected ? <SelectedMedicine medicine={selected} total={total} quantity={quantity} /> : <div className="field-hint"><Search size={14} /> Enter a medicine ID to preview availability and price.</div>}<button className="submit-sale" type="submit" disabled={submitting || !selected || quantity < 1 || quantity > (selected?.stock || 0)}>{submitting ? <><RefreshCw size={17} className="spin" /> Processing...</> : <><ReceiptText size={17} /> Generate bill</>}</button></form></section><section className="bill-preview">{bill ? <BillCard bill={bill} onNewBill={() => { setBill(null); onClearBill?.(); setForm({ customerName: "", phone: "", medicineId: "", quantity: 1 }); }} /> : <EmptyBill />}</section></div></div>;
}

function Sales({ sales, revenue, loading }) {
  const [query, setQuery] = useState("");
  const filtered = [...sales].reverse().filter((s) => `${s.billNumber} ${s.customerName} ${s.phone}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page-stack"><div className="page-intro"><div><p className="section-kicker">REPORTING</p><h2>Track completed sales.</h2><p>Every completed transaction is stored by the Java LinkedList backend.</p></div><div className="sales-kpi"><span>Total revenue</span><strong>{money(revenue)}</strong></div></div><section className="sales-summary"><SummaryCard label="Total revenue" value={money(revenue)} icon={<TrendingUp size={19} />} /><SummaryCard label="Transactions" value={sales.length} icon={<ReceiptText size={19} />} /><SummaryCard label="Latest sale" value={sales.length ? sales[sales.length - 1].date : "—"} icon={<CalendarDays size={19} />} /></section><section className="panel"><PanelHeader title="Transaction history" subtitle="Completed customer purchases" icon={<ReceiptText size={17} />} action={<div className="table-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter records..." /></div>} />{loading ? <TableSkeleton /> : <div className="table-wrap"><table className="data-table sales-table"><thead><tr><th>BILL</th><th>DATE</th><th>CUSTOMER</th><th>PHONE</th><th>ITEMS</th><th>TOTAL</th></tr></thead><tbody>{filtered.map((s) => <tr key={s.billNumber}><td><span className="bill-number">{s.billNumber}</span></td><td><span className="date-cell"><CalendarDays size={13} /> {s.date}</span></td><td><strong>{s.customerName}</strong></td><td>{s.phone || "—"}</td><td>{s.items.length}</td><td><strong className="money">{money(s.total)}</strong></td></tr>)}</tbody></table>{!filtered.length && <EmptyState icon={<ReceiptText />} text="No matching sales" hint="Completed sales will appear here." />}</div>}</section></div>;
}

function SummaryCard({ label, value, icon }) { return <div className="summary-card"><div className="summary-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function StatCard({ icon, label, value, meta, tone }) { return <div className={`stat-card ${tone}`}><div className="stat-icon">{icon}</div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{meta}</small></div></div>; }
function PanelHeader({ title, subtitle, icon, action }) { return <div className="panel-header"><div className="panel-title-icon">{icon}</div><div className="panel-title"><h3>{title}</h3><p>{subtitle}</p></div>{action && <div className="panel-action">{action}</div>}</div>; }
function HealthRow({ label, value, total, type }) { const percent = total ? Math.round((value / total) * 100) : 0; return <div className="health-row"><div className="health-label"><span>{label}</span><strong>{value}</strong></div><div className="progress"><div className={`progress-fill ${type}`} style={{ width: `${percent}%` }} /></div><small>{percent}%</small></div>; }
function StatusBadge({ status }) { const cls = status === "Available" ? "available" : status === "LOW STOCK" ? "low" : "expired"; return <span className={`status-badge ${cls}`}><span />{status}</span>; }
function FormSectionTitle({ children }) { return <div className="form-section-title"><span>{children}</span></div>; }
function SelectedMedicine({ medicine, total, quantity }) { return <div className="selected-medicine"><div className="medicine-icon large"><Pill size={19} /></div><div className="selected-info"><strong>{medicine.name}</strong><span>{medicine.category} · {medicine.stock} units available · {money(medicine.price)} each</span></div><div className="selected-price"><small>{quantity} ×</small>{money(total)}</div></div>; }
function Field({ label, icon, value, onChange, type = "text", placeholder, required, min, max }) { return <div className="field"><label>{icon}{label}{required && <em>*</em>}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} min={min} max={max} /></div>; }
function EmptyBill() { return <div className="empty-bill"><div className="empty-bill-icon"><ReceiptText size={27} /></div><h3>Bill preview</h3><p>Complete a sale and the generated receipt will appear here.</p><span><Check size={13} /> Stock updates automatically</span></div>; }
function BillCard({ bill, onNewBill }) { return <div className="receipt"><div className="receipt-top"><div className="receipt-brand"><div className="receipt-logo"><Pill size={16} /></div><strong>PharmaCare</strong></div><span className="paid"><Check size={11} /> PAID</span></div><div className="receipt-title">CUSTOMER BILL</div><div className="receipt-meta"><span>{bill.billNumber}</span><span>{bill.date}</span></div><div className="receipt-customer"><span>Customer</span><strong>{bill.customerName}</strong><small>{bill.phone || "No phone provided"}</small></div><div className="receipt-items">{bill.items.map((item, i) => <div className="receipt-item" key={i}><div><strong>{item.name}</strong><span>Qty {item.quantity}</span></div><strong>{money(item.amount)}</strong></div>)}</div><div className="receipt-total"><span>Total paid</span><strong>{money(bill.total)}</strong></div><div className="receipt-footer">Thank you for choosing PharmaCare.</div><div className="receipt-actions"><button className="secondary-button" onClick={() => window.print()}><Download size={14} /> Print / Save</button><button className="submit-sale" onClick={onNewBill}><Plus size={14} /> New bill</button></div></div>; }
function EmptyState({ icon, text, hint }) { return <div className="empty-state"><div className="empty-state-icon">{icon}</div><strong>{text}</strong>{hint && <span>{hint}</span>}</div>; }
function ActivitySkeleton() { return <div className="skeleton-list">{[1,2,3].map(i => <div className="skeleton-row" key={i}><span /><div><i /><i /></div><b /></div>)}</div>; }
function TableSkeleton() { return <div className="skeleton-table">{[1,2,3,4].map(i => <div key={i}><i /><i /><i /><i /></div>)}</div>; }

function initials(name) {
  return String(name || "User").trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "U";
}

function AddMedicineModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ id: "", name: "", category: "", price: "", stock: "", expiry: "" });
  const [submitting, setSubmitting] = useState(false);
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onSubmit(form);
    setSubmitting(false);
  };
  return <Modal title="Add medicine" subtitle="Create a new inventory record" onClose={onClose}>
    <form onSubmit={submit} className="modal-form">
      <div className="form-grid"><Field label="Medicine ID" icon={<Pill size={15} />} value={form.id} onChange={v => update("id", v.toUpperCase())} placeholder="M106" required /><Field label="Medicine name" icon={<PackageSearch size={15} />} value={form.name} onChange={v => update("name", v)} placeholder="Medicine name" required /></div>
      <div className="form-grid"><Field label="Category" icon={<Boxes size={15} />} value={form.category} onChange={v => update("category", v)} placeholder="Pain Relief" required /><Field label="Price" icon={<TrendingUp size={15} />} type="number" min="0" value={form.price} onChange={v => update("price", v)} placeholder="25.00" required /></div>
      <div className="form-grid"><Field label="Stock quantity" icon={<Boxes size={15} />} type="number" min="0" value={form.stock} onChange={v => update("stock", v)} placeholder="50" required /><Field label="Expiry date" icon={<CalendarDays size={15} />} type="date" value={form.expiry} onChange={v => update("expiry", v)} required /></div>
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="submit-sale" type="submit" disabled={submitting}>{submitting ? <><RefreshCw size={16} className="spin" /> Adding...</> : <><Plus size={16} /> Add medicine</>}</button></div>
    </form>
  </Modal>;
}

function StockModal({ medicine, onClose, onUpdate }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.focus(), []);
  const submit = () => onUpdate(medicine.id, value);
  return <Modal title="Update stock" subtitle={`Adjust inventory for ${medicine.name}`} onClose={onClose}><div className="stock-current"><div><span>Current stock</span><strong>{medicine.stock} units</strong></div><StatusBadge status={medicine.status} /></div><label className="field-label" htmlFor="stock-adjustment">Adjustment</label><input ref={inputRef} id="stock-adjustment" className="modal-input" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 10 or -5" onKeyDown={(e) => e.key === "Enter" && submit()} /><div className="adjust-hint"><ArrowUpToLine size={14} /> Positive adds stock. Negative removes stock.</div><div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="submit-sale" onClick={submit} disabled={!value.trim()}><CheckCircle2 size={16} /> Update stock</button></div></Modal>;
}

function SaleModal({ medicines, onClose, onSubmit, onSuccess }) {
  const [form, setForm] = useState({ customerName: "", phone: "", medicineId: "", quantity: 1 });
  const [submitting, setSubmitting] = useState(false);
  const selected = medicines.find((m) => m.id === form.medicineId.toUpperCase());
  const submit = async (e) => { e.preventDefault(); setSubmitting(true); const result = await onSubmit(form); setSubmitting(false); if (result) { onClose(); onSuccess?.(); } };
  return <Modal title="New sale" subtitle="Create a customer purchase" onClose={onClose}><form onSubmit={submit} className="modal-form"><Field label="Customer name" value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} required placeholder="Customer name" /><Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Optional" /><div className="form-grid"><Field label="Medicine ID" value={form.medicineId} onChange={(v) => setForm({ ...form, medicineId: v.toUpperCase() })} required placeholder="M101" /><Field label="Quantity" type="number" min="1" max={selected?.stock || undefined} value={form.quantity} onChange={(v) => setForm({ ...form, quantity: v })} required /></div>{selected && <SelectedMedicine medicine={selected} total={selected.price * Number(form.quantity || 0)} quantity={Number(form.quantity || 0)} />}<button className="submit-sale" type="submit" disabled={submitting || !selected}>{submitting ? <><RefreshCw size={16} className="spin" /> Processing...</> : <><ReceiptText size={16} /> Complete sale</>}</button></form></Modal>;
}

function Modal({ title, subtitle, onClose, children }) { return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(e) => e.stopPropagation()}><div className="modal-header"><div><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><button className="modal-close" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>{children}</div></div>; }

function NotificationPopover({ lowStock, expired, onInventory }) {
  return <div className="notification-popover"><div className="popover-title"><div><strong>Notifications</strong><span>Inventory attention</span></div><Bell size={16} /></div>{lowStock.length + expired.length === 0 ? <EmptyState icon={<CheckCircle2 />} text="You're all caught up" hint="No inventory alerts." /> : <div className="notification-list">{lowStock.slice(0, 3).map(m => <button key={`low-${m.id}`} onClick={onInventory}><span className="notice-icon amber"><AlertTriangle size={14} /></span><span><strong>Low stock: {m.name}</strong><small>{m.stock} units remaining</small></span></button>)}{expired.slice(0, 2).map(m => <button key={`exp-${m.id}`} onClick={onInventory}><span className="notice-icon red"><CircleAlert size={14} /></span><span><strong>Expired: {m.name}</strong><small>Remove from active stock</small></span></button>)}</div>}<button className="popover-footer" onClick={onInventory}>Open inventory <ChevronRight size={14} /></button></div>;
}

function money(value) { return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

createRoot(document.getElementById("root")).render(<App />);
