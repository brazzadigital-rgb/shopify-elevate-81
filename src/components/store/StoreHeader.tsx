import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart, Search, Heart, User, Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function StoreHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { getSetting, isEnabled } = useStoreSettings();
  const cartCtx = useCart();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  const navLinks = [
    { label: "Início", to: "/" },
    { label: "Coleções", to: "/colecoes" },
    { label: "Ofertas", to: "/ofertas" },
    { label: "Contato", to: "/contato" },
  ];

  return (
    <>
      {/* TopBar */}
      {isEnabled("topbar_enabled") && (
        <div className="bg-accent text-accent-foreground text-center py-2 text-xs font-sans font-bold uppercase tracking-wider">
          <Zap className="w-3 h-3 inline mr-1" />
          {getSetting("topbar_text", "🚚 Frete grátis para compras acima de R$ 199")}
        </div>
      )}

      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-primary/95 backdrop-blur-xl shadow-lg border-b border-primary-foreground/10"
            : "bg-primary border-b border-primary-foreground/10"
        }`}
      >
        <div className="container flex items-center justify-between h-16 md:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center glow-orange group-hover:glow-orange-lg transition-all duration-300">
              <span className="text-accent-foreground font-display font-bold text-lg">🐆</span>
            </div>
            <span className="font-display text-lg md:text-xl font-bold tracking-tight text-primary-foreground uppercase">
              {getSetting("store_name", "SPORT STORE")}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-sans text-xs font-bold uppercase tracking-wider transition-colors relative py-1 ${
                  location.pathname === link.to
                    ? "text-accent"
                    : "text-primary-foreground/60 hover:text-primary-foreground"
                }`}
              >
                {link.label}
                {location.pathname === link.to && (
                  <motion.div layoutId="nav-underline" className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-accent rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/busca">
              <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 hidden sm:flex text-primary-foreground/60 hover:text-accent hover:bg-primary-foreground/10">
                <Search className="w-[18px] h-[18px]" />
              </Button>
            </Link>
            {isEnabled("wishlist_enabled") && (
              <Link to="/conta/favoritos">
                <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 hidden sm:flex text-primary-foreground/60 hover:text-accent hover:bg-primary-foreground/10">
                  <Heart className="w-[18px] h-[18px]" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl w-10 h-10 relative text-primary-foreground/60 hover:text-accent hover:bg-primary-foreground/10"
              onClick={() => cartCtx.setIsOpen(true)}
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              {cartCtx.itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center font-sans min-w-[18px] h-[18px] px-1 animate-glow-pulse">
                  {cartCtx.itemCount}
                </span>
              )}
            </Button>

            {user ? (
              <Link to={isAdmin ? "/admin" : "/conta"}>
                <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 text-primary-foreground/60 hover:text-accent hover:bg-primary-foreground/10">
                  <User className="w-[18px] h-[18px]" />
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="rounded-xl font-sans text-xs h-9 px-5 hidden sm:flex bg-accent text-accent-foreground hover:bg-accent/90 font-bold uppercase tracking-wider shine">
                  Entrar
                </Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl w-10 h-10 lg:hidden text-primary-foreground/60 hover:text-accent hover:bg-primary-foreground/10"
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
              transition={{ duration: 0.25 }}
              className="lg:hidden overflow-hidden border-t border-primary-foreground/10"
            >
              <nav className="container py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`py-3 px-4 rounded-xl font-sans text-sm font-bold uppercase tracking-wider transition-colors ${
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
                    <Button className="w-full rounded-xl font-sans h-12 shine bg-accent text-accent-foreground font-bold uppercase tracking-wider">
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
