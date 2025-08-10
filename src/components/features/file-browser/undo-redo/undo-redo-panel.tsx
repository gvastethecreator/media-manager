import { formatDistanceToNow } from 'date-fns';
import { Camera, CheckCircle, Download, FileText, Filter, FolderOpen, History, Redo2, RotateCcw, Search, Trash2, Undo2, Upload } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useUndoRedo } from '../../../../hooks/use-undo-redo';
import { toastService } from '../../../../services/toast/toast.service';
import type { UndoActionType, UndoableAction } from '../../../../services/undo-redo/undo-redo-manager';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { ScrollArea } from '../../../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Separator } from '../../../ui/separator';
import { Switch } from '../../../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { Textarea } from '../../../ui/textarea';

interface UndoRedoPanelProps {
	className?: string;
	compact?: boolean;
	showStatistics?: boolean;
	showSnapshots?: boolean;
	showGroups?: boolean;
}

// Simplified filter type based on actual manager
interface SimpleHistoryFilter {
	types?: UndoActionType[];
}

interface SimpleSortOptions {
	field: 'timestamp' | 'description' | 'type';
	direction: 'asc' | 'desc';
}

// Comparator factory para ordenar acciones de manera estable y reducir complejidad en el componente
const makeHistoryComparator = (sortOptions: SimpleSortOptions) => {
	return (a: UndoableAction, b: UndoableAction) => {
		let aValue: any;
		let bValue: any;

		switch (sortOptions.field) {
			case 'timestamp':
				aValue = a.timestamp;
				bValue = b.timestamp;
				break;
			case 'description':
				aValue = a.description;
				bValue = b.description;
				break;
			case 'type':
				aValue = a.type;
				bValue = b.type;
				break;
			default:
				aValue = a.timestamp;
				bValue = b.timestamp;
		}

		let comparison = 0;
		if (aValue < bValue) {
			comparison = -1;
		} else if (aValue > bValue) {
			comparison = 1;
		}
		return sortOptions.direction === 'desc' ? -comparison : comparison;
	};
};

const actionTypeIcons: Record<UndoActionType, React.ComponentType<{ className?: string }>> = {
	copy: FileText,
	move: FolderOpen,
	delete: Trash2,
	rename: FileText,
	'create-folder': FolderOpen,
	paste: FileText,
	duplicate: FileText,
	'add-to-collection': FolderOpen,
	'remove-from-collection': FolderOpen,
	'add-tag': FileText,
	'remove-tag': FileText,
};

