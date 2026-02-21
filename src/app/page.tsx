'use client';

import { motion } from 'framer-motion';
import {
  Briefcase,
  Home,
  Music,
  Plus,
  LayoutDashboard,
  Settings,
  ChevronRight,
  TrendingUp,
  Box,
  Clock,
  Trash2,
  Edit2,
  Folder,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import NewBoardModal from '@/components/dashboard/NewBoardModal';
import NewWorkspaceModal from '@/components/dashboard/NewWorkspaceModal';
import GlobalStats from '@/components/dashboard/GlobalStats';
import HistoryPanel from '@/components/dashboard/HistoryPanel';
import SyncIndicator from '@/components/global/SyncIndicator';

export default function Dashboard() {
  const router = useRouter();

  // Real Data from Dexie
  const tabs = useLiveQuery(() => db.tabs.orderBy('sortOrder').toArray());
  const workspaces = useLiveQuery(() => db.workspaces.orderBy('sortOrder').toArray());
  const boards = useLiveQuery(() => db.boards.toArray());
  const cardCount = useLiveQuery(() => db.cards.count());
  const pendingTasks = useLiveQuery(() => db.cards.where('status').notEqual('complete').count());
  const completedTasks = useLiveQuery(() => db.cards.where('status').equals('complete').count());
  const activeBoardsCount = useLiveQuery(() => db.boards.count());

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Auto-Initialisation
  useEffect(() => {
    async function init() {
      const tabCount = await db.tabs.count();
      if (tabCount === 0) {
        const tabId = 'tab-master';
        await db.tabs.add({
          id: tabId,
          userId: 'user-1',
          name: 'Master',
          sortOrder: 0,
          updatedAt: new Date()
        });
        await db.addToSyncQueue('tabs', tabId, 'create');
      }

      const wsCount = await db.workspaces.count();
      if (wsCount === 0) {
        const wsId = 'ws-default';
        const boardId = 'board-default';

        await db.workspaces.add({
          id: wsId,
          tabId: 'tab-master',
          userId: 'user-1',
          name: 'My Workspace',
          colour: 'text-accent-3',
          icon: 'Briefcase',
          sortOrder: 0,
          updatedAt: new Date()
        });
        await db.addToSyncQueue('workspaces', wsId, 'create');

        await db.boards.add({
          id: boardId,
          workspaceId: wsId,
          userId: 'user-1',
          name: 'Main Board',
          settings: {},
          updatedAt: new Date()
        });
        await db.addToSyncQueue('boards', boardId, 'create');
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (tabs && tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const filteredWorkspaces = workspaces?.filter((ws) => ws.tabId === activeTab) || [];

  useEffect(() => {
    if (filteredWorkspaces.length > 0 && !filteredWorkspaces.find(ws => ws.id === activeWorkspace)) {
      setActiveWorkspace(filteredWorkspaces[0].id);
    } else if (filteredWorkspaces.length === 0) {
      setActiveWorkspace(null);
    }
  }, [filteredWorkspaces, activeWorkspace]);

  const recentBoards = boards || [];

  const handleCreateTab = async () => {
    const name = prompt('Enter a name for the new Tab (e.g. Finance, Travel, Work):');
    if (!name?.trim()) return;

    const id = `tab-${Date.now()}`;
    await db.tabs.add({
      id,
      userId: 'user-1',
      name: name.trim(),
      sortOrder: (await db.tabs.count()) + 1,
      updatedAt: new Date()
    });
    await db.addToSyncQueue('tabs', id, 'create');
    setActiveTab(id);
  };

  const handleDeleteBoard = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this board and all its cards?')) {
      await db.boards.delete(id);
      await db.addToSyncQueue('boards', id, 'delete');

      // Also delete cards
      const boardCards = await db.cards.where('boardId').equals(id).toArray();
      for (const card of boardCards) {
        await db.cards.delete(card.id);
        await db.addToSyncQueue('cards', card.id, 'delete');
      }
    }
  };

  const handleDeleteWorkspace = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this workspace? All associated boards and cards will be permanently removed.')) {
      // Delete workspace
      await db.workspaces.delete(id);
      await db.addToSyncQueue('workspaces', id, 'delete');

      // Delete associated boards
      const wsBoards = await db.boards.where('workspaceId').equals(id).toArray();
      for (const board of wsBoards) {
        await db.boards.delete(board.id);
        await db.addToSyncQueue('boards', board.id, 'delete');

        // Delete cards for each board
        const boardCards = await db.cards.where('boardId').equals(board.id).toArray();
        for (const card of boardCards) {
          await db.cards.delete(card.id);
          await db.addToSyncQueue('cards', card.id, 'delete');
        }
      }

      if (activeWorkspace === id) {
        setActiveWorkspace(workspaces?.[0]?.id || null);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950/40 border-r border-white/5 p-6 flex flex-col gap-6 hidden lg:flex">
        {/* Tabs Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Folder size={12} /> Categories / Tabs</h3>
            <button onClick={handleCreateTab} className="text-slate-500 hover:text-accent-1 transition-colors"><Plus size={14} /></button>
          </div>
          <div className="flex flex-col gap-2 pb-6 border-b border-white/5">
            {(tabs || []).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-between group",
                  activeTab === tab.id ? "bg-white/10 text-white shadow-md" : "text-slate-400 hover:bg-white/5"
                )}
              >
                {tab.name}
                {activeTab === tab.id && <ChevronRight size={14} className="text-accent-1 opacity-50" />}
              </button>
            ))}
          </div>
        </div>

        {/* Workspaces Section */}
        <div className="flex-1 overflow-y-auto pr-2 pb-8">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Workspaces</h3>
          <div className="space-y-2">
            {filteredWorkspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => setActiveWorkspace(ws.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                  activeWorkspace === ws.id
                    ? "bg-slate-800/50 border border-white/10 text-white shadow-xl"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-white/5",
                    activeWorkspace === ws.id && ws.colour
                  )}>
                    <Briefcase size={16} />
                  </div>
                  <span className="font-semibold text-sm">{ws.name}</span>
                </div>
                {/* Delete button only visible if there are workspaces other than this one, OR keeping it simple and just letting users delete anything */}
                <button
                  onClick={(e) => handleDeleteWorkspace(e, ws.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            ))}
            <button
              onClick={() => setIsNewWorkspaceModalOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:text-accent-1 transition-all border border-dashed border-white/10 mt-4"
            >
              <Plus size={18} />
              <span className="font-medium text-sm">New Workspace</span>
            </button>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <div className="pb-3 border-b border-white/5 mb-2">
            <SyncIndicator />
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-white/5 transition-all text-left"
          >
            <History size={18} />
            <span className="font-medium text-sm">Change History</span>
          </button>
          <button
            onClick={() => setIsStatsOpen(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-white/5 transition-all text-left"
          >
            <LayoutDashboard size={18} />
            <span className="font-medium text-sm">Global Stats</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-white/5 transition-all text-left"
          >
            <Settings size={18} />
            <span className="font-medium text-sm">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 1.25, filter: 'blur(12px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0)' }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Welcome back, <span className="highlighted">Will!</span>
            </h1>
            <p className="text-large max-w-2xl">
              You have <span className="text-white">{(pendingTasks || 0)} pending tasks</span> across <span className="text-white">{(activeBoardsCount || 0)} active boards</span>. Ready to dive back in?
            </p>
          </motion.div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Cards', value: cardCount?.toString() || '0', icon: <Box className="text-accent-3" />, trend: 'Live from DB' },
            {
              label: 'Completion',
              value: cardCount ? `${Math.round(((completedTasks || 0) / cardCount) * 100)}%` : '0%',
              icon: <TrendingUp className="text-accent-2" />,
              trend: `Done: ${completedTasks || 0} / ${cardCount || 0}`
            },
            { label: 'Cloud Status', value: 'Ready', icon: <Clock className="text-accent-1" />, trend: 'PostgreSQL Active' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-card p-6 flex items-center gap-6"
            >
              <div className="icon-box w-14 h-14 text-2xl">
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.trend}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Boards */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Recent Boards</h2>
            <button className="text-sm font-semibold text-accent-3 hover:text-accent-3/80 transition-colors flex items-center gap-1 group">
              View all <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {(recentBoards || []).filter((b: any) => activeWorkspace ? b.workspaceId === activeWorkspace : true).map((board: any, i: number) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={() => router.push(`/board/${board.id}`)}
                className="glass-panel overflow-hidden cursor-pointer group"
              >
                <div className="h-40 bg-slate-900 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10" />
                  <div className="absolute inset-0 bg-slate-800 flex items-center justify-center opacity-50">
                    <LayoutDashboard size={48} className="text-slate-700" />
                  </div>
                  <div className="absolute top-4 left-4 z-20">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-accent-1/20 border border-accent-1/30 text-accent-1 rounded">
                      Workspace
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteBoard(e, board.id)}
                    className="absolute top-4 right-4 z-30 w-8 h-8 rounded-lg bg-slate-950/80 border border-white/10 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent-3 transition-colors">{board.name}</h3>
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={12} />
                      <span>{new Date(board.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 border border-white/10 rounded-full text-slate-300">
                      Active
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={() => setIsNewBoardModalOpen(true)}
              className="glass-panel border-dashed border-2 border-white/5 flex flex-col items-center justify-center p-8 text-slate-500 hover:text-white hover:border-accent-1/50 transition-all gap-4 group"
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <span className="font-bold uppercase tracking-widest text-sm">Create New Board</span>
            </motion.button>
          </div>
        </div>

        {activeWorkspace && (
          <NewBoardModal
            isOpen={isNewBoardModalOpen}
            onClose={() => setIsNewBoardModalOpen(false)}
            workspaceId={activeWorkspace}
          />
        )}
        <NewWorkspaceModal
          isOpen={isNewWorkspaceModalOpen}
          onClose={() => setIsNewWorkspaceModalOpen(false)}
          tabId={activeTab}
        />
        <GlobalStats
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
        />
        <HistoryPanel
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
        />
      </main>
    </div>
  );
}
