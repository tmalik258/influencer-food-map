'use client';

import { Video } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, User, Eye, Edit, Trash2, Clock, Play } from 'lucide-react';

import type { VideoTableProps } from '@/lib/types';

export function VideoTable({
  videos,
  searchTerm,
  selectedInfluencer,
  hasListings,
  onViewVideo,
  onEditVideo,
  onDeleteVideo,
  onClearFilters
}: VideoTableProps) {
  if (videos.length === 0) {
    return (
      <Card className="glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30">
        <CardContent className="text-center py-12">
          <Play className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {searchTerm || selectedInfluencer || hasListings !== undefined
              ? 'No videos found matching your filters.'
              : 'No videos available.'}
          </p>
          {(searchTerm || selectedInfluencer || hasListings !== undefined) && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 p-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Video</TableHead>
              <TableHead>Title & Description</TableHead>
              <TableHead>Influencer</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video.id} className="cursor-pointer hover:bg-orange-50/50 dark:hover:bg-orange-900/20 border-b border-white/10 dark:border-gray-700/30 transition-all duration-200">
                <TableCell>
                  <div className="w-32 h-18 bg-gray-100 rounded-lg overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
                      title={video.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <div>
                    <div className="font-semibold line-clamp-2 mb-1 text-gray-900 dark:text-white">{video.title}</div>
                    {video.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {video.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        ID: {video.id.slice(0, 8)}...
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        YT: {video.youtube_video_id}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-900 dark:text-white">{video.influencer?.name || 'Unknown'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {video.published_at ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-900 dark:text-white">{new Date(video.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewVideo(video);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditVideo(video);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteVideo(video);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}