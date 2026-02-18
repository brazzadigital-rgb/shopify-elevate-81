import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart, Search, User, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function StoreHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAdmin } = useAuth();
  const { getSetting, isEnabled } = useStoreSettings();
  const { isOpen, setIsOpen, itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: "Início", to: "/" },
    { label: "Catálogo", to: "/colecoes" },
    { label: "Ofertas", to: "/ofertas" },
    { label: "Contato", to: "/contato" },
  ];

  return (
    <>
      {/* Topbar — info strip */}
      {isEnabled("topbar_enabled") && (
        <div className="bg-foreground">
          <div className="container flex items-center justify-center h-8">
            <p className="text-[11px] font-sans font-medium text-background/80 tracking-widest uppercase">
              {getSetting("topbar_text", "✈️ Frete Grátis para todo Brasil")}
            </p>
          </div>
        </div>
      )}

      {/* Main header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/95 backdrop-blur-2xl shadow-[0_1px_0_0_hsl(var(--border)),0_4px_24px_-4px_rgba(0,0,0,0.08)]"
            : "bg-background border-b border-border"
        }`}
      >
        <div className="container flex items-center justify-between gap-2 h-14 md:h-[68px]">
          {/* Mobile: hamburger left */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-10 h-10 md:hidden text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* Logo — centered on mobile */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group md:mr-auto">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-accent flex items-center justify-center glow-orange group-hover:scale-110 transition-transform duration-300">
              <span className="text-accent-foreground font-bold text-sm md:text-base">🐆</span>
            </div>
            <span className="font-display text-base md:text-lg font-bold tracking-tight text-foreground uppercase hidden sm:block">
              {getSetting("store_name", "SPORT STORE")}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-3.5 py-2 font-sans text-[13px] font-semibold uppercase tracking-wider transition-colors rounded-lg ${
                  location.pathname === link.to
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
                {location.pathname === link.to && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-accent rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions — right side */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Desktop search */}
            <form onSubmit={handleSearch} className="hidden lg:flex">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-44 xl:w-56 h-9 rounded-full bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground text-sm font-sans pl-4 pr-9 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 focus:w-64 transition-all duration-300"
                />
                <button type="submit" className="absolute right-1 top-1 w-7 h-7 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors min-h-[unset] min-w-[unset]">
                  <Search className="w-3.5 h-3.5 text-accent" />
                </button>
              </div>
            </form>

            {/* Mobile search */}
            <Link to="/busca" className="lg:hidden">
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                <Search className="w-[18px] h-[18px]" />
              </Button>
            </Link>

            {/* Account — hidden on small mobile */}
            <Link to={user ? (isAdmin ? "/admin" : "/conta") : "/auth"} className="hidden sm:block">
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                <User className="w-[18px] h-[18px]" />
              </Button>
            </Link>

            {/* Cart */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 font-sans shadow-sm min-h-[unset]"
                >
                  {itemCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu — full height drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-background z-50 md:hidden overflow-y-auto shadow-2xl"
              >
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                      <span className="text-sm">🐆</span>
                    </div>
                    <span className="font-display text-base font-bold uppercase">{getSetting("store_name", "SPORT STORE")}</span>
                  </Link>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Search */}
                <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }} className="p-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="O que está buscando?"
                      className="w-full h-12 rounded-xl bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground text-sm font-sans pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                    />
                    <button type="submit" className="absolute right-2 top-2 w-8 h-8 rounded-lg bg-accent flex items-center justify-center min-h-[unset] min-w-[unset]">
                      <Search className="w-4 h-4 text-accent-foreground" />
                    </button>
                  </div>
                </form>

                {/* Quick access */}
                <div className="px-4 pb-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      to={user ? "/conta" : "/auth"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">Conta</span>
                    </Link>
                    <Link
                      to="/conta/pedidos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">Pedidos</span>
                    </Link>
                    <Link
                      to="/colecoes"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">Catálogo</span>
                    </Link>
                  </div>
                </div>

                {/* Nav links */}
                <nav className="px-4 py-2 flex flex-col gap-0.5">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between py-3.5 px-4 rounded-xl font-sans text-sm font-semibold transition-colors ${
                        location.pathname === link.to
                          ? "bg-accent/10 text-accent"
                          : "text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {link.label}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </nav>

                {!user && (
                  <div className="p-4 mt-auto">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full rounded-xl font-sans h-12 bg-accent text-accent-foreground font-bold uppercase tracking-wider shine">
                        Entrar / Cadastrar
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
