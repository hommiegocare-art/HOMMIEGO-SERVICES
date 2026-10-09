// src/pages/MedicalAuditPage.tsx
import { useParams } from "react-router-dom";
import { MedicalAuditTrailCard } from "@/components/profile/MedicalAuditTrail";

export default function MedicalAuditPage() {
    const { clientId } = useParams<{ clientId: string }>();
    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-black mb-4">Audit trail</h1>
            <MedicalAuditTrailCard clientId={clientId} />
        </div>
    );
}