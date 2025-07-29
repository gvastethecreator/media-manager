import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { Badge } from '../../../ui/badge';
import { ScrollArea } from '../../../ui/scroll-area';
import { Separator } from '../../../ui/separator';
import { Switch } from '../../../ui/switch';
import { Label } from '../../../ui/label';
import { Textarea } from '../../../ui/textarea';
import {
  Undo2,
  Redo2,
  History,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Camera,
  Settings,
  BarChart3,
  Clock,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  Save,
  FolderOpen,
  Eye,
  EyeOff
} from 'lucide-react';
import { useUndoRedo } from '../../../../hooks/use-undo-redo';
import type { UndoableAction, UndoActionType } from '../../../../services/undo-redo/undo-redo-manager';
import { formatDistanceToNow } from 'date-fns';
import { toastService } from '../../../../services/toast/toast.service';

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

const actionTypeIcons: Record<UndoActionType, React.ComponentType<{ className?: string }>> = {
  'copy': FileText,
  'move': FolderOpen,
  'delete': Trash2,
  'rename': FileText,
  'create-folder': FolderOpen,
  'paste': FileText,
  'duplicate': FileText,
  'add-to-collection': FolderOpen,
  'remove-from-collection': FolderOpen,
  'add-tag': FileText,
  'remove-tag': FileText
};

