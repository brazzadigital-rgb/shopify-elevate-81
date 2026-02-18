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
        <div className="container flex items-center justify-between gap-3 h-16 md:h-[68px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center glow-orange group-hover:scale-110 transition-transform duration-300">
              <span className="text-accent-foreground font-bold text-base">🐆</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-foreground uppercase hidden sm:block">
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

          {/* Search + Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
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
                <button type="submit" className="absolute right-1 top-1 w-7 h-7 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors">
                  <Search className="w-3.5 h-3.5 text-accent" />
                </button>
              </div>
            </form>

            {/* Mobile search */}
            <Link to="/busca" className="lg:hidden">
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                <Search className="w-[18px] h-[18px]" />
              </Button>
            </Link>

            {/* Account */}
            <Link to={user ? (isAdmin ? "/admin" : "/conta") : "/auth"}>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                <User className="w-[18px] h-[18px]" />
              </Button>
            </Link>

            {/* Cart */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 font-sans shadow-sm"
                >
                  {itemCount}
                </motion.span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-9 h-9 md:hidden text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <nav className="container py-3 flex flex-col gap-0.5">
                <form onSubmit={handleSearch} className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="O que está buscando?"
                      className="w-full h-10 rounded-xl bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground text-sm font-sans pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                    />
                    <button type="submit" className="absolute right-1.5 top-1.5 w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                      <Search className="w-3.5 h-3.5 text-accent-foreground" />
                    </button>
                  </div>
                </form>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center justify-between py-3 px-4 rounded-xl font-sans text-sm font-semibold transition-colors ${
                      location.pathname === link.to
                        ? "bg-accent/10 text-accent"
                        : "text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {link.label}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                ))}
                {!user && (
                  <Link to="/auth" className="mt-3">
                    <Button className="w-full rounded-xl font-sans h-11 bg-accent text-accent-foreground font-bold uppercase tracking-wider shine">
                      Entrar / Cadastrar
                    </Button>
                  </Link>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
