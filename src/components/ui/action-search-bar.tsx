import { useState, useEffect } from "react";
import { Input } from "./input";
import { motion, AnimatePresence } from "motion/react";
import {
    Search,
    Send,
    BarChart2,
    Database,
    Inbox,
    Kanban,
    CheckSquare,
    Flame,
    BookOpen,
    FileText,
    Users,
    Settings,
    Clock,
    LayoutDashboard
} from "lucide-react";
import { useAppStore } from "../../store";

function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

export interface Action {
    id: string;
    label: string;
    icon: React.ReactNode;
    description?: string;
    short?: string;
    end?: string;
    viewId?: any;
}

interface SearchResult {
    actions: Action[];
}

export function ActionSearchBar() {
    const { setCurrentView } = useAppStore();

    const allActions: Action[] = [
        { id: "overview", label: "Go to Overview", icon: <LayoutDashboard className="h-4 w-4 text-blue-500" />, description: "Dashboard", short: "1", end: "Page", viewId: "overview" },
        { id: "analytics", label: "View Analytics", icon: <BarChart2 className="h-4 w-4 text-purple-500" />, description: "Metricool data", short: "2", end: "Page", viewId: "analytics" },
        { id: "inbox", label: "Open Inbox", icon: <Inbox className="h-4 w-4 text-orange-500" />, description: "Video sources", short: "3", end: "Page", viewId: "inbox" },
        { id: "database", label: "Content Database", icon: <Database className="h-4 w-4 text-green-500" />, description: "All assets", short: "4", end: "Page", viewId: "database" },
        { id: "workflow", label: "Workflow Board", icon: <Kanban className="h-4 w-4 text-yellow-500" />, description: "Kanban", short: "5", end: "Page", viewId: "workflow" },
        { id: "review", label: "Clip Review", icon: <CheckSquare className="h-4 w-4 text-red-500" />, description: "Review clips", short: "6", end: "Page", viewId: "review" },
        { id: "aiCoach", label: "AI Coach", icon: <Flame className="h-4 w-4 text-orange-500" />, description: "Claude Assistant", short: "7", end: "Page", viewId: "aiCoach" },
        { id: "knowledge", label: "Knowledge base", icon: <BookOpen className="h-4 w-4 text-indigo-500" />, description: "SOPs", short: "8", end: "Page", viewId: "knowledge" },
        { id: "scripts", label: "Scripts", icon: <FileText className="h-4 w-4 text-pink-500" />, description: "Writing scripts", short: "9", end: "Page", viewId: "scripts" },
        { id: "team", label: "Team Space", icon: <Users className="h-4 w-4 text-teal-500" />, description: "Team members", short: "T", end: "Page", viewId: "team" },
        { id: "changelog", label: "Changelog", icon: <Clock className="h-4 w-4 text-gray-500" />, description: "Updates", short: "C", end: "Page", viewId: "changelog" },
        { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4 text-gray-400" />, description: "Preferences", short: "S", end: "Page", viewId: "settings" },
    ];

    const [query, setQuery] = useState("");
    const [result, setResult] = useState<SearchResult | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const debouncedQuery = useDebounce(query, 200);

    useEffect(() => {
        if (!isFocused) {
            setResult(null);
            return;
        }

        if (!debouncedQuery) {
            setResult({ actions: allActions });
            return;
        }

        const normalizedQuery = debouncedQuery.toLowerCase().trim();
        const filteredActions = allActions.filter((action) => {
            const searchableText = action.label.toLowerCase() + " " + (action.description?.toLowerCase() || "");
            return searchableText.includes(normalizedQuery);
        });

        setResult({ actions: filteredActions });
    }, [debouncedQuery, isFocused]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setIsTyping(true);
    };

    const container = {
        hidden: { opacity: 0, height: 0 },
        show: {
            opacity: 1,
            height: "auto",
            transition: {
                height: { duration: 0.4 },
                staggerChildren: 0.1,
            },
        },
        exit: { opacity: 0, height: 0, transition: { height: { duration: 0.3 }, opacity: { duration: 0.2 } } },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleSelectAction = (action: Action) => {
        if (action.viewId) {
            setCurrentView(action.viewId);
        }
        setQuery("");
        setIsFocused(false);
    };

    return (
        <div className="w-full max-w-xl mx-auto z-[100] relative">
            <div className="relative flex flex-col justify-start items-center">
                <div className="w-full max-w-sm sticky top-0 bg-transparent z-10 pt-2 pb-1">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search commands (⌘K)"
                            value={query}
                            onChange={handleInputChange}
                            onFocus={handleFocus}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            className="bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] pl-3 pr-9 py-1.5 h-9 text-sm rounded-lg focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-[var(--text-main)] transition-shadow"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
                            <AnimatePresence mode="popLayout">
                                {query.length > 0 ? (
                                    <motion.div key="send" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        <Send className="w-4 h-4 text-[var(--text-muted)]" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="search" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        <Search className="w-4 h-4 text-[var(--text-muted)]" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-sm absolute top-[100%] mt-1 left-1/2 -translate-x-1/2 shadow-xl rounded-md bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                    <AnimatePresence>
                        {isFocused && result && (
                            <motion.div className="w-full overflow-hidden" variants={container} initial="hidden" animate="show" exit="exit">
                                <motion.ul className="max-h-[300px] overflow-y-auto">
                                    {result.actions.map((action) => (
                                        <motion.li
                                            key={action.id}
                                            className="px-3 py-2.5 flex items-center justify-between hover:bg-[var(--hover-bg)] cursor-pointer"
                                            variants={item}
                                            layout
                                            onClick={() => handleSelectAction(action)}
                                        >
                                            <div className="flex items-center gap-2 justify-between min-w-0 flex-1 pr-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-gray-500 shrink-0">{action.icon}</span>
                                                    <span className="text-sm font-medium text-[var(--text-main)] truncate">{action.label}</span>
                                                    <span className="text-xs text-[var(--text-muted)] truncate hidden sm:inline-block">{action.description}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-[var(--text-muted)] px-1.5 py-0.5 rounded-md bg-[var(--bg)] border border-[var(--border)]">{action.short}</span>
                                            </div>
                                        </motion.li>
                                    ))}
                                </motion.ul>
                                <div className="mt-1 px-3 py-2 border-t border-[var(--border)] bg-[var(--bg)]/50">
                                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                        <span>Press ⌘K to open commands</span>
                                        <span>ESC to cancel</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

