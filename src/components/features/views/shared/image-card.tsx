'use client';

import { FileItem } from '@/types/file-item';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';

interface ImageCardProps {
  image: FileItem;
  onSelect: (image: FileItem) => void;
  isResizing?: boolean;
  className?: string;
}

export function ImageCard({
  image,
  onSelect,
  isResizing,
  className
}: ImageCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden hover:bg-muted/50 transition-colors cursor-pointer",
        className
      )}
      onClick={() => onSelect(image)}
    >
      <CardContent className="p-0">
        <div className="aspect-square relative bg-muted">
          {image.thumbnailUrl ? (
            <img
              src={image.thumbnailUrl}
              alt={image.name}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-200",
                isResizing && "opacity-0"
              )}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-2">
        <div className="w-full">
          <p className="text-sm truncate" title={image.name}>
            {image.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {image.size ? formatFileSize(image.size) : ''}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return size.toFixed(1) + ' ' + units[unitIndex];
}
