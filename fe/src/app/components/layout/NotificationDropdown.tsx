import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Heart, MessageSquare, UserPlus, CheckCheck, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  NotificationItem
} from '../../services/api';

function formatTimeAgo(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface NotificationDropdownProps {
  buttonSizeClassName?: string;
}

export function NotificationDropdown({ buttonSizeClassName = 'h-10 w-10' }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getNotificationsApi(30);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleUserClick = (e: React.MouseEvent, senderId: string) => {
    e.stopPropagation();
    setIsOpen(false);
    if (senderId) {
      navigate(`/profile/${senderId}`);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      try {
        await markNotificationReadApi(item.created_at);
        setNotifications((prev) =>
          prev.map((n) => (n.created_at === item.created_at ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }

    setIsOpen(false);

    if (item.type === 'FOLLOW') {
      navigate(`/profile/${item.sender_id}`);
    } else if (item.type === 'COMMENT' && item.post_id) {
      navigate(`/feed?open_comments=${item.post_id}#post-${item.post_id}`);
    } else if (item.type === 'LIKE' && item.post_id) {
      navigate(`/feed#post-${item.post_id}`);
    } else if (item.post_id) {
      navigate(`/feed#post-${item.post_id}`);
    }
  };

  const renderNotifIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return (
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-md ring-2 ring-card">
            <Heart className="h-3 w-3 fill-white text-white" />
          </div>
        );
      case 'COMMENT':
        return (
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-blue-500 text-white shadow-md ring-2 ring-card">
            <MessageSquare className="h-3 w-3 fill-white text-white" />
          </div>
        );
      case 'FOLLOW':
        return (
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-md ring-2 ring-card">
            <UserPlus className="h-3 w-3 text-white" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDropdown}
        title="Notifications"
        className={`relative text-muted-foreground hover:text-foreground transition-colors ${buttonSizeClassName}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm animate-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-4 w-80 sm:w-96 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-7 text-xs font-medium gap-1 text-muted-foreground hover:text-primary transition-colors px-2"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[380px] min-h-[140px]">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  When someone likes or comments on your posts or follows you, it will show up here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {notifications.map((item) => (
                  <button
                    key={item.created_at + item.sender_id}
                    onClick={() => handleNotificationClick(item)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-accent/60 cursor-pointer ${
                      !item.is_read ? 'bg-primary/5 dark:bg-primary/10' : ''
                    }`}
                  >
                    {/* Sender Avatar with type icon overlay */}
                    <div
                      className="relative shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => handleUserClick(e, item.sender_id)}
                      title={`View ${item.sender_name}'s profile`}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={item.sender_avatar} alt={item.sender_name} />
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                          {getInitials(item.sender_name)}
                        </AvatarFallback>
                      </Avatar>
                      {renderNotifIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed text-foreground">
                        <span
                          className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors mr-1"
                          onClick={(e) => handleUserClick(e, item.sender_id)}
                          title={`View ${item.sender_name}'s profile`}
                        >
                          {item.sender_name}
                        </span>
                        <span className="text-muted-foreground">{item.content}</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground font-medium mt-1 block">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>

                    {/* Unread status dot */}
                    {!item.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
