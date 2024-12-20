import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import { getImageMetadata } from '@/lib/image';
import { FileItem } from '@/types/file-item';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folderPath = searchParams.get('path');
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    if (!folderPath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    const files = await readdir(folderPath);
    const start = page * pageSize;
    const end = start + pageSize;
    const pageFiles = files.slice(start, end);

    const fileItems: FileItem[] = await Promise.all(
      pageFiles.map(async (fileName) => {
        const filePath = path.join(folderPath, fileName);
        const stats = await stat(filePath);
        const ext = path.extname(fileName).toLowerCase();
        const isImage = IMAGE_EXTENSIONS.has(ext);

        let metadata = undefined;
        if (isImage) {
          try {
            const imageMetadata = await getImageMetadata(filePath);
            const width = imageMetadata.width;
            const height = imageMetadata.height;
            const aspectRatio = width / height;
            
            metadata = {
              dimensions: { width, height },
              aspectRatio,
              orientation: aspectRatio > 1 ? 'landscape' : aspectRatio < 1 ? 'portrait' : 'square',
              fileType: imageMetadata.format,
              colorProfile: imageMetadata.space,
              created: stats.birthtime
            };
          } catch (error) {
            console.error(`Error getting metadata for ${filePath}:`, error);
          }
        }

        const fileItem: FileItem = {
          id: Buffer.from(filePath).toString('base64'),
          name: fileName,
          type: stats.isDirectory() ? 'directory' : isImage ? 'image' : 'file',
          size: stats.size,
          modified: stats.mtime,
          path: filePath,
          thumbnailUrl: isImage ? `/api/thumbnails?path=${encodeURIComponent(filePath)}` : undefined,
          metadata,
          gridInfo: {
            displayMode: 'normal'
          }
        };

        return fileItem;
      })
    );

    return NextResponse.json(fileItems);
  } catch (error) {
    console.error('Error reading folder:', error);
    return NextResponse.json({ error: 'Failed to read folder' }, { status: 500 });
  }
}