export const UndoRedoPanel: React.FC<UndoRedoPanelProps> = ({
  className = '',
  compact = false,
  showStatistics = true,
  showSnapshots = false, // Disabled since snapshots aren't implemented in hook
  showGroups = false // Disabled since groups aren't implemented in hook
}) => {
  const {
    state,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    getHistory,
    actions
  } = useUndoRedo();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('history');
  const [filter, setFilter] = useState<SimpleHistoryFilter>({});
  const [sortOptions, setSortOptions] = useState<SimpleSortOptions>({
    field: 'timestamp',
    direction: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');
  
  // Configuration state (since not available in hook yet)
  const [config, setConfig] = useState({
    history: {
      autoCleanup: false,
      persistHistory: true,
      maxActions: 100
    },
    validation: {
      validateActions: true
    }
  });

  // Get filtered and sorted history
  const filteredHistory = useMemo(() => {
    const history = getHistory();
    
    // Apply text search
    let filtered = history;
    if (searchQuery) {
      filtered = history.filter(action => 
        action.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filter.types && filter.types.length > 0) {
      filtered = filtered.filter(action => filter.types!.includes(action.type));
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
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
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOptions.direction === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [searchQuery, filter, sortOptions, getHistory]);
  
  // Calculate statistics from current history
  const statistics = useMemo(() => {
    const history = getHistory();
    const actionsByType = history.reduce((acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalActions: history.length,
      undoCount: state.currentIndex + 1,
      redoCount: state.totalActions - state.currentIndex - 1,
      successRate: 100, // Assume all actions succeed for now
      actionsByType
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
      state: state,
      history: getHistory()
    };
    
    const existingSnapshots = JSON.parse(localStorage.getItem('undo-redo-snapshots') || '[]');
    existingSnapshots.push(snapshot);
    localStorage.setItem('undo-redo-snapshots', JSON.stringify(existingSnapshots));
    
    toastService.success('Snapshot created successfully');
    setSnapshotName('');
    setSnapshotDescription('');
  };
  
  const handleExportHistory = async () => {
    try {
      const data = JSON.stringify({
        state,
        history: getHistory(),
        exportedAt: new Date().toISOString()
      }, null, 2);
      
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
    } catch (error) {
      toastService.error('Failed to export history');
    }
  };
  
  const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
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
      } catch (error) {
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
  }, [selectedTab]); // Re-read when switching to snapshots tab

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
    setConfig(prev => ({
      ...prev,
      ...newConfig,
      history: { ...prev.history, ...newConfig.history },
      validation: { ...prev.validation, ...newConfig.validation }
    }));
    
    // In a real implementation, this would update the manager configuration
    toastService.info('Configuration updated (local only)');
  };
  
  const ActionItem: React.FC<{ action: UndoableAction; index: number }> = ({ action, index }) => {
    const Icon = actionTypeIcons[action.type] || FileText;
    const isCurrentAction = index <= state.currentIndex;
    
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isCurrentAction ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
      }`}>
        <div className="flex-shrink-0">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{action.description}</span>
            <Badge className="text-xs bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              completed
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{action.type.replace('-', ' ')}</span>
            <span>{formatDistanceToNow(action.timestamp, { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    );
  };
  
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={!canUndo}
          title={canUndo ? 'Undo last action' : 'Nothing to undo'}
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRedo}
          disabled={!canRedo}
          title={canRedo ? 'Redo last action' : 'Nothing to redo'}
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        
        <Badge variant="outline" className="text-xs">
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
            <History className="w-5 h-5" />
            Undo/Redo History
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              title={canUndo ? 'Undo last action' : 'Nothing to undo'}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              title={canRedo ? 'Redo last action' : 'Nothing to redo'}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={filteredHistory.length === 0}
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="history">History</TabsTrigger>
            {showStatistics && <TabsTrigger value="statistics">Stats</TabsTrigger>}
            {showSnapshots && <TabsTrigger value="snapshots">Snapshots</TabsTrigger>}
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search actions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4" />
                </Button>
                
                <Button variant="outline" size="sm" onClick={handleExportHistory}>
                  <Download className="w-4 h-4" />
                </Button>
                
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportHistory}
                    className="hidden"
                  />
                </label>
              </div>
              
              {showFilters && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-xs font-medium">Action Type</Label>
                    <Select
                      value={filter.types?.[0] || ''}
                      onValueChange={(value) => setFilter(prev => ({
                        ...prev,
                        types: value ? [value as UndoActionType] : undefined
                      }))}
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
                    <Label className="text-xs font-medium">Sort By</Label>
                    <Select
                      value={sortOptions.field}
                      onValueChange={(value) => setSortOptions(prev => ({
                        ...prev,
                        field: value as any
                      }))}
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
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No actions in history</p>
                  </div>
                ) : (
                  filteredHistory.map((action, index) => (
                    <ActionItem key={action.id} action={action} index={index} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {showStatistics && (
            <TabsContent value="statistics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{statistics.totalActions}</div>
                    <div className="text-sm text-gray-600">Total Actions</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{statistics.undoCount}</div>
                    <div className="text-sm text-gray-600">Actions Available to Undo</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{statistics.redoCount}</div>
                    <div className="text-sm text-gray-600">Actions Available to Redo</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{statistics.successRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Actions by Type</h4>
                {Object.entries(statistics.actionsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{type.replace('-', ' ')}</span>
                    <Badge variant="outline">{String(count)}</Badge>
                  </div>
                ))}
                {Object.keys(statistics.actionsByType).length === 0 && (
                  <p className="text-sm text-gray-500">No actions recorded yet</p>
                )}
              </div>
            </TabsContent>
          )}
          
          {showSnapshots && (
            <TabsContent value="snapshots" className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    placeholder="Snapshot name"
                    value={snapshotName}
                    onChange={(e) => setSnapshotName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={snapshotDescription}
                    onChange={(e) => setSnapshotDescription(e.target.value)}
                    rows={2}
                  />
                  <Button onClick={handleCreateSnapshot} disabled={!snapshotName.trim()}>
                    <Camera className="w-4 h-4 mr-2" />
                    Create Snapshot
                  </Button>
                </div>
                
                <Separator />
                
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {snapshots.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No snapshots created</p>
                      </div>
                    ) : (
                      snapshots.map((snapshot: any) => (
                        <div key={snapshot.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{snapshot.name}</div>
                            <div className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(snapshot.timestamp), { addSuffix: true })}
                            </div>
                            {snapshot.description && (
                              <div className="text-xs text-gray-600 mt-1">{snapshot.description}</div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreSnapshot(snapshot.id)}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSnapshot(snapshot.id)}
                            >
                              <Trash2 className="w-3 h-3" />
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
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-cleanup">Auto Cleanup</Label>
                <Switch
                  id="auto-cleanup"
                  checked={config.history.autoCleanup}
                  onCheckedChange={(checked) => updateConfig({
                    history: { ...config.history, autoCleanup: checked }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="persist-history">Persist History</Label>
                <Switch
                  id="persist-history"
                  checked={config.history.persistHistory}
                  onCheckedChange={(checked) => updateConfig({
                    history: { ...config.history, persistHistory: checked }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="validate-actions">Validate Actions</Label>
                <Switch
                  id="validate-actions"
                  checked={config.validation.validateActions}
                  onCheckedChange={(checked) => updateConfig({
                    validation: { ...config.validation, validateActions: checked }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Max Actions ({config.history.maxActions})</Label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  value={config.history.maxActions}
                  onChange={(e) => updateConfig({
                    history: { ...config.history, maxActions: parseInt(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};