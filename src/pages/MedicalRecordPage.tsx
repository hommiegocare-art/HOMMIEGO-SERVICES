// src/pages/MedicalRecordPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, HeartPulse } from "lucide-react";
import { MedicalProfileCard } from "@/components/profile/MedicalProfileCard";

export default function MedicalRecordPage() {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();

    if (!clientId) return null;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground -ml-2 mb-4 h-11"
            >
                <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-2 mb-4">
                <HeartPulse className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                    Medical record
                </h1>
            </div>

            <MedicalProfileCard clientId={clientId} />
        </div>
    );
}