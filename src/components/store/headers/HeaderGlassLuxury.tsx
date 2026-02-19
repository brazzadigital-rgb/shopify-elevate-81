import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, Search, User, MapPin, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function HeaderGlassLuxury() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin } = useAuth();
  const { getSetting, isEnabled } = useStoreSettings();
  const { setIsOpen, itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMobileMenuOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const logoUrl = getSetting("logo_url", "");
  const storeName = getSetting("store_name", "STORE");
  const accountEnabled = getSetting("header_account_enabled", "true") === "true";
  const trackEnabled = getSetting("header_track_enabled", "true") === "true";
  const cartEnabled = getSetting("header_cart_enabled", "true") === "true";

  const navLinks = [
    { label: "Início", to: "/" },
    { label: "Catálogo", to: "/produtos" },
    { label: "Ofertas", to: "/ofertas" },
    { label: "Contato", to: "/contato" },
  ];

  return (
    <>
      {isEnabled("topbar_enabled") && (
        <div className="bg-accent">
          <div className="container flex items-center justify-center h-8">
            <p className="text-[11px] font-sans font-medium tracking-widest uppercase text-accent-foreground/90 truncate">
              {getSetting("topbar_text", "✈️ Frete Grátis para todo Brasil")}
            </p>
          </div>
        </div>
      )}

      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/70 dark:bg-black/60 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.08)]"
            : "bg-white/40 dark:bg-black/30 backdrop-blur-xl"
        }`}
      >
        <div className="container flex items-center justify-between h-[80px] gap-6">
          <Link to="/" className="shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-10 max-w-[140px] object-contain" />
            ) : (
              <span className="font-display text-xl font-bold text-foreground uppercase">{storeName}</span>
            )}
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-auto">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O que está buscando?"
                className="w-full h-11 rounded-full border border-white/20 bg-white/30 dark:bg-white/10 backdrop-blur text-foreground placeholder:text-muted-foreground text-sm font-sans pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button type="submit" className="absolute right-1.5 top-1.5 w-8 h-8 rounded-full bg-accent flex items-center justify-center min-h-[unset] min-w-[unset]">
                <Search className="w-4 h-4 text-accent-foreground" />
              </button>
            </div>
          </form>

          <div className="hidden md:flex items-center gap-4 shrink-0">
            {accountEnabled && (
              <Link to={user ? (isAdmin ? "/admin" : "/conta") : "/auth"} className="text-foreground/70 hover:text-accent transition-colors">
                <User className="w-5 h-5" />
              </Link>
            )}
            {trackEnabled && (
              <Link to="/rastreamento" className="text-foreground/70 hover:text-accent transition-colors">
                <MapPin className="w-5 h-5" />
              </Link>
            )}
            {cartEnabled && (
              <button onClick={() => setIsOpen(true)} className="relative text-foreground/70 hover:text-accent transition-colors min-h-[unset] min-w-[unset]">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold w-4 h-4 flex items-center justify-center font-sans min-h-[unset]">{itemCount}</span>
                )}
              </button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-1">
            {cartEnabled && (
              <button onClick={() => setIsOpen(true)} className="relative w-10 h-10 flex items-center justify-center min-h-[unset] min-w-[unset]">
                <ShoppingBag className="w-5 h-5 text-foreground" />
                {itemCount > 0 && <span className="absolute top-0 right-0 rounded-full bg-accent text-accent-foreground text-[9px] font-bold w-4 h-4 flex items-center justify-center font-sans min-h-[unset]">{itemCount}</span>}
              </button>
            )}
            <Button variant="ghost" size="icon" className="w-10 h-10 min-h-[unset] min-w-[unset]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="O que está buscando?"
              className="w-full h-10 rounded-full border border-border/30 bg-white/40 dark:bg-white/10 backdrop-blur text-foreground text-sm pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-accent/20" />
            <button type="submit" className="absolute right-1 top-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center min-h-[unset] min-w-[unset]">
              <Search className="w-3.5 h-3.5 text-accent-foreground" />
            </button>
          </div>
        </form>

        <nav className="hidden md:block border-t border-white/10">
          <div className="container flex items-center justify-center gap-8 h-10">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className={`font-sans text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors ${location.pathname === link.to ? "text-accent" : "text-foreground/60 hover:text-foreground"}`}>
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Mobile menu - same pattern */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
              <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] z-50 md:hidden bg-background overflow-y-auto shadow-2xl">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                    {logoUrl ? <img src={logoUrl} alt={storeName} className="h-8 object-contain" /> : <span className="font-display text-lg font-bold">{storeName}</span>}
                  </Link>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5" /></Button>
                </div>
                <nav className="p-4 flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between py-3 px-4 rounded-xl font-sans text-sm font-semibold ${location.pathname === link.to ? "bg-accent/10 text-accent" : "text-foreground hover:bg-muted/50"}`}>
                      {link.label}<ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </nav>
                <div className="p-4 space-y-2">
                  {accountEnabled && <Link to={user ? "/conta" : "/auth"} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"><User className="w-5 h-5 text-accent" /><span className="text-sm font-sans font-semibold">Minha conta</span></Link>}
                  {trackEnabled && <Link to="/rastreamento" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"><MapPin className="w-5 h-5 text-accent" /><span className="text-sm font-sans font-semibold">Rastrear pedido</span></Link>}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
