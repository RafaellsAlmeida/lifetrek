// @ts-nocheck
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    LayoutDashboard,
    Images,
    FileText,
    CheckCircle,
    BookOpen,
    Upload,
    LogOut,
    Camera,
    Database,
    BarChart3,
    Target,
    Crown,
    ChevronDown,
    Building2,
    Briefcase,
    Search,
    MessageSquare,
    Clapperboard,
    Eye,
    X,
    Zap,
    TrendingUp,
    Inbox,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserType {
    id: string;
    email?: string;
    display_name?: string;
    permission_level?: string;
}

interface NavItem {
    path: string;
    label: string;
    icon: LucideIcon;
    requiresSuperAdmin?: boolean;
}

interface NavGroup {
    label: string;
    icon: LucideIcon;
    items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

const navStructure: NavEntry[] = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/inbox", label: "Inbox", icon: Inbox },
    {
        label: "Conteúdo",
        icon: FileText,
        items: [
            { path: "/admin/orchestrator", label: "Orchestrator", icon: MessageSquare },
            { path: "/admin/content-approval", label: "Aprovação", icon: CheckCircle },
            { path: "/admin/content-calendar", label: "Calendário", icon: Target },
            { path: "/admin/video-studio", label: "Video Studio", icon: Clapperboard },
        ]
    },
    {
        label: "Empresa",
        icon: Building2,
        items: [
            { path: "/admin/gallery", label: "Galeria", icon: Images },
            { path: "/admin/one-pager", label: "One Pager", icon: FileText },
            { path: "/admin/knowledge-base", label: "Knowledge", icon: BookOpen, requiresSuperAdmin: true },
            { path: "/admin/product-assets", label: "Assets", icon: Upload, requiresSuperAdmin: true },
            { path: "/admin/environment-assets", label: "Ambiente", icon: Camera, requiresSuperAdmin: true },
        ]
    },
    {
        label: "Gestão",
        icon: Briefcase,
        items: [
            { path: "/admin/campaigns", label: "Campanhas", icon: Target, requiresSuperAdmin: true },
            { path: "/admin/rejection-analytics", label: "Rejeições", icon: BarChart3, requiresSuperAdmin: true },
            { path: "/admin/roi-simulation", label: "Simulação ROI (Owner)", icon: Zap, requiresSuperAdmin: true },
            { path: "/admin/analytics", label: "LinkedIn Analytics", icon: TrendingUp, requiresSuperAdmin: true },
        ]
    },
    { path: "/admin/leads", label: "Leads", icon: Database },
];

export function AdminHeader() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isSuperAdmin, displayName, userEmail, isLoading } = useAdminPermissions();
    const {
        isImpersonating,
        impersonatedUser,
        availableUsers,
        startImpersonation,
        stopImpersonation,
        getEffectivePermissionLevel,
    } = useImpersonation();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success("Logout realizado com sucesso");
        navigate("/admin/login");
    };

    // Use effective permission level for filtering nav items
    const effectiveIsSuperAdmin = isImpersonating
        ? getEffectivePermissionLevel() === "super_admin"
        : isSuperAdmin;

    const filterItems = (items: NavItem[]) => {
        return items.filter(item => {
            if (item.requiresSuperAdmin && !effectiveIsSuperAdmin) {
                return false;
            }
            return true;
        });
    };

    const effectiveUserName = isImpersonating
        ? impersonatedUser?.display_name || impersonatedUser?.email?.split('@')[0]
        : displayName || userEmail?.split('@')[0] || 'Admin';

    const handleImpersonationChange = (value: string) => {
        if (value === "stop") {
            stopImpersonation();
            toast.info("Visualização normal restaurada");
            return;
        }

        const user = availableUsers.find((u: UserType) => u.id === value);
        if (user) {
            startImpersonation(user);
            toast.info(`Visualizando como: ${user.display_name || user.email}`);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
            {/* Impersonation Banner */}
            {isImpersonating && (
                <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-center gap-2">
                    <Eye className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        Visualizando como: {impersonatedUser?.display_name || impersonatedUser?.email}
                    </span>
                    <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600">
                        {impersonatedUser?.permission_level}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            stopImpersonation();
                            toast.info("Visualização normal restaurada");
                        }}
                        className="h-6 px-2 text-amber-700 hover:text-amber-900 hover:bg-amber-500/20"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Parar
                    </Button>
                </div>
            )}

            <div className="flex h-14 items-center px-4 gap-4">
                {/* Logo */}
                <Link to="/admin" className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">LT</span>
                    </div>
                    <span className="font-semibold text-sm hidden sm:inline">Admin</span>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
                    {navStructure.map((entry, index) => {
                        // Check if it's a group
                        if ('items' in entry) {
                            const filteredItems = filterItems(entry.items);
                            if (filteredItems.length === 0) return null;

                            const isActive = filteredItems.some(item => location.pathname === item.path);
                            const Icon = entry.icon;

                            return (
                                <DropdownMenu key={index}>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "gap-1.5 h-9",
                                                isActive && "bg-accent text-accent-foreground"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span className="hidden md:inline">{entry.label}</span>
                                            <ChevronDown className="h-3 w-3 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuLabel>{entry.label}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {filteredItems.map((item) => {
                                            const ItemIcon = item.icon;
                                            return (
                                                <DropdownMenuItem key={item.path} asChild>
                                                    <Link to={item.path} className="gap-2 cursor-pointer w-full">
                                                        <ItemIcon className="h-4 w-4" />
                                                        {item.label}
                                                    </Link>
                                                </DropdownMenuItem>
                                            );
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            );
                        }

                        // Single item
                        const item = entry as NavItem;
                        if (item.requiresSuperAdmin && !effectiveIsSuperAdmin) return null;

                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden md:inline">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User info, Impersonation Dropdown & Role badge */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Impersonation Dropdown - Only for Super Admins */}
                    {!isLoading && isSuperAdmin && availableUsers.length > 1 && (
                        <Select
                            value={isImpersonating ? impersonatedUser?.id : ""}
                            onValueChange={handleImpersonationChange}
                        >
                            <SelectTrigger className="w-[160px] h-8 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <Eye className="h-3 w-3" />
                                    <SelectValue placeholder="Ver como..." />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {isImpersonating && (
                                    <SelectItem value="stop" className="text-amber-600">
                                        ← Voltar à minha visão
                                    </SelectItem>
                                )}
                                {availableUsers.map((user: UserType) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{user.display_name || user.email?.split('@')[0]}</span>
                                            {user.permission_level === "super_admin" && (
                                                <Crown className="h-3 w-3 text-amber-500" />
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {!isLoading && (
                        <>
                            <span className="text-sm text-muted-foreground hidden lg:inline">
                                {effectiveUserName}
                            </span>
                            {effectiveIsSuperAdmin && (
                                <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-600">
                                    <Crown className="h-3 w-3" />
                                    <span className="hidden sm:inline">Super</span>
                                </Badge>
                            )}
                        </>
                    )}

                    {/* Logout */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-1.5" />
                        <span className="hidden sm:inline">Sair</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
