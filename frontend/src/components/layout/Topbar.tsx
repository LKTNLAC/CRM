import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Search, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { useUnreadCount } from "@/features/notifications/services";


export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const refresh = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();
  
  const initials = user?.full_name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  async function handleLogout() {
    try {
      if (refresh) await authService.logout(refresh);
    } catch {
      // ignore
    } finally {
      clear();
      navigate("/login");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4 lg:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
            <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <button
        className="hidden md:flex items-center gap-2 h-8 w-72 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
        onClick={() => {/* TODO command palette */}}
      >
        <Search className="h-3.5 w-3.5" />
        <span>Tìm kiếm...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          ⌘K
        </kbd>
      </button>

      <div className="flex-1" />
      <ThemeToggle />

      {/* Notifications */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => navigate("/notifications")}
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start leading-none">
              <span className="text-sm font-medium">{user?.full_name ?? "User"}</span>
              <span className="text-[11px] text-muted-foreground">
                {user?.roles?.[0] ?? ""}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user?.full_name}</span>
              <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" /> Hồ sơ
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}