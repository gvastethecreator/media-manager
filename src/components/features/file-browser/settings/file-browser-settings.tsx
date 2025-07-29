/**
 * File Browser Settings Component
 * 
 * Provides a comprehensive settings interface for customizing the file browser experience.
 * Includes view options, performance settings, accessibility options, and more.
 */

import React, { useState, useCallback } from 'react';
import { Settings, Eye, Zap, Accessibility, Download, Grid, List, Image, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useFileBrowserStore } from '@/stores/file-browser-store';
import { useSystemIntegration } from '@/hooks/use-system-integration';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';

interface FileBrowserSettingsProps {
  onClose?: () => void;
  className?: string;
}

export const FileBrowserSettings: React.FC<FileBrowserSettingsProps> = ({
  onClose,
  className = ''
}) => {
  const {
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    showHiddenFiles,
    setShowHiddenFiles,
    thumbnailSize,
    setThumbnailSize,
    enableVirtualization,
    setEnableVirtualization,
    itemsPerPage,
    setItemsPerPage
  } = useFileBrowserStore();

  const { capabilities, showSystemNotification } = useSystemIntegration();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  /**
   * Handle setting changes
   */
  const handleSettingChange = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  /**
   * Save settings
   */
  const handleSave = useCallback(async () => {
    try {
      // Settings are automatically saved through the store
      setHasUnsavedChanges(false);
      toastService.success('Settings saved successfully');
      
      if (capabilities.hasNotificationAccess) {
        await showSystemNotification('Settings Updated', {
          body: 'File browser settings have been saved',
          icon: '/favicon.ico'
        });
      }
      
      onClose?.();
    } catch (error) {
      toastService.error('Failed to save settings');
    }
  }, [capabilities.hasNotificationAccess, showSystemNotification, onClose]);

  /**
   * Reset to defaults
   */
  const handleReset = useCallback(() => {
    setViewMode('grid');
    setSortBy('name');
    setSortDirection('asc');
    setShowHiddenFiles(false);
    setThumbnailSize(150);
    setEnableVirtualization(true);
    setItemsPerPage(50);
    setHasUnsavedChanges(true);
    toastService.info('Settings reset to defaults');
  }, [
    setViewMode,
    setSortBy,
    setSortDirection,
    setShowHiddenFiles,
    setThumbnailSize,
    setEnableVirtualization,
    setItemsPerPage
  ]);

  return (
    <div className={cn('w-full max-w-4xl mx-auto p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">File Browser Settings</h1>
            <p className="text-sm text-gray-600">Customize your file browsing experience</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasUnsavedChanges}>
            Save Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="view" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <Accessibility className="w-4 h-4" />
            Accessibility
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* View Settings */}
        <TabsContent value="view" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid className="w-5 h-5" />
                Display Options
              </CardTitle>
              <CardDescription>
                Configure how files and folders are displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* View Mode */}
              <div className="space-y-2">
                <Label htmlFor="view-mode">View Mode</Label>
                <Select
                  value={viewMode}
                  onValueChange={(value: 'grid' | 'list') => {
                    setViewMode(value);
                    handleSettingChange();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">
                      <div className="flex items-center gap-2">
                        <Grid className="w-4 h-4" />
                        Grid View
                      </div>
                    </SelectItem>
                    <SelectItem value="list">
                      <div className="flex items-center gap-2">
                        <List className="w-4 h-4" />
                        List View
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Thumbnail Size */}
              {viewMode === 'grid' && (
                <div className="space-y-3">
                  <Label>Thumbnail Size: {thumbnailSize}px</Label>
                  <Slider
                    value={[thumbnailSize]}
                    onValueChange={([value]) => {
                      setThumbnailSize(value);
                      handleSettingChange();
                    }}
                    min={100}
                    max={300}
                    step={25}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Small (100px)</span>
                    <span>Large (300px)</span>
                  </div>
                </div>
              )}

              {/* Sort Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select
                    value={sortBy}
                    onValueChange={(value: 'name' | 'size' | 'modified' | 'type') => {
                      setSortBy(value);
                      handleSettingChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="size">Size</SelectItem>
                      <SelectItem value="modified">Modified Date</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sort Direction</Label>
                  <Select
                    value={sortDirection}
                    onValueChange={(value: 'asc' | 'desc') => {
                      setSortDirection(value);
                      handleSettingChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Show Hidden Files */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Hidden Files</Label>
                  <p className="text-sm text-gray-600">
                    Display files and folders that start with a dot
                  </p>
                </div>
                <Switch
                  checked={showHiddenFiles}
                  onCheckedChange={(checked) => {
                    setShowHiddenFiles(checked);
                    handleSettingChange();
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Settings */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Performance Optimization
              </CardTitle>
              <CardDescription>
                Configure performance settings for better responsiveness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Virtualization */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Virtualization</Label>
                  <p className="text-sm text-gray-600">
                    Improves performance with large file lists
                  </p>
                </div>
                <Switch
                  checked={enableVirtualization}
                  onCheckedChange={(checked) => {
                    setEnableVirtualization(checked);
                    handleSettingChange();
                  }}
                />
              </div>

              <Separator />

              {/* Items Per Page */}
              <div className="space-y-3">
                <Label>Items Per Page: {itemsPerPage}</Label>
                <Slider
                  value={[itemsPerPage]}
                  onValueChange={([value]) => {
                    setItemsPerPage(value);
                    handleSettingChange();
                  }}
                  min={25}
                  max={200}
                  step={25}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>25 items</span>
                  <span>200 items</span>
                </div>
                <p className="text-sm text-gray-600">
                  Higher values may impact performance with large directories
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accessibility Settings */}
        <TabsContent value="accessibility" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Accessibility className="w-5 h-5" />
                Accessibility Options
              </CardTitle>
              <CardDescription>
                Improve accessibility and usability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8 text-gray-500">
                <Accessibility className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Accessibility settings will be available in a future update</p>
                <p className="text-sm">Including keyboard navigation, screen reader support, and high contrast mode</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Advanced Configuration
              </CardTitle>
              <CardDescription>
                Advanced settings and system integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Capabilities */}
              <div className="space-y-3">
                <Label>System Integration</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">File System Access</span>
                    <Badge variant={capabilities.hasFileSystemAccess ? 'default' : 'secondary'}>
                      {capabilities.hasFileSystemAccess ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Clipboard Access</span>
                    <Badge variant={capabilities.hasClipboardAccess ? 'default' : 'secondary'}>
                      {capabilities.hasClipboardAccess ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Notifications</span>
                    <Badge variant={capabilities.hasNotificationAccess ? 'default' : 'secondary'}>
                      {capabilities.hasNotificationAccess ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Directory Picker</span>
                    <Badge variant={capabilities.canShowDirectoryPicker ? 'default' : 'secondary'}>
                      {capabilities.canShowDirectoryPicker ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Reset Settings */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reset Settings</Label>
                  <p className="text-sm text-gray-600">
                    Restore all settings to their default values
                  </p>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FileBrowserSettings;