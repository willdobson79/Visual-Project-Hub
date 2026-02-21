'use client';

import { useState, useCallback, useEffect, use } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    Node,
    Edge,
    NodeChange,
    EdgeChange,
    Connection,
    addEdge,
    Panel,
    useReactFlow,
    ReactFlowProvider,
    SelectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import VisualCard from '@/components/canvas/VisualCard';
import CardSidebar from '@/components/board/CardSidebar';
import EdgeSidebar from '@/components/board/EdgeSidebar';
import AlignmentToolbar from '@/components/board/AlignmentToolbar';
import BoardControls from '@/components/board/BoardControls';
import { ChevronLeft, Share2, Plus, MousePointer2, Maximize2, Lock, LayoutGrid, LayoutList, BoxSelect } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import SyncIndicator from '@/components/global/SyncIndicator';
import { useSearchParams } from 'next/navigation';
import BoardListView from '@/components/board/BoardListView';
import { cn } from '@/lib/utils';
const nodeTypes = {
    visualCard: VisualCard,
};

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <ReactFlowProvider>
            <BoardContent params={params} />
        </ReactFlowProvider>
    );
}

function BoardContent({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const boardId = params.id || 'board-default';
    const searchParams = useSearchParams();
    const { setCenter } = useReactFlow();

    // Live Queries from Dexie
    const dbBoard = useLiveQuery(() => db.boards.get(boardId), [boardId]);
    const dbWorkspace = useLiveQuery(() => {
        if (!dbBoard?.workspaceId) return undefined;
        return db.workspaces.get(dbBoard.workspaceId);
    }, [dbBoard]);

    const dbNodes = useLiveQuery(() => db.cards.where('boardId').equals(boardId).toArray(), [boardId]);
    const dbEdges = useLiveQuery(() => db.connections.where('boardId').equals(boardId).toArray(), [boardId]);

    useEffect(() => {
        const cardId = searchParams.get('card');
        if (cardId && dbNodes) {
            const card = dbNodes.find(n => n.id === cardId);
            if (card) {
                setCenter(card.position.x + 125, card.position.y + 75, { zoom: 1.2, duration: 1000 });
            }
        }
    }, [searchParams, dbNodes, setCenter]);

    const [selectedCard, setSelectedCard] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // View Mode State
    const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');

    // Tool State
    const [activeTool, setActiveTool] = useState<'pointer' | 'lasso'>('pointer');

    const [selectedEdge, setSelectedEdge] = useState<any>(null);
    const [isEdgeSidebarOpen, setIsEdgeSidebarOpen] = useState(false);

    const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

    const onSelectionChange = useCallback((params: { nodes: Node[]; edges: Edge[] }) => {
        setSelectedNodes(params.nodes);
    }, []);

    const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
        setIsEdgeSidebarOpen(false);
        setSelectedCard(node);
        setIsSidebarOpen(true);
    }, []);

    const onEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
        setIsSidebarOpen(false);
        setSelectedEdge(edge);
        setIsEdgeSidebarOpen(true);
    }, []);

    // Sync React Flow nodes with DB
    const nodes = (dbNodes || []).map(card => ({
        id: card.id,
        type: 'visualCard',
        position: card.position,
        data: {
            title: card.title,
            description: card.description,
            status: card.status,
            priority: card.priority,
            colour: card.colour,
            content: card.content,
            projectRef: card.projectRef
        },
    }));

    const edges = (dbEdges || []).map(conn => ({
        id: conn.id,
        source: conn.fromCardId,
        target: conn.toCardId,
        type: conn.type || 'smoothstep',
        animated: conn.animated || false,
        label: conn.label || '',
        data: {
            style: conn.style || 'solid',
            colour: conn.colour || '#3b82f6',
            strokeWidth: conn.strokeWidth || 2,
            markerStart: conn.markerStart || 'none',
            markerEnd: conn.markerEnd || 'arrow'
        },
        markerStart: conn.markerStart && conn.markerStart !== 'none' ? { type: conn.markerStart as any, color: conn.colour || '#3b82f6' } : undefined,
        markerEnd: conn.markerEnd && conn.markerEnd !== 'none' ? { type: conn.markerEnd as any, color: conn.colour || '#3b82f6' } : { type: 'arrow' as any, color: conn.colour || '#3b82f6' },
        style: {
            stroke: conn.colour || '#3b82f6',
            strokeWidth: conn.strokeWidth || 2,
            strokeDasharray: conn.style === 'dashed' ? '5,5' : conn.style === 'dotted' ? '2,2' : 'none'
        }
    }));

    const onNodesChange = useCallback(
        async (changes: NodeChange[]) => {
            for (const change of changes) {
                if (change.type === 'position' && change.position) {
                    await db.cards.update(change.id, { position: change.position });
                    await db.addToSyncQueue('cards', change.id, 'update');
                }
            }
        },
        []
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            // React Flow internal state is handled by dbNodes/dbEdges sync
        },
        []
    );

    const onEdgesDelete = useCallback(
        async (deletedEdges: Edge[]) => {
            for (const edge of deletedEdges) {
                await db.connections.delete(edge.id);
                await db.addToSyncQueue('connections', edge.id, 'delete');
            }
        },
        []
    );

    const onConnect = useCallback(
        async (params: Connection) => {
            const id = `edge-${Date.now()}`;
            await db.connections.add({
                id,
                boardId,
                fromCardId: params.source!,
                toCardId: params.target!,
                type: 'smoothstep',
                style: 'solid',
                colour: '#3b82f6',
                animated: false,
                strokeWidth: 2,
                updatedAt: new Date()
            });
            await db.addToSyncQueue('connections', id, 'create');
        },
        [boardId]
    );

    const handleAddCard = async () => {
        const id = `card-${Date.now()}`;

        // Generate Ref: YY-MM-DD-HH-mm-ss
        const now = new Date();
        const displayRef = `${String(now.getFullYear()).slice(-2)}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;

        // Fetch auto-add tags for this board
        const autoTags = await db.getAutoTags(boardId);

        await db.cards.add({
            id,
            boardId,
            position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
            size: { width: 250, height: 150 },
            title: 'New Project Card',
            description: 'Edit this description...',
            status: 'not-started',
            priority: 'medium',
            colour: '#3b82f6',
            content: '',
            zIndex: 1,
            locked: false,
            tags: autoTags,
            projectRef: displayRef,
            updatedAt: new Date()
        });
        await db.addToSyncQueue('cards', id, 'create');
    };

    return (
        <div className="h-screen w-full bg-[#05080f] flex flex-col pt-0">
            <CardSidebar
                card={selectedCard}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <EdgeSidebar
                edge={selectedEdge}
                isOpen={isEdgeSidebarOpen}
                onClose={() => setIsEdgeSidebarOpen(false)}
            />

            <AlignmentToolbar
                selectedNodes={selectedNodes}
                onClearSelection={() => setSelectedNodes([])}
            />

            {/* Board Header */}
            <header className="h-16 border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between z-50">
                <div className="flex items-center gap-6">
                    <Link href="/" className="icon-box hover:bg-white/10 transition-colors text-slate-300">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                            <span>{dbWorkspace?.name || 'Workspace'}</span>
                            <span>/</span>
                        </div>
                        <h1 className="text-lg font-bold text-white leading-tight flex items-center gap-2">
                            {dbBoard?.name || 'Loading Board...'}
                            {dbBoard?.isLocked && <Lock size={12} className="text-accent-1 opacity-50" />}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => setViewMode('canvas')}
                            className={cn(
                                "p-1.5 rounded transition-all",
                                viewMode === 'canvas' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                            )}
                            title="Canvas View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-1.5 rounded transition-all",
                                viewMode === 'list' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                            )}
                            title="List View"
                        >
                            <LayoutList size={16} />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-white/5 mx-1" />

                    <SyncIndicator />
                    <div className="w-px h-6 bg-white/5 mx-1" />
                    <BoardControls board={dbBoard} />
                    <button
                        onClick={handleAddCard}
                        disabled={dbBoard?.isLocked}
                        className="btn-primary py-1.5 px-4 text-sm flex items-center gap-2 shadow-accent-1/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Plus size={16} /> New Card
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 relative overflow-hidden">
                {viewMode === 'canvas' ? (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onEdgesDelete={onEdgesDelete}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onEdgeClick={onEdgeClick}
                        onSelectionChange={onSelectionChange}
                        nodeTypes={nodeTypes as any}
                        nodesDraggable={!dbBoard?.isLocked && activeTool === 'pointer'}
                        nodesConnectable={!dbBoard?.isLocked}
                        elementsSelectable={true}
                        panOnDrag={activeTool === 'pointer'}
                        selectionOnDrag={activeTool === 'lasso'}
                        panOnScroll={true}
                        selectionMode={activeTool === 'lasso' ? SelectionMode.Partial : SelectionMode.Full}
                        colorMode="dark"
                        fitView
                    >
                        <Background color="#1e293b" gap={20} size={1} />
                        <Controls className="!bg-slate-900 !border-white/10 !rounded-lg !overflow-hidden translate-y-[-80px]" />

                        <Panel position="bottom-center" className="mb-8">
                            <div className="glass-panel p-2 flex items-center gap-1 shadow-2xl">
                                <button
                                    onClick={() => setActiveTool('pointer')}
                                    className={cn(
                                        "icon-box border-white/20 transition-all",
                                        activeTool === 'pointer' ? "bg-accent-1 text-white border-accent-1 shadow-lg shadow-accent-1/20" : "bg-slate-800 text-slate-400 hover:text-white"
                                    )}
                                    title="Pointer Tool"
                                >
                                    <MousePointer2 size={18} />
                                </button>
                                <button
                                    onClick={() => setActiveTool('lasso')}
                                    className={cn(
                                        "icon-box border-white/20 transition-all",
                                        activeTool === 'lasso' ? "bg-accent-1 text-white border-accent-1 shadow-lg shadow-accent-1/20" : "bg-slate-800 text-slate-400 hover:text-white"
                                    )}
                                    title="Lasso Selection"
                                >
                                    <BoxSelect size={18} />
                                </button>

                                <div className="w-px h-6 bg-white/10 mx-1" />

                                <button
                                    onClick={handleAddCard}
                                    disabled={dbBoard?.isLocked}
                                    className="icon-box bg-transparent hover:bg-white/5 border-none text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                                <button className="icon-box bg-transparent hover:bg-white/5 border-none text-slate-400 hover:text-white transition-colors"><Maximize2 size={18} /></button>
                            </div>
                        </Panel>
                    </ReactFlow>
                ) : (
                    <BoardListView
                        cards={nodes}
                        onCardClick={(card) => {
                            // If we click a card in list view, switch to canvas and focus it
                            setViewMode('canvas');
                            setTimeout(() => {
                                setCenter(card.position.x + 125, card.position.y + 75, { zoom: 1.2, duration: 1000 });
                                setSelectedCard(card);
                                setIsSidebarOpen(true);
                            }, 100);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
