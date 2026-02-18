import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, Search, Heart, User, Menu, X, ShoppingCart } from "lucide-react";
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
        <div className="bg-primary text-primary-foreground text-center py-2 text-xs sm:text-sm font-sans tracking-wide">
          {getSetting("topbar_text", "🚚 Frete grátis para compras acima de R$ 199")}
        </div>
      )}

      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/85 backdrop-blur-xl shadow-sm border-b"
            : "bg-background border-b"
        }`}
      >
        <div className="container flex items-center justify-between h-16 md:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg md:text-xl font-bold tracking-tight">
              {getSetting("store_name", "Premium Store")}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-sans text-sm font-medium transition-colors hover:text-accent ${
                  location.pathname === link.to ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/busca">
              <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 hidden sm:flex">
                <Search className="w-[18px] h-[18px]" />
              </Button>
            </Link>
            {isEnabled("wishlist_enabled") && (
              <Link to="/conta/favoritos">
                <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 hidden sm:flex">
                  <Heart className="w-[18px] h-[18px]" />
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 relative" onClick={() => cartCtx.setIsOpen(true)}>
              <ShoppingCart className="w-[18px] h-[18px]" />
              {cartCtx.itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center font-sans min-w-[18px] h-[18px] px-1">
                  {cartCtx.itemCount}
                </span>
              )}
            </Button>

            {user ? (
              <Link to={isAdmin ? "/admin" : "/conta"}>
                <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10">
                  <User className="w-[18px] h-[18px]" />
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="rounded-xl font-sans text-xs h-9 px-4 hidden sm:flex">
                  Entrar
                </Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl w-10 h-10 lg:hidden"
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
              className="lg:hidden overflow-hidden border-t"
            >
              <nav className="container py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`py-3 px-4 rounded-xl font-sans text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? "bg-muted text-accent"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {!user && (
                  <Link to="/auth" className="mt-2">
                    <Button className="w-full rounded-xl font-sans h-11 shine">Entrar / Cadastrar</Button>
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
