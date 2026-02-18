import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCartStore } from "@/stores/cartStore";
import { ShoppingCart, Search, User, Menu, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function StoreHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAdmin } = useAuth();
  const { getSetting } = useStoreSettings();
  const { isOpen, setIsOpen } = useCartStore();
  const itemCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
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
      {/* Bar 1 — Topbar informativa */}
      <div className="bg-background border-b border-border">
        <div className="container flex items-center justify-between h-9">
          <div className="hidden sm:block" />
          <p className="text-xs font-sans text-muted-foreground tracking-wide text-center flex-1 sm:flex-none">
            ✈️ <span className="font-semibold text-foreground">Frete Grátis</span> para todo Brasil
          </p>
          <div className="hidden sm:flex items-center gap-5 text-xs font-sans text-muted-foreground">
            <Link to="/conta/pedidos" className="hover:text-accent transition-colors flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Rastrear pedido
            </Link>
            <Link to={user ? (isAdmin ? "/admin" : "/conta") : "/auth"} className="hover:text-accent transition-colors flex items-center gap-1">
              <User className="w-3 h-3" /> {user ? "Minha conta" : "Entrar"}
            </Link>
            <button onClick={() => setIsOpen(true)} className="hover:text-accent transition-colors flex items-center gap-1 relative">
              <ShoppingCart className="w-3 h-3" /> Carrinho
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-3 rounded-full bg-accent text-accent-foreground text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bar 2 — Header principal */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-primary/98 backdrop-blur-xl shadow-lg"
            : "bg-primary"
        }`}
      >
        <div className="container flex items-center justify-between gap-4 h-16 md:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center glow-orange group-hover:glow-orange-lg transition-all duration-300">
              <span className="text-accent-foreground font-display font-bold text-base">🐆</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-primary-foreground uppercase hidden sm:block">
              {getSetting("store_name", "SPORT STORE")}
            </span>
          </Link>

          {/* Search - centro */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O que está buscando?"
                className="w-full h-10 rounded-full bg-primary-foreground/10 border border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/40 text-sm font-sans pl-4 pr-10 focus:outline-none focus:border-accent/50 focus:bg-primary-foreground/15 transition-all"
              />
              <button type="submit" className="absolute right-1 top-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center hover:bg-accent/90 transition-colors">
                <Search className="w-4 h-4 text-accent-foreground" />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <Link to="/busca" className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-xl w-9 h-9 text-primary-foreground/60 hover:text-accent hover:bg-primary-foreground/10">
                <Search className="w-[18px] h-[18px]" />
              </Button>
            </Link>

            <Link to={user ? (isAdmin ? "/admin" : "/conta") : "/auth"} className="hidden sm:flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              <User className="w-5 h-5" />
              <div className="hidden lg:block text-left">
                <p className="text-[10px] text-primary-foreground/40 font-sans leading-none">{user ? "Olá!" : "Entrar / Cadastrar"}</p>
                <p className="text-xs font-sans font-semibold leading-tight">Minha conta</p>
              </div>
            </Link>

            <Link to="/conta/pedidos" className="hidden lg:flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              <MapPin className="w-5 h-5" />
              <div className="text-left">
                <p className="text-[10px] text-primary-foreground/40 font-sans leading-none">Onde está meu produto?</p>
                <p className="text-xs font-sans font-semibold leading-tight">Rastrear pedido</p>
              </div>
            </Link>

            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors relative ml-1"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 rounded-full bg-accent text-accent-foreground text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 font-sans">
                    {itemCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-[10px] text-primary-foreground/40 font-sans leading-none">{itemCount} {itemCount === 1 ? "item" : "itens"}</p>
                <p className="text-xs font-sans font-semibold leading-tight">Carrinho</p>
              </div>
            </button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl w-9 h-9 md:hidden text-primary-foreground/60 hover:text-accent hover:bg-primary-foreground/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Nav menu — desktop */}
        <nav className="hidden md:block border-t border-primary-foreground/10">
          <div className="container flex items-center justify-center gap-8 h-10">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-sans text-xs font-bold uppercase tracking-wider transition-colors relative py-2 ${
                  location.pathname === link.to
                    ? "text-accent"
                    : "text-primary-foreground/60 hover:text-primary-foreground"
                }`}
              >
                {link.label}
                {location.pathname === link.to && (
                  <motion.div layoutId="nav-underline" className="absolute -bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden border-t border-primary-foreground/10"
            >
              <nav className="container py-3 flex flex-col gap-1">
                <form onSubmit={handleSearch} className="mb-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="O que está buscando?"
                      className="w-full h-10 rounded-full bg-primary-foreground/10 border border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/40 text-sm font-sans pl-4 pr-10 focus:outline-none focus:border-accent/50 transition-all"
                    />
                    <button type="submit" className="absolute right-1 top-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                      <Search className="w-4 h-4 text-accent-foreground" />
                    </button>
                  </div>
                </form>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`py-2.5 px-4 rounded-xl font-sans text-sm font-bold uppercase tracking-wider transition-colors ${
                      location.pathname === link.to
                        ? "bg-accent/10 text-accent"
                        : "text-primary-foreground/60 hover:bg-primary-foreground/5 hover:text-primary-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {!user && (
                  <Link to="/auth" className="mt-2">
                    <Button className="w-full rounded-xl font-sans h-11 shine bg-accent text-accent-foreground font-bold uppercase tracking-wider">
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
