// src/pages/Profile.tsx
import { useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { PublicProfile } from "@/components/profile/PublicProfile";
import { OwnProfile } from "@/components/profile/OwnProfile";

export default function Profile() {
    const { userId } = useParams<{ userId?: string }>();
    const { user, loading } = useSession();

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                <div className="h-20 rounded-2xl skeleton-shimmer" />
                <div className="h-32 rounded-2xl skeleton-shimmer" />
                <div className="h-24 rounded-2xl skeleton-shimmer" />
            </div>
        );
    }

    // PublicProfile requires a signed-in viewer to resolve connections
    if (!user) return null;

    // Viewing own profile
    if (userId && userId === user.id) return <OwnProfile />;

    // Viewing someone else — public view requires an explicit id
    if (!userId) return null;
    return <PublicProfile userId={userId} />;
}