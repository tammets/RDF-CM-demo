import { Link, useLocation, Outlet } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  FolderTree,
  BookMarked,
  Target,
  Download,
  Search,
  LogOut,
  Network,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Subjects", url: "/subjects", icon: BookOpen },
  { title: "Topics", url: "/topics", icon: BookMarked },
  { title: "Learning Outcomes", url: "/outcomes", icon: Target },
  { title: "Browse Curriculum", url: "/browse", icon: FolderTree },
  { title: "Search", url: "/search", icon: Search },
  { title: "Relations", url: "/relations", icon: Network },
];

const dataManagement = [{ title: "Export & API", url: "/export", icon: Download }];

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState<{ full_name?: string; role?: string } | null>(null);

  useEffect(() => {
    // Temporary static user until backend/auth is added
    setUser({ full_name: "Priit Tammets", role: "Admin" });
  }, []);

  const handleLogout = () => {
    console.log("Logged out");
    setUser(null);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">EduFlex RDF</h2>
              <p className="text-xs text-slate-500">Curriculum Manager</p>
            </div>
          </div>
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
              Curriculum
            </p>
            {navigationItems.map((item) => {
              const active = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                    active
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
              Data Management
            </p>
            {dataManagement.map((item) => {
              const active = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                    active
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer (User info) */}
        <div className="border-t border-slate-200 p-4">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.full_name?.[0]?.toUpperCase() || "K"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {user.full_name || "User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.role || "Editor"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-slate-600 hover:text-slate-900"
                onClick={handleLogout}
              >
                <LogOut className="w-3 h-3 mr-2" />
                Log Out
              </Button>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-full">
        <Outlet />
      </main>
    </div>
  );
}
