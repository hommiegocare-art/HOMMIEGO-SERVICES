import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Star,
  Heart,
  Bookmark,
  Loader2,
  Maximize2,
  User,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  rating?: number;
  reviews?: number;
  image: string;
  name: string;
  initialIsLiked?: boolean;
  initialIsFavorited?: boolean;
  likeCount?: number;
}

export const ServiceCard = ({
  id,
  title,
  description,
  price,
  location,
  rating = 0,
  reviews = 0,
  image,
  name,
  initialIsLiked = false,
  initialIsFavorited = false,
  likeCount = 0,
}: ServiceCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- INTERACTION STATE ---
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isFav, setIsFav] = useState(initialIsFavorited);
  const [count, setCount] = useState(likeCount);
  const [isPending, setIsPending] = useState(false);

  // Sync state if parent data changes
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setIsFav(initialIsFavorited);
    setCount(likeCount);
  }, [initialIsLiked, initialIsFavorited, likeCount]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents opening the viewer when clicking the button
    if (isPending) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Client Login Required",
        description: "Please sign in to like this service.",
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);
    try {
      if (isLiked) {
        setIsLiked(false);
        setCount((prev) => Math.max(0, prev - 1));
        await supabase.from("service_likes").delete().eq("service_id", id).eq("user_id", session.user.id);
      } else {
        setIsLiked(true);
        setCount((prev) => prev + 1);
        await supabase.from("service_likes").insert({ service_id: id, user_id: session.user.id });
      }
    } catch (error) {
      setIsLiked(initialIsLiked);
      setCount(likeCount);
    } finally {
      setIsPending(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents opening the viewer when clicking the button
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Client Login Required", variant: "destructive" });
      return;
    }

    try {
      if (isFav) {
        setIsFav(false);
        await supabase.from("service_favorites").delete().eq("service_id", id).eq("user_id", session.user.id);
      } else {
        setIsFav(true);
        await supabase.from("service_favorites").insert({ service_id: id, user_id: session.user.id });
        toast({ title: "Saved!", description: "Added to your favorites." });
      }
    } catch (error) {
      setIsFav(initialIsFavorited);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border border-slate-100 dark:border-slate-800">
      <CardHeader className="p-0 relative group/card">
        {/* --- IMAGE VIEWER DIALOG --- */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="relative h-48 overflow-hidden cursor-zoom-in">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
              />
              {/* Hover Overlay Icon */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="text-white w-8 h-8 drop-shadow-lg" />
              </div>

              {/* Original Price Badge - Kept exactly the same */}
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-xl shadow-lg flex flex-col items-center leading-none z-10">
                <span className="text-[8px] uppercase font-black opacity-90 mb-0.5 tracking-tighter">
                  Service Fee
                </span>
                <span className="text-sm font-bold">
                  KES {price.toLocaleString()}
                </span>
              </div>
            </div>
          </DialogTrigger>

          <DialogContent className="max-w-[100vw] w-screen h-screen p-0 m-0 border-none bg-black/95 backdrop-blur-xl flex items-center justify-center z-[100]">

            {/* 1. This DialogClose acts as the "Background" button */}
            <DialogClose asChild>
              <div className="absolute inset-0 w-full h-full cursor-zoom-out">
                {/* This div is empty but fills the whole screen to catch clicks */}
              </div>
            </DialogClose>

            {/* 2. THE IMAGE */}
            <div
              className="relative z-10 p-4 md:p-10"
              onClick={(e) => e.stopPropagation()} // This stops the "Close" command when clicking the image
            >
              <img
                src={image}
                alt={title}
                className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-sm animate-in zoom-in-95 duration-300"
              />
            </div>

            {/* 3. THE BOTTOM BAR */}
            <div
              className="absolute bottom-10 z-20 flex items-center gap-6 bg-white/10 backdrop-blur-2xl px-8 py-4 rounded-full border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()} // This stops the "Close" command when clicking the bar/button
            >
              <div className="flex flex-col border-r border-white/20 pr-6">
                <span className="text-[10px] text-white/50 uppercase font-black tracking-widest leading-none mb-1">
                  Service Fee
                </span>
                <span className="text-white font-bold text-xl">
                  KES {price.toLocaleString()}
                </span>
              </div>

              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-12 font-bold shadow-lg transition-transform active:scale-95"
                onClick={() => navigate(`/booking/${id}`)}
              >
                Go to Booking
              </Button>
            </div>

            {/* Close Hint */}
            <p className="absolute bottom-4 text-white/30 text-[10px] uppercase tracking-[0.3em] font-bold">
              Tap outside to close
            </p>
          </DialogContent>
        </Dialog>

        {/* --- INTERACTIVE BUTTONS OVERLAY (OUTSIDE DIALOG TRIGGER) --- */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
          <Button
            variant="secondary"
            size="icon"
            className={`h-8 w-8 rounded-full backdrop-blur-md border-none transition-all shadow-sm ${isFav ? "bg-primary text-white" : "bg-white/70 text-slate-700 hover:bg-white"
              }`}
            onClick={handleToggleFavorite}
          >
            <Bookmark className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            disabled={isPending}
            className={`h-8 w-8 rounded-full backdrop-blur-md border-none transition-all shadow-sm ${isLiked ? "bg-red-500 text-white" : "bg-white/70 text-slate-700 hover:bg-white"
              }`}
            onClick={handleToggleLike}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Title and Total Likes count */}
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-semibold text-lg line-clamp-1 text-slate-800 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center gap-1 bg-white/50 px-1.5 py-0.5 rounded-md border border-slate-100">
            <Heart className={`w-3 h-3 ${isLiked ? "text-red-500 fill-red-500" : "text-slate-400"}`} />
            <span className="text-xs font-bold text-slate-600">{count}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>

          {rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-slate-700">{rating}</span>
              <span className="text-muted-foreground">({reviews})</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2 italic">
          by {name}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full shadow-sm hover:shadow-md transition-shadow"
          onClick={() => navigate(`/booking/${id}`)}
        >
          More Details
        </Button>
      </CardFooter>
    </Card>
  );
};