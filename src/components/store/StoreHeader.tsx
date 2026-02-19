import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, Search, User, Menu, X, ChevronRight, Package, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function StoreHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
      setMobileSearchOpen(false);
    }
  };

  const logoUrl = getSetting("logo_url", "");
  const logoMobileUrl = getSetting("logo_mobile_url", "") || logoUrl;
  const storeName = getSetting("store_name", "SPORT STORE");
  const stickyEnabled = getSetting("header_sticky_enabled", "true") === "true";
  const headerBg = getSetting("header_bg_color", "0 0% 20%");
  const headerTextColor = getSetting("header_text_color", "0 0% 100%");
  const searchBg = getSetting("header_search_bg_color", "0 0% 95%");
  const searchPlaceholder = getSetting("header_search_placeholder", "O que está buscando?");
  const headerHeight = parseInt(getSetting("header_height", "88"));
  const accountEnabled = getSetting("header_account_enabled", "true") === "true";
  const trackEnabled = getSetting("header_track_enabled", "true") === "true";
  const cartEnabled = getSetting("header_cart_enabled", "true") === "true";
  const accountTopText = getSetting("header_account_top_text", "Entrar / Cadastrar");
  const trackTopText = getSetting("header_track_top_text", "Onde está meu produto?");
  const shadowIntensity = parseInt(getSetting("header_shadow_intensity", "50"));
  const logoWidth = parseInt(getSetting("header_logo_width", "160"));
  const logoHeight = parseInt(getSetting("header_logo_height", "48"));
  const logoMobileWidth = parseInt(getSetting("header_logo_mobile_width", "120"));
  const logoMobileHeight = parseInt(getSetting("header_logo_mobile_height", "36"));

  const navLinks = [
    { label: "Início", to: "/" },
    { label: "Catálogo", to: "/colecoes" },
    { label: "Ofertas", to: "/ofertas" },
    { label: "Contato", to: "/contato" },
  ];

  const LogoComponent = ({ mobile = false }: { mobile?: boolean }) => {
    const src = mobile ? logoMobileUrl : logoUrl;
    if (src) {
      return (
        <img
          src={src}
          alt={storeName}
          className="object-contain"
          style={{
            width: `${mobile ? logoMobileWidth : logoWidth}px`,
            height: `${mobile ? logoMobileHeight : logoHeight}px`,
          }}
        />
      );
    }
    return (
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-accent flex items-center justify-center">
          <span className="text-accent-foreground font-bold text-base">🐆</span>
        </div>
        <span className="font-display text-lg font-bold tracking-tight uppercase" style={{ color: `hsl(${headerTextColor})` }}>
          {storeName}
        </span>
      </div>
    );
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: `hsl(${headerBg})`,
    height: `${headerHeight}px`,
    ...(scrolled && stickyEnabled ? {
      boxShadow: `0 4px ${shadowIntensity}px -8px rgba(0,0,0,0.${Math.min(shadowIntensity, 99)})`,
    } : {}),
  };

  return (
    <>
      {/* Top bar — info strip */}
      {isEnabled("topbar_enabled") && (
        <div className="bg-foreground">
          <div className="container flex items-center justify-center h-8 gap-4">
            <p className="text-[11px] font-sans font-medium tracking-widest uppercase truncate text-center" style={{ color: `hsl(${headerTextColor} / 0.8)` }}>
              {getSetting("topbar_text", "✈️ Frete Grátis para todo Brasil")}
            </p>
          </div>
        </div>
      )}

      {/* Main header */}
      <header
        className={`${stickyEnabled ? 'sticky top-0' : ''} z-50 transition-all duration-500`}
        style={headerStyle}
      >
        <div className="container flex items-center justify-between gap-4 h-full">
          {/* MOBILE LEFT — Logo */}
          <Link to="/" className="flex md:hidden items-center shrink-0">
            <LogoComponent mobile />
          </Link>

          {/* DESKTOP LEFT — Logo */}
          <Link to="/" className="hidden md:flex items-center gap-2 shrink-0 group">
            <LogoComponent />
          </Link>

          {/* CENTER — Search bar (desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-auto">
            <div className="relative w-full group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-11 rounded-full border-0 text-foreground placeholder:text-muted-foreground text-sm font-sans pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                style={{ backgroundColor: `hsl(${searchBg})` }}
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 w-8 h-8 rounded-full bg-accent hover:bg-accent/90 flex items-center justify-center transition-all duration-200 active:scale-95 min-h-[unset] min-w-[unset]"
              >
                <Search className="w-4 h-4 text-accent-foreground" />
              </button>
            </div>
          </form>

          {/* RIGHT — Account / Track / Cart (desktop) */}
          <div className="hidden md:flex items-center gap-0 shrink-0">
            {/* Minha Conta */}
            {accountEnabled && (
              <Link
                to={user ? (isAdmin ? "/admin" : "/conta") : "/auth"}
                className="flex items-center gap-2.5 px-4 py-2 rounded-lg transition-all duration-200 hover:brightness-125 group active:scale-[0.98]"
              >
                <User className="w-5 h-5 shrink-0" style={{ color: `hsl(${headerTextColor})` }} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-sans leading-tight opacity-70" style={{ color: `hsl(${headerTextColor})` }}>
                    {user ? "Olá, bem-vindo!" : accountTopText}
                  </span>
                  <span className="text-xs font-sans font-semibold leading-tight" style={{ color: `hsl(${headerTextColor})` }}>
                    Minha conta
                  </span>
                </div>
              </Link>
            )}

            {/* Separator */}
            {accountEnabled && trackEnabled && (
              <div className="w-px h-8 mx-1" style={{ backgroundColor: `hsl(${headerTextColor} / 0.15)` }} />
            )}

            {/* Rastrear Pedido */}
            {trackEnabled && (
              <Link
                to="/conta/pedidos"
                className="flex items-center gap-2.5 px-4 py-2 rounded-lg transition-all duration-200 hover:brightness-125 group active:scale-[0.98]"
              >
                <MapPin className="w-5 h-5 shrink-0" style={{ color: `hsl(${headerTextColor})` }} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-sans leading-tight opacity-70" style={{ color: `hsl(${headerTextColor})` }}>
                    {trackTopText}
                  </span>
                  <span className="text-xs font-sans font-semibold leading-tight" style={{ color: `hsl(${headerTextColor})` }}>
                    Rastrear pedido
                  </span>
                </div>
              </Link>
            )}

            {/* Separator */}
            {trackEnabled && cartEnabled && (
              <div className="w-px h-8 mx-1" style={{ backgroundColor: `hsl(${headerTextColor} / 0.15)` }} />
            )}

            {/* Carrinho */}
            {cartEnabled && (
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2.5 px-4 py-2 rounded-lg transition-all duration-200 hover:brightness-125 active:scale-[0.98]"
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5" style={{ color: `hsl(${headerTextColor})` }} />
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="absolute -top-2 -right-2.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 font-sans shadow-sm min-h-[unset]"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </div>
                <span className="text-xs font-sans font-semibold" style={{ color: `hsl(${headerTextColor})` }}>
                  Carrinho
                </span>
              </button>
            )}
          </div>

          {/* MOBILE RIGHT — Search + Cart + Hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-colors min-h-[unset] min-w-[unset]"
            >
              <Search className="w-5 h-5" style={{ color: `hsl(${headerTextColor})` }} />
            </button>

            {cartEnabled && (
              <button
                onClick={() => setIsOpen(true)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors min-h-[unset] min-w-[unset]"
              >
                <ShoppingBag className="w-5 h-5" style={{ color: `hsl(${headerTextColor})` }} />
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute -top-0.5 -right-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold min-w-[16px] h-[16px] flex items-center justify-center px-0.5 font-sans min-h-[unset]"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-10 h-10 shrink-0 min-h-[unset] min-w-[unset]"
              style={{ color: `hsl(${headerTextColor})` }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Desktop nav bar — white background like reference */}
        <nav className="hidden md:block bg-background border-t border-b border-border shadow-sm">
          <div className="container flex items-center justify-center gap-2 h-12">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-5 py-2 font-sans text-sm font-bold uppercase tracking-widest transition-all duration-200 hover:text-accent active:scale-[0.97] ${
                  location.pathname === link.to
                    ? "text-accent"
                    : "text-foreground/80"
                }`}
              >
                {link.label}
                {location.pathname === link.to && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute bottom-0 left-3 right-3 h-[2px] bg-accent rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Mobile search overlay */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 md:hidden"
                onClick={() => setMobileSearchOpen(false)}
              />
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-50 p-4 md:hidden"
                style={{ backgroundColor: `hsl(${headerBg})` }}
              >
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={searchPlaceholder}
                      autoFocus
                      className="w-full h-12 rounded-full border-0 text-foreground placeholder:text-muted-foreground text-sm font-sans pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-accent/40"
                      style={{ backgroundColor: `hsl(${searchBg})` }}
                    />
                    <button type="submit" className="absolute right-2 top-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center min-h-[unset] min-w-[unset]">
                      <Search className="w-4 h-4 text-accent-foreground" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileSearchOpen(false)}
                    className="w-12 h-12 rounded-full flex items-center justify-center min-h-[unset] min-w-[unset]"
                    style={{ color: `hsl(${headerTextColor})` }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile menu drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
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
                    <LogoComponent mobile />
                  </Link>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Quick access blocks */}
                <div className="px-4 py-4">
                  <div className="grid grid-cols-1 gap-2">
                    {accountEnabled && (
                      <Link
                        to={user ? "/conta" : "/auth"}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <User className="w-5 h-5 text-accent" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-sans text-muted-foreground">{user ? "Olá, bem-vindo!" : accountTopText}</span>
                          <span className="text-sm font-sans font-semibold text-foreground">Minha conta</span>
                        </div>
                      </Link>
                    )}
                    {trackEnabled && (
                      <Link
                        to="/conta/pedidos"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <MapPin className="w-5 h-5 text-accent" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-sans text-muted-foreground">{trackTopText}</span>
                          <span className="text-sm font-sans font-semibold text-foreground">Rastrear pedido</span>
                        </div>
                      </Link>
                    )}
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
