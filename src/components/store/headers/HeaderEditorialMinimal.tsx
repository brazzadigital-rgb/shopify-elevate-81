import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, Search, User, MapPin, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function HeaderEditorialMinimal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { getSetting, isEnabled } = useStoreSettings();
  const { setIsOpen, itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`); setSearchOpen(false); }
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

      <header className="sticky top-0 z-50 bg-background transition-all duration-300">
        {/* Top row: actions — LOGO CENTER — actions */}
        <div className="container flex items-center justify-between h-[70px]">
          {/* Left actions */}
          <div className="flex items-center gap-3 w-[120px]">
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-foreground/60 hover:text-accent transition-colors min-h-[unset] min-w-[unset]">
              <Search className="w-5 h-5" />
            </button>
            {accountEnabled && (
              <Link to={user ? (isAdmin ? "/admin" : "/conta") : "/auth"} className="hidden md:block text-foreground/60 hover:text-accent transition-colors">
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>

          {/* Center logo */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-10 max-w-[160px] object-contain" />
            ) : (
              <span className="font-display text-2xl font-bold text-foreground uppercase tracking-widest">{storeName}</span>
            )}
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-3 w-[120px] justify-end">
            {trackEnabled && (
              <Link to="/rastreamento" className="hidden md:block text-foreground/60 hover:text-accent transition-colors">
                <MapPin className="w-5 h-5" />
              </Link>
            )}
            {cartEnabled && (
              <button onClick={() => setIsOpen(true)} className="relative text-foreground/60 hover:text-accent transition-colors min-h-[unset] min-w-[unset]">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && <span className="absolute -top-1.5 -right-1.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold w-4 h-4 flex items-center justify-center font-sans min-h-[unset]">{itemCount}</span>}
              </button>
            )}
            <Button variant="ghost" size="icon" className="md:hidden w-10 h-10 min-h-[unset] min-w-[unset]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Search drawer */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border/30">
              <form onSubmit={handleSearch} className="container py-3">
                <div className="relative max-w-xl mx-auto">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="O que está buscando?" autoFocus
                    className="w-full h-11 rounded-full border border-border bg-muted/30 text-foreground text-sm font-sans pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-accent/20" />
                  <button type="submit" className="absolute right-1.5 top-1.5 w-8 h-8 rounded-full bg-accent flex items-center justify-center min-h-[unset] min-w-[unset]">
                    <Search className="w-4 h-4 text-accent-foreground" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav line */}
        <nav className="hidden md:block border-t border-border/30">
          <div className="container flex items-center justify-center gap-10 h-10">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className={`font-sans text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors ${location.pathname === link.to ? "text-accent" : "text-foreground/50 hover:text-foreground"}`}>
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

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
                <form onSubmit={handleSearch} className="p-4">
                  <div className="relative"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar..." className="w-full h-10 rounded-full border border-border bg-muted/30 text-sm pl-4 pr-10 focus:outline-none" />
                    <button type="submit" className="absolute right-1 top-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center min-h-[unset] min-w-[unset]"><Search className="w-3.5 h-3.5 text-accent-foreground" /></button></div>
                </form>
                <nav className="px-4 flex flex-col gap-1">
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
