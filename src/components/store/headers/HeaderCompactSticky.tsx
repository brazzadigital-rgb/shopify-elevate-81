import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, Search, User, MapPin, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function HeaderCompactSticky() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin } = useAuth();
  const { getSetting, isEnabled } = useStoreSettings();
  const { setIsOpen, itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMobileMenuOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`); setSearchOpen(false); }
  };

  const logoUrl = getSetting("logo_url", "");
  const storeName = getSetting("store_name", "STORE");
  const bgColor = `hsl(var(--header-bg))`;
  const txtColor = `hsl(var(--header-text))`;
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
      {isEnabled("topbar_enabled") && !scrolled && (
        <div className="bg-white">
          <div className="container flex items-center justify-center h-8">
            <p className="text-[11px] font-sans font-medium tracking-widest uppercase text-primary truncate">
              {getSetting("topbar_text", "✈️ Frete Grátis para todo Brasil")}
            </p>
          </div>
        </div>
      )}

      <header
        className="sticky top-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: bgColor,
          height: scrolled ? 52 : 64,
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.15)" : "none",
        }}
      >
        <div className="container flex items-center justify-between h-full gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden w-9 h-9 min-h-[unset] min-w-[unset]" style={{ color: txtColor }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Link to="/" className="shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="object-contain transition-all duration-300" style={{ height: scrolled ? 28 : 36, maxWidth: 130 }} />
              ) : (
                <span className="font-display text-lg font-bold uppercase" style={{ color: txtColor }}>{storeName}</span>
              )}
            </Link>
          </div>

          {/* Desktop nav inline */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className={`font-sans text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${location.pathname === link.to ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                style={{ color: txtColor }}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setSearchOpen(!searchOpen)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors min-h-[unset] min-w-[unset]">
              <Search className="w-4 h-4" style={{ color: txtColor }} />
            </button>
            {accountEnabled && (
              <Link to={user ? (isAdmin ? "/admin" : "/conta") : "/auth"} className="hidden md:flex w-9 h-9 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                <User className="w-4 h-4" style={{ color: txtColor }} />
              </Link>
            )}
            {trackEnabled && (
              <Link to="/rastreamento" className="hidden md:flex w-9 h-9 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                <MapPin className="w-4 h-4" style={{ color: txtColor }} />
              </Link>
            )}
            {cartEnabled && (
              <button onClick={() => setIsOpen(true)} className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors min-h-[unset] min-w-[unset]">
                <ShoppingBag className="w-4 h-4" style={{ color: txtColor }} />
                {itemCount > 0 && <span className="absolute -top-0.5 -right-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold w-4 h-4 flex items-center justify-center font-sans min-h-[unset]">{itemCount}</span>}
              </button>
            )}
          </div>
        </div>

        {/* Search drawer */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden" style={{ backgroundColor: bgColor }}>
              <form onSubmit={handleSearch} className="container py-3">
                <div className="relative max-w-xl mx-auto">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="O que está buscando?" autoFocus
                    className="w-full h-10 rounded-full border-0 bg-white/15 text-sm font-sans pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-white/50" style={{ color: txtColor }} />
                  <button type="submit" className="absolute right-1.5 top-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center min-h-[unset] min-w-[unset]">
                    <Search className="w-4 h-4 text-accent-foreground" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile menu */}
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
