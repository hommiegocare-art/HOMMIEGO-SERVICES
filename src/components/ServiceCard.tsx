import { useState, useEffect, useCallback } from "react";
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
  Info,
  ShieldCheck,
  Building2,
  Briefcase,
  Home,
  Users,
  CheckCircle,
  Clock
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

// In ServiceCard.tsx, update the interface
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
  providerId: string;
  providerType?: string;
  verificationStatus?: string;
  workspaceId?: string;
  workspaceType?: string;
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
  providerId,
  providerType = "Independent Provider",
  verificationStatus = "pending",
  workspaceId,
  workspaceType = "individual",
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

  // Get workspace icon based on type
  const getWorkspaceIcon = (type: string) => {
    switch (type) {
      case 'individual':
        return <User className="w-3 h-3" />;
      case 'family':
        return <Home className="w-3 h-3" />;
      case 'organization':
        return <Building2 className="w-3 h-3" />;
      case 'agency':
        return <Briefcase className="w-3 h-3" />;
      default:
        return <Building2 className="w-3 h-3" />;
    }
  };

  // Get provider type label
  const getProviderTypeLabel = (type: string) => {
    switch (type) {
      case 'individual':
        return 'Independent Provider';
      case 'family':
        return 'Family Care';
      case 'organization':
        return 'Healthcare Organization';
      case 'agency':
        return 'Healthcare Agency';
      default:
        return 'Healthcare Provider';
    }
  };

  // Get verification badge
  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          icon: <ShieldCheck className="w-3 h-3" />,
          label: 'Verified',
          className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        };
      case 'pending':
        return {
          icon: <Clock className="w-3 h-3" />,
          label: 'Pending Verification',
          className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        };
      case 'rejected':
        return {
          icon: <ShieldCheck className="w-3 h-3" />,
          label: 'Verification Failed',
          className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        };
      default:
        return {
          icon: <Clock className="w-3 h-3" />,
          label: 'Unverified',
          className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
        };
    }
  };

  const verification = getVerificationBadge(verificationStatus);
  const isVerified = verificationStatus === 'verified';

  const handleToggleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPending) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please sign in to like this service.",
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);
    try {
      if (isLiked) {
        const { error } = await supabase
          .from("service_likes")
          .delete()
          .eq("service_id", id)
          .eq("user_id", session.user.id);

        if (error) throw error;

        setIsLiked(false);
        setCount((prev) => Math.max(0, prev - 1));
        toast({
          title: "Unliked",
          description: "You've removed your like from this service.",
        });
      } else {
        const { error } = await supabase
          .from("service_likes")
          .insert({ service_id: id, user_id: session.user.id });

        if (error) {
          if (error.code === '23505') {
            const { data: existingLike } = await supabase
              .from("service_likes")
              .select("id")
              .eq("service_id", id)
              .eq("user_id", session.user.id)
              .single();

            if (existingLike) {
              setIsLiked(true);
              toast({ title: "Already liked!" });
              return;
            }
          }
          throw error;
        }

        setIsLiked(true);
        setCount((prev) => prev + 1);
        toast({
          title: "Liked!",
          description: "You've liked this service.",
        });
      }
    } catch (error: any) {
      // Silent error handling for duplicate key
      if (error.code !== '23505') {
        setIsLiked(initialIsLiked);
        setCount(likeCount);
        toast({
          title: "Error",
          description: error.message || "Failed to update like",
          variant: "destructive"
        });
      }
    } finally {
      setIsPending(false);
    }
  }, [id, isLiked, isPending, initialIsLiked, likeCount, toast]);

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please sign in to favorite this service.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFav) {
        const { error } = await supabase
          .from("service_favorites")
          .delete()
          .eq("service_id", id)
          .eq("user_id", session.user.id);

        if (error) throw error;

        setIsFav(false);
        toast({
          title: "Removed from favorites",
          description: "This service has been removed from your favorites.",
        });
      } else {
        const { error } = await supabase
          .from("service_favorites")
          .insert({ service_id: id, user_id: session.user.id });

        if (error) {
          if (error.code === '23505') {
            const { data: existingFav } = await supabase
              .from("service_favorites")
              .select("id")
              .eq("service_id", id)
              .eq("user_id", session.user.id)
              .single();

            if (existingFav) {
              setIsFav(true);
              toast({ title: "Already in favorites!" });
              return;
            }
          }
          throw error;
        }

        setIsFav(true);
        toast({
          title: "Saved!",
          description: "Added to your favorites.",
        });
      }
    } catch (error: any) {
      if (error.code !== '23505') {
        setIsFav(initialIsFavorited);
        toast({
          title: "Error",
          description: error.message || "Failed to update favorite",
          variant: "destructive"
        });
      }
    }
  }, [id, isFav, initialIsFavorited, toast]);

  const handleProfileClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${providerId}`);
  }, [providerId, navigate]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-transparent rounded-2xl">
      <CardHeader className="p-0 relative group/card">
        {/* --- IMAGE VIEWER DIALOG --- */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="relative h-48 overflow-hidden cursor-zoom-in rounded-t-2xl">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="text-white w-8 h-8 drop-shadow-lg" />
              </div>

              <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-2xl shadow-lg flex flex-col items-center leading-none z-10">
                <span className="text-[8px] uppercase font-black opacity-90 mb-0.5 tracking-tighter">
                  Service Fee
                </span>
                <span className="text-sm font-bold">
                  KES {price.toLocaleString()}
                </span>
              </div>

              {/* Verification Badge */}
              <div className={`absolute bottom-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${verification.className}`}>
                {verification.icon}
                {verification.label}
              </div>

              {/* Provider Type Badge */}
              <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-black/60 backdrop-blur-sm text-white">
                {getWorkspaceIcon(workspaceType)}
                <span>{getProviderTypeLabel(workspaceType)}</span>
              </div>
            </div>
          </DialogTrigger>

          <DialogContent className="max-w-[100vw] w-screen h-screen p-0 m-0 border-none bg-black/95 backdrop-blur-xl flex items-center justify-center z-[100]">
            <DialogClose asChild>
              <div className="absolute inset-0 w-full h-full cursor-zoom-out" />
            </DialogClose>

            <div
              className="relative z-10 p-4 md:p-10"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={image}
                alt={title}
                className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-sm animate-in zoom-in-95 duration-300"
              />
            </div>

            <div
              className="absolute bottom-10 z-20 flex items-center gap-6 bg-white/10 backdrop-blur-2xl px-8 py-4 rounded-full border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
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

            <p className="absolute bottom-4 text-white/30 text-[10px] uppercase tracking-[0.3em] font-bold">
              Tap outside to close
            </p>
          </DialogContent>
        </Dialog>

        {/* --- INTERACTIVE BUTTONS OVERLAY --- */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
          <Button
            variant="secondary"
            size="icon"
            className={`h-8 w-8 rounded-full backdrop-blur-md border-none transition-all shadow-sm ${isFav
              ? "bg-primary text-white"
              : "bg-white/70 dark:bg-zinc-800/70 text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700"
              }`}
            onClick={handleToggleFavorite}
          >
            <Bookmark className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            disabled={isPending}
            className={`h-8 w-8 rounded-full backdrop-blur-md border-none transition-all shadow-sm ${isLiked
              ? "bg-red-500 text-white"
              : "bg-white/70 dark:bg-zinc-800/70 text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700"
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
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-semibold text-lg line-clamp-1 text-slate-800 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center gap-1 bg-white/50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded-full border border-slate-100 dark:border-transparent">
            <Heart className={`w-3 h-3 ${isLiked ? "text-red-500 fill-red-500" : "text-slate-400 dark:text-zinc-500"}`} />
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">{count}</span>
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-3 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-slate-500 dark:text-zinc-400">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>

          {rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-slate-700 dark:text-zinc-300">{rating.toFixed(1)}</span>
              <span className="text-slate-400 dark:text-zinc-500">({reviews})</span>
            </div>
          )}
        </div>

        {/* Provider Info with Verification */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleProfileClick}
              className="text-xs text-primary hover:underline font-medium hover:text-primary/80 transition-colors focus:outline-none flex items-center gap-1"
            >
              <User className="w-3 h-3" />
              {name}
            </button>
            {isVerified && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
            {getWorkspaceIcon(workspaceType)}
            {getProviderTypeLabel(workspaceType)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full shadow-sm hover:shadow-md transition-shadow rounded-2xl"
          onClick={() => navigate(`/service/${id}`)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};