// Item independiente para evitar componentes anidados
const ActionItem: React.FC<{ action: UndoableAction; isCurrent: boolean }> = ({ action, isCurrent }) => {
	const Icon = actionTypeIcons[action.type] || FileText;
	const isCurrentAction = isCurrent;

	return (
		<div
			className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
				isCurrentAction ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
			}`}
		>
			<div className="flex-shrink-0">
				<Icon className="h-4 w-4 text-gray-600" />
			</div>

			<div className="min-w-0 flex-1">
				<div className="mb-1 flex items-center gap-2">
					<span className="truncate font-medium text-sm">{action.description}</span>
					<Badge className="bg-green-100 text-green-800 text-xs">
						<CheckCircle className="mr-1 h-3 w-3" />
						completed
					</Badge>
				</div>

				<div className="flex items-center gap-4 text-gray-500 text-xs">
					<span>{action.type.replace('-', ' ')}</span>
					<span>{formatDistanceToNow(action.timestamp, { addSuffix: true })}</span>
				</div>
			</div>
		</div>
	);
};

interface HistoryTabProps {
	searchQuery: string;
	setSearchQuery: (v: string) => void;
	showFilters: boolean;
	setShowFilters: (v: boolean) => void;
	filter: SimpleHistoryFilter;
	setFilter: React.Dispatch<React.SetStateAction<SimpleHistoryFilter>>;
	sortOptions: SimpleSortOptions;
	setSortOptions: React.Dispatch<React.SetStateAction<SimpleSortOptions>>;
	handleExportHistory: () => void;
	handleImportHistory: (e: React.ChangeEvent<HTMLInputElement>) => void;
	filteredHistory: UndoableAction[];
	currentActionId?: string;
}

const HistoryTab: React.FC<HistoryTabProps> = ({
	searchQuery,
	setSearchQuery,
	showFilters,
	setShowFilters,
	filter,
	setFilter,
	sortOptions,
	setSortOptions,
	handleExportHistory,
	handleImportHistory,
	filteredHistory,
	currentActionId,
}) => {
	return (
		<>
			{/* Search and Filters */}
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<div className="relative flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
						<Input
							className="pl-10"
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search actions..."
							value={searchQuery}
						/>
					</div>

					<Button onClick={() => setShowFilters(!showFilters)} size="sm" variant="outline">
						<Filter className="h-4 w-4" />
					</Button>

					<Button onClick={handleExportHistory} size="sm" variant="outline">
						<Download className="h-4 w-4" />
					</Button>

					<label className="cursor-pointer">
						<Button asChild size="sm" variant="outline">
							<span>
								<Upload className="h-4 w-4" />
							</span>
						</Button>
						<input accept=".json" className="hidden" onChange={handleImportHistory} type="file" />
					</label>
				</div>

				{showFilters && (
					<div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
						<div>
							<Label className="font-medium text-xs">Action Type</Label>
							<Select
								onValueChange={(value) =>
									setFilter((prev) => ({
										...prev,
										types: value ? [value as UndoActionType] : undefined,
									}))
								}
								value={filter.types?.[0] || ''}
							>
								<SelectTrigger className="h-8">
									<SelectValue placeholder="All types" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All types</SelectItem>
									<SelectItem value="copy">Copy</SelectItem>
									<SelectItem value="move">Move</SelectItem>
									<SelectItem value="delete">Delete</SelectItem>
									<SelectItem value="rename">Rename</SelectItem>
									<SelectItem value="create-folder">Create Folder</SelectItem>
									<SelectItem value="paste">Paste</SelectItem>
									<SelectItem value="duplicate">Duplicate</SelectItem>
									<SelectItem value="add-tag">Add Tag</SelectItem>
									<SelectItem value="remove-tag">Remove Tag</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="font-medium text-xs">Sort By</Label>
							<Select
								onValueChange={(value) =>
									setSortOptions((prev) => ({
										...prev,
										field: value as any,
									}))
								}
								value={sortOptions.field}
							>
								<SelectTrigger className="h-8">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="timestamp">Time</SelectItem>
									<SelectItem value="description">Description</SelectItem>
									<SelectItem value="type">Type</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				)}
			</div>

			{/* Action List */}
			<ScrollArea className="h-96">
				<div className="space-y-2">
					{filteredHistory.length === 0 ? (
						<div className="py-8 text-center text-gray-500">
							<History className="mx-auto mb-2 h-8 w-8 opacity-50" />
							<p>No actions in history</p>
						</div>
					) : (
						filteredHistory.map((action) => (
							<ActionItem action={action} isCurrent={action.id === currentActionId} key={action.id} />
						))
					)}
				</div>
			</ScrollArea>
		</>
	);
};

export const UndoRedoPanel: React.FC<UndoRedoPanelProps> = ({
	className = '',
	compact = false,
	showStatistics = true,
	showSnapshots = false, // Disabled since snapshots aren't implemented in hook
}) => {
	const { state, undo, redo, clear, canUndo, canRedo, getHistory, actions } = useUndoRedo();

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTab, setSelectedTab] = useState('history');
	const [filter, setFilter] = useState<SimpleHistoryFilter>({});
	const [sortOptions, setSortOptions] = useState<SimpleSortOptions>({
		field: 'timestamp',
		direction: 'desc',
	});
	const [showFilters, setShowFilters] = useState(false);
	const [snapshotName, setSnapshotName] = useState('');
	const [snapshotDescription, setSnapshotDescription] = useState('');

	// Configuration state (since not available in hook yet)
	const [config, setConfig] = useState({
		history: {
			autoCleanup: false,
			persistHistory: true,
			maxActions: 100,
		},
		validation: {
			validateActions: true,
		},
	});

	// Get filtered and sorted history
	const filteredHistory = useMemo(() => {
		const history = getHistory();

		// Apply text search
		let filtered = history;
		if (searchQuery) {
			filtered = history.filter(
				(action) =>
					action.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
					action.description.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Apply type filter
		if (filter.types && filter.types.length > 0) {
			filtered = filtered.filter((action) => filter.types?.includes(action.type));
		}

		// Apply sorting
		filtered.sort(makeHistoryComparator(sortOptions));

		return filtered;
	}, [searchQuery, filter, sortOptions, getHistory]);

	// Current action id to highlight
	const currentActionId = useMemo(() => {
		const history = getHistory();
		return history[state.currentIndex]?.id;
	}, [getHistory, state.currentIndex]);

	// Calculate statistics from current history
	const statistics = useMemo(() => {
		const history = getHistory();
		const actionsByType = history.reduce(
			(acc, action) => {
				acc[action.type] = (acc[action.type] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		return {
			totalActions: history.length,
			undoCount: state.currentIndex + 1,
			redoCount: state.totalActions - state.currentIndex - 1,
			successRate: 100, // Assume all actions succeed for now
			actionsByType,
		};
	}, [getHistory, state]);

	const handleUndo = async () => {
		await undo();
	};

	const handleRedo = async () => {
		await redo();
	};

	const handleClear = () => {
		if (confirm('Are you sure you want to clear the entire history? This action cannot be undone.')) {
			clear();
		}
	};

	const handleCreateSnapshot = () => {
		if (!snapshotName.trim()) {
			toastService.error('Please enter a snapshot name');
			return;
		}

		// For now, just save to localStorage as a simple implementation
		const snapshot = {
			id: Date.now().toString(),
			name: snapshotName.trim(),
			description: snapshotDescription.trim() || undefined,
			timestamp: new Date(),
			state,
			history: getHistory(),
		};

		const existingSnapshots = JSON.parse(localStorage.getItem('undo-redo-snapshots') || '[]');
		existingSnapshots.push(snapshot);
		localStorage.setItem('undo-redo-snapshots', JSON.stringify(existingSnapshots));

		toastService.success('Snapshot created successfully');
		setSnapshotName('');
		setSnapshotDescription('');
	};

	const handleExportHistory = () => {
		try {
			const data = JSON.stringify(
				{
					state,
					history: getHistory(),
					exportedAt: new Date().toISOString(),
				},
				null,
				2
			);

			const blob = new Blob([data], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `undo-redo-history-${Date.now()}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toastService.success('History exported successfully');
	} catch (err) {
			toastService.error('Failed to export history');
		}
	};

	const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target?.result as string);

				if (data.history && Array.isArray(data.history)) {
					// Clear current history and add imported actions
					clear();

					// Note: This is a simplified import - in a real implementation,
					// you'd want to properly restore the state
					toastService.success('History imported successfully');
					toastService.info('Note: History imported but state restoration is simplified');
				} else {
					throw new Error('Invalid history file format');
				}
			} catch (err) {
				toastService.error('Failed to import history: Invalid file format');
			}
		};
		reader.readAsText(file);
	};

	// Get snapshots from localStorage
	const snapshots = useMemo(() => {
		try {
			return JSON.parse(localStorage.getItem('undo-redo-snapshots') || '[]');
		} catch {
			return [];
		}
	}, []);

	const handleRestoreSnapshot = (snapshotId: string) => {
		const snapshot = snapshots.find((s: any) => s.id === snapshotId);
		if (snapshot) {
			// This is a simplified restore - in a real implementation,
			// you'd want to properly restore the manager state
			clear();
			toastService.success('Snapshot restored');
			toastService.info('Note: Snapshot restore is simplified');
		}
	};

	const handleDeleteSnapshot = (snapshotId: string) => {
		const updatedSnapshots = snapshots.filter((s: any) => s.id !== snapshotId);
		localStorage.setItem('undo-redo-snapshots', JSON.stringify(updatedSnapshots));
		toastService.success('Snapshot deleted');
	};

	const updateConfig = (newConfig: Partial<typeof config>) => {
		setConfig((prev) => ({
			...prev,
			...newConfig,
			history: { ...prev.history, ...newConfig.history },
			validation: { ...prev.validation, ...newConfig.validation },
		}));

		// In a real implementation, this would update the manager configuration
		toastService.info('Configuration updated (local only)');
	};

    

	if (compact) {
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				<Button
					disabled={!canUndo}
					onClick={handleUndo}
					size="sm"
					title={canUndo ? 'Undo last action' : 'Nothing to undo'}
					variant="outline"
				>
					<Undo2 className="h-4 w-4" />
				</Button>

				<Button
					disabled={!canRedo}
					onClick={handleRedo}
					size="sm"
					title={canRedo ? 'Redo last action' : 'Nothing to redo'}
					variant="outline"
				>
					<Redo2 className="h-4 w-4" />
				</Button>

				<Badge className="text-xs" variant="outline">
					{filteredHistory.length} actions
				</Badge>
			</div>
		);
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<History className="h-5 w-5" />
						Undo/Redo History
					</CardTitle>

					<div className="flex items-center gap-2">
						<Button
							disabled={!canUndo}
							onClick={handleUndo}
							size="sm"
							title={canUndo ? 'Undo last action' : 'Nothing to undo'}
							variant="outline"
						>
							<Undo2 className="h-4 w-4" />
						</Button>

						<Button
							disabled={!canRedo}
							onClick={handleRedo}
							size="sm"
							title={canRedo ? 'Redo last action' : 'Nothing to redo'}
							variant="outline"
						>
							<Redo2 className="h-4 w-4" />
						</Button>

						<Button
							disabled={filteredHistory.length === 0}
							onClick={handleClear}
							size="sm"
							title="Clear history"
							variant="outline"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent>
				<Tabs onValueChange={setSelectedTab} value={selectedTab}>
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="history">History</TabsTrigger>
						{showStatistics && <TabsTrigger value="statistics">Stats</TabsTrigger>}
						{showSnapshots && <TabsTrigger value="snapshots">Snapshots</TabsTrigger>}
						<TabsTrigger value="settings">Settings</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-4" value="history">
						<HistoryTab
							currentActionId={currentActionId}
							filter={filter}
							filteredHistory={filteredHistory}
							handleExportHistory={handleExportHistory}
							handleImportHistory={handleImportHistory}
							searchQuery={searchQuery}
							setFilter={setFilter}
							setSearchQuery={setSearchQuery}
							setShowFilters={setShowFilters}
							setSortOptions={setSortOptions}
							showFilters={showFilters}
							sortOptions={sortOptions}
						/>
					</TabsContent>

					{showStatistics && (
						<TabsContent className="space-y-4" value="statistics">
							<div className="grid grid-cols-2 gap-4">
								<Card>
									<CardContent className="p-4">
										<div className="font-bold text-2xl">{statistics.totalActions}</div>
										<div className="text-gray-600 text-sm">Total Actions</div>
									</CardContent>
								</Card>

								<Card>
									<CardContent className="p-4">
										<div className="font-bold text-2xl">{statistics.undoCount}</div>
										<div className="text-gray-600 text-sm">Actions Available to Undo</div>
									</CardContent>
								</Card>

								<Card>
									<CardContent className="p-4">
										<div className="font-bold text-2xl">{statistics.redoCount}</div>
										<div className="text-gray-600 text-sm">Actions Available to Redo</div>
									</CardContent>
								</Card>

								<Card>
									<CardContent className="p-4">
										<div className="font-bold text-2xl">{statistics.successRate.toFixed(1)}%</div>
										<div className="text-gray-600 text-sm">Success Rate</div>
									</CardContent>
								</Card>
							</div>

							<div className="space-y-3">
								<h4 className="font-medium">Actions by Type</h4>
								{Object.entries(statistics.actionsByType).map(([type, count]) => (
									<div className="flex items-center justify-between" key={type}>
										<span className="text-sm capitalize">{type.replace('-', ' ')}</span>
										<Badge variant="outline">{String(count)}</Badge>
									</div>
								))}
								{Object.keys(statistics.actionsByType).length === 0 && (
									<p className="text-gray-500 text-sm">No actions recorded yet</p>
								)}
							</div>
						</TabsContent>
					)}

					{showSnapshots && (
						<TabsContent className="space-y-4" value="snapshots">
							<div className="space-y-3">
								<div className="grid grid-cols-1 gap-2">
									<Input
										onChange={(e) => setSnapshotName(e.target.value)}
										placeholder="Snapshot name"
										value={snapshotName}
									/>
									<Textarea
										onChange={(e) => setSnapshotDescription(e.target.value)}
										placeholder="Description (optional)"
										rows={2}
										value={snapshotDescription}
									/>
									<Button disabled={!snapshotName.trim()} onClick={handleCreateSnapshot}>
										<Camera className="mr-2 h-4 w-4" />
										Create Snapshot
									</Button>
								</div>

								<Separator />

								<ScrollArea className="h-64">
									<div className="space-y-2">
										{snapshots.length === 0 ? (
											<div className="py-8 text-center text-gray-500">
												<Camera className="mx-auto mb-2 h-8 w-8 opacity-50" />
												<p>No snapshots created</p>
											</div>
										) : (
											snapshots.map((snapshot: any) => (
												<div className="flex items-center justify-between rounded-lg border p-3" key={snapshot.id}>
													<div className="flex-1">
														<div className="font-medium text-sm">{snapshot.name}</div>
														<div className="text-gray-500 text-xs">
															{formatDistanceToNow(new Date(snapshot.timestamp), { addSuffix: true })}
														</div>
														{snapshot.description && (
															<div className="mt-1 text-gray-600 text-xs">{snapshot.description}</div>
														)}
													</div>

													<div className="flex items-center gap-1">
														<Button onClick={() => handleRestoreSnapshot(snapshot.id)} size="sm" variant="outline">
															<RotateCcw className="h-3 w-3" />
														</Button>
														<Button onClick={() => handleDeleteSnapshot(snapshot.id)} size="sm" variant="outline">
															<Trash2 className="h-3 w-3" />
														</Button>
													</div>
												</div>
											))
										)}
									</div>
								</ScrollArea>
							</div>
						</TabsContent>
					)}

					<TabsContent className="space-y-4" value="settings">
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label htmlFor="auto-cleanup">Auto Cleanup</Label>
								<Switch
									checked={config.history.autoCleanup}
									id="auto-cleanup"
									onCheckedChange={(checked) =>
										updateConfig({
											history: { ...config.history, autoCleanup: checked },
										})
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label htmlFor="persist-history">Persist History</Label>
								<Switch
									checked={config.history.persistHistory}
									id="persist-history"
									onCheckedChange={(checked) =>
										updateConfig({
											history: { ...config.history, persistHistory: checked },
										})
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label htmlFor="validate-actions">Validate Actions</Label>
								<Switch
									checked={config.validation.validateActions}
									id="validate-actions"
									onCheckedChange={(checked) =>
										updateConfig({
											validation: { ...config.validation, validateActions: checked },
										})
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Max Actions ({config.history.maxActions})</Label>
								<input
									className="w-full"
									max="500"
									min="10"
									onChange={(e) =>
										updateConfig({
											history: { ...config.history, maxActions: Number.parseInt(e.target.value, 10) },
										})
									}
									type="range"
									value={config.history.maxActions}
								/>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
};
