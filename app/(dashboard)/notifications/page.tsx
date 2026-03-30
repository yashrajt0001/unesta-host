'use client';

import { useState, useEffect, useCallback } from 'react';
import { notifications as notifApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/pagination-controls';
import { Bell, CheckCheck, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Notification, Pagination } from '@/types';

export default function NotificationsPage() {
  const [notifList, setNotifList] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const res = await notifApi.getAll({ page, limit: 20 });
      setNotifList(res.data.notifications || res.data);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await notifApi.markRead(id);
      setNotifList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notifApi.markAllRead();
      setNotifList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const hasUnread = notifList.some((n) => !n.isRead);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Updates and alerts</p>
        </div>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-1 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-muted-foreground">No notifications</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {notifList.map((notif) => (
              <Card
                key={notif.id}
                className={cn(!notif.isRead && 'border-primary/30 bg-primary/5')}
              >
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', !notif.isRead && 'font-medium')}>
                      {notif.title || notif.content}
                    </p>
                    {notif.title && notif.content !== notif.title && (
                      <p className="text-sm text-muted-foreground mt-0.5">{notif.content}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleMarkRead(notif.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => fetchNotifications(p)}
          />
        </>
      )}
    </div>
  );
}
