import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Bell, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { HommieLoader } from "@/components/HommieLoader";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Use sonner for popups

interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Reference for the audio
  const audioPlayer = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 1. Initialize Audio
    audioPlayer.current = new Audio("/sound.mp3");
    // This helps "prime" the audio for the browser
    audioPlayer.current.load();

    fetchNotifications();

    // 2. Setup Realtime Listener
    console.log("Realtime: Listener starting...");
    const channel = supabase
      .channel('notif-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log("Realtime: New data received!", payload);
          handleNewIncomingNotification(payload.new as Notification);
        }
      )
      .subscribe((status) => {
        console.log("Realtime: Status is", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleNewIncomingNotification(newNotif: Notification) {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user.id;

    // Only play if global (null) or matches current user
    if (!newNotif.user_id || newNotif.user_id === currentUserId) {
      console.log("Realtime: Matches user, attempting to play sound...");

      // Update UI immediately
      setNotifications(prev => [newNotif, ...prev]);

      // TRY TO PLAY SOUND
      if (audioPlayer.current) {
        audioPlayer.current.play().then(() => {
          console.log("Sound: Played successfully!");
        }).catch(error => {
          console.error("Sound: Browser blocked autoplay. Tap the screen once!", error);
          // Fallback: show a toast so the user at least sees it
          toast.success(newNotif.title, { description: newNotif.body });
        });
      }
    }
  }

  async function fetchNotifications() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${session.user.id},user_id.is.null`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  }

  if (loading) return <HommieLoader />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 pb-24 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-950 border-b dark:border-slate-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="container max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="dark:hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5 dark:text-slate-300" />
            </Button>
            <h1 className="text-xl font-black text-[#0B1623] dark:text-white">Notifications</h1>
          </div>
          {notifications.some(n => !n.is_read) && (
            <Badge variant="destructive" className="animate-pulse">New</Badge>
          )}
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
              <Bell className="text-slate-300 dark:text-slate-600 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold dark:text-white">No notifications</h3>
            <p className="text-slate-500 dark:text-slate-400">We will notify you when things happen.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-5 border-none shadow-sm cursor-pointer transition-all ${!n.is_read
                  ? "bg-white dark:bg-gray-950 border-l-4 border-l-red-600 shadow-md"
                  : "bg-white/60 dark:bg-gray-950/60 opacity-80"
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl ${!n.is_read
                    ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    } transition-colors`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`text-sm tracking-tight ${!n.is_read
                        ? 'font-black text-slate-900 dark:text-white'
                        : 'font-bold text-slate-600 dark:text-slate-400'
                        }`}>
                        {n.title}
                      </h3>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {n.body}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}