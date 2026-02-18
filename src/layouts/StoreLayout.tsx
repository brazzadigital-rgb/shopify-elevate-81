import { Outlet } from "react-router-dom";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { CartDrawer } from "@/components/store/CartDrawer";

export default function StoreLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
