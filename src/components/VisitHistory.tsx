import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    Stethoscope,
    Plus,
    EyeIcon,
    Loader2,
    Calendar,
    Clock,
    User,
    Pill,
    Activity,
    HeartPulse,
    FileText,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Ambulance,
    Home,
    Monitor,
    Scissors,
    Syringe,
    Bandage,
    Microscope,
    Brain,
    Bone,
    Save,
    X,
    ChevronDown,
    ChevronUp,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Visit {
    id: string;
    patient_id: string;
    provider_id: string;
    visit_date: string;
    visit_type: string;
    visit_status: string;
    is_emergency: boolean;
    emergency_level: string;
    chief_complaint: string;
    history_of_presenting_illness: string;
    symptoms: string[];
    duration_of_symptoms: string;
    severity: string;
    vitals: any;
    physical_examination: string;
    systems_examined: string[];
    findings: string[];
    investigations_ordered: string[];
    lab_tests_done: string[];
    imaging_done: string[];
    primary_diagnosis: string;
    secondary_diagnosis: string[];
    differential_diagnosis: string[];
    treatment_plan: string;
    medications_prescribed: any;
    procedures_performed: string[];
    referrals_made: string[];
    follow_up_required: boolean;
    follow_up_date: string;
    follow_up_instructions: string;
    outcome: string;
    outcome_notes: string;
    clinical_notes: string;
    patient_education_provided: string;
    visit_duration_minutes: number;
    created_at: string;
    updated_at: string;
    provider: {
        full_name: string;
    };
}

interface VisitHistoryProps {
    patientId: string;
    isProvider: boolean;
    isAdmin: boolean;
    isPinVerified: boolean;
    canEdit: boolean;
}

export const VisitHistory = ({
    patientId,
    isProvider,
    isAdmin,
    isPinVerified,
    canEdit
}: VisitHistoryProps) => {
    const { toast } = useToast();
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [saving, setSaving] = useState(false);
    const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());

    // Form state for adding visit
    const [formData, setFormData] = useState({
        visit_type: "consultation",
        visit_status: "completed",
        is_emergency: false,
        emergency_level: "",
        chief_complaint: "",
        history_of_presenting_illness: "",
        symptoms: "",
        duration_of_symptoms: "",
        severity: "moderate",
        physical_examination: "",
        systems_examined: "",
        findings: "",
        investigations_ordered: "",
        lab_tests_done: "",
        imaging_done: "",
        primary_diagnosis: "",
        secondary_diagnosis: "",
        differential_diagnosis: "",
        treatment_plan: "",
        medications_prescribed: "",
        procedures_performed: "",
        referrals_made: "",
        follow_up_required: false,
        follow_up_date: "",
        follow_up_instructions: "",
        outcome: "",
        outcome_notes: "",
        clinical_notes: "",
        patient_education_provided: "",
        visit_duration_minutes: "",
        blood_pressure: "",
        heart_rate: "",
        temperature: "",
        oxygen_saturation: "",
        weight: "",
        height: "",
        respiratory_rate: "",
        blood_glucose: "",
    });

    useEffect(() => {
        if (patientId) {
            fetchVisits();
        }
    }, [patientId]);

    const fetchVisits = useCallback(async () => {
        try {
            setLoading(true);

            // Check cache first
            const cacheKey = `visits_${patientId}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 30000) { // 30s cache
                    setVisits(parsed.data);
                    setLoading(false);
                    return;
                }
            }

            const { data, error } = await supabase
                .from("visit_history")
                .select(`
                    *,
                    provider:provider_id (
                        full_name
                    )
                `)
                .eq("patient_id", patientId)
                .order("visit_date", { ascending: false });

            if (error) throw error;

            // Cache the result
            sessionStorage.setItem(cacheKey, JSON.stringify({
                data: data || [],
                timestamp: Date.now()
            }));

            setVisits(data || []);
        } catch (err: any) {
            console.error("Error fetching visits:", err);
            toast({
                title: "Error",
                description: "Failed to load visit history",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [patientId, toast]);

    const toggleVisitExpand = useCallback((visitId: string) => {
        setExpandedVisits(prev => {
            const newSet = new Set(prev);
            if (newSet.has(visitId)) {
                newSet.delete(visitId);
            } else {
                newSet.add(visitId);
            }
            return newSet;
        });
    }, []);

    const handleAddVisit = useCallback(async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    title: "Authentication Required",
                    description: "Please log in to add a visit.",
                    variant: "destructive"
                });
                return;
            }

            const vitals = {
                blood_pressure: formData.blood_pressure || null,
                heart_rate: formData.heart_rate ? `${formData.heart_rate} bpm` : null,
                temperature: formData.temperature ? `${formData.temperature}°C` : null,
                oxygen_saturation: formData.oxygen_saturation ? `${formData.oxygen_saturation}%` : null,
                weight: formData.weight ? `${formData.weight} kg` : null,
                height: formData.height ? `${formData.height} cm` : null,
                respiratory_rate: formData.respiratory_rate ? `${formData.respiratory_rate}/min` : null,
                blood_glucose: formData.blood_glucose ? `${formData.blood_glucose} mmol/L` : null,
            };

            const symptoms = formData.symptoms.split(",").map(s => s.trim()).filter(Boolean);
            const systemsExamined = formData.systems_examined.split(",").map(s => s.trim()).filter(Boolean);
            const findings = formData.findings.split(",").map(f => f.trim()).filter(Boolean);
            const investigations = formData.investigations_ordered.split(",").map(i => i.trim()).filter(Boolean);
            const labTests = formData.lab_tests_done.split(",").map(l => l.trim()).filter(Boolean);
            const imaging = formData.imaging_done.split(",").map(i => i.trim()).filter(Boolean);
            const secondaryDiagnosis = formData.secondary_diagnosis.split(",").map(d => d.trim()).filter(Boolean);
            const differential = formData.differential_diagnosis.split(",").map(d => d.trim()).filter(Boolean);
            const procedures = formData.procedures_performed.split(",").map(p => p.trim()).filter(Boolean);
            const referrals = formData.referrals_made.split(",").map(r => r.trim()).filter(Boolean);

            const medications = formData.medications_prescribed
                .split("\n")
                .filter(line => line.trim())
                .map(line => {
                    const parts = line.split(",").map(p => p.trim());
                    return {
                        name: parts[0] || "",
                        dosage: parts[1] || "",
                        frequency: parts[2] || "",
                        duration: parts[3] || "",
                    };
                });

            const { error } = await supabase
                .from("visit_history")
                .insert({
                    patient_id: patientId,
                    provider_id: user.id,
                    visit_type: formData.visit_type,
                    visit_status: formData.visit_status,
                    is_emergency: formData.is_emergency,
                    emergency_level: formData.is_emergency ? formData.emergency_level : null,
                    chief_complaint: formData.chief_complaint,
                    history_of_presenting_illness: formData.history_of_presenting_illness,
                    symptoms: symptoms,
                    duration_of_symptoms: formData.duration_of_symptoms,
                    severity: formData.severity,
                    vitals: vitals,
                    physical_examination: formData.physical_examination,
                    systems_examined: systemsExamined,
                    findings: findings,
                    investigations_ordered: investigations,
                    lab_tests_done: labTests,
                    imaging_done: imaging,
                    primary_diagnosis: formData.primary_diagnosis,
                    secondary_diagnosis: secondaryDiagnosis,
                    differential_diagnosis: differential,
                    treatment_plan: formData.treatment_plan,
                    medications_prescribed: medications.length > 0 ? medications : null,
                    procedures_performed: procedures,
                    referrals_made: referrals,
                    follow_up_required: formData.follow_up_required,
                    follow_up_date: formData.follow_up_date || null,
                    follow_up_instructions: formData.follow_up_instructions,
                    outcome: formData.outcome || null,
                    outcome_notes: formData.outcome_notes,
                    clinical_notes: formData.clinical_notes,
                    patient_education_provided: formData.patient_education_provided,
                    visit_duration_minutes: formData.visit_duration_minutes ? parseInt(formData.visit_duration_minutes) : null,
                });

            if (error) throw error;

            // Invalidate cache
            sessionStorage.removeItem(`visits_${patientId}`);

            toast({
                title: "Visit Recorded",
                description: "The medical visit has been recorded successfully.",
            });

            setFormData({
                visit_type: "consultation",
                visit_status: "completed",
                is_emergency: false,
                emergency_level: "",
                chief_complaint: "",
                history_of_presenting_illness: "",
                symptoms: "",
                duration_of_symptoms: "",
                severity: "moderate",
                physical_examination: "",
                systems_examined: "",
                findings: "",
                investigations_ordered: "",
                lab_tests_done: "",
                imaging_done: "",
                primary_diagnosis: "",
                secondary_diagnosis: "",
                differential_diagnosis: "",
                treatment_plan: "",
                medications_prescribed: "",
                procedures_performed: "",
                referrals_made: "",
                follow_up_required: false,
                follow_up_date: "",
                follow_up_instructions: "",
                outcome: "",
                outcome_notes: "",
                clinical_notes: "",
                patient_education_provided: "",
                visit_duration_minutes: "",
                blood_pressure: "",
                heart_rate: "",
                temperature: "",
                oxygen_saturation: "",
                weight: "",
                height: "",
                respiratory_rate: "",
                blood_glucose: "",
            });
            setShowAddDialog(false);
            await fetchVisits();

        } catch (err: any) {
            console.error("Error adding visit:", err);
            toast({
                title: "Error",
                description: err.message || "Failed to add visit",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    }, [formData, patientId, toast, fetchVisits]);

    const getVisitTypeIcon = useCallback((type: string) => {
        switch (type) {
            case 'consultation': return <User className="w-4 h-4" />;
            case 'emergency': return <Ambulance className="w-4 h-4" />;
            case 'follow_up': return <Clock className="w-4 h-4" />;
            case 'home_visit': return <Home className="w-4 h-4" />;
            case 'telemedicine': return <Monitor className="w-4 h-4" />;
            case 'procedure': return <Scissors className="w-4 h-4" />;
            case 'general_checkup': return <Stethoscope className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    }, []);

    const getStatusColor = useCallback((status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'in_progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'no_show': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
        }
    }, []);

    const getOutcomeBadge = useCallback((outcome: string) => {
        switch (outcome) {
            case 'improved': return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">Improved</Badge>;
            case 'stable': return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">Stable</Badge>;
            case 'worsened': return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Worsened</Badge>;
            case 'referred': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">Referred</Badge>;
            case 'admitted': return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">Admitted</Badge>;
            case 'discharged': return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400 rounded-full">Discharged</Badge>;
            default: return null;
        }
    }, []);

    const getSeverityColor = useCallback((severity: string) => {
        switch (severity) {
            case 'mild': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'moderate': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'severe': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
        }
    }, []);

    // Memoized visits list
    const visitItems = useMemo(() => {
        return visits.map((visit) => ({
            ...visit,
            isExpanded: expandedVisits.has(visit.id)
        }));
    }, [visits, expandedVisits]);

    if (loading) {
        return (
            <div className="w-full space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="bg-zinc-200 dark:bg-zinc-700/50 rounded-2xl h-32 w-full"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            {/* Header - Edge to Edge */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-primary" />
                        Visit History
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {visits.length} visit{visits.length !== 1 ? 's' : ''} recorded
                    </p>
                </div>
                {(isProvider || isAdmin) && isPinVerified && (
                    <Button
                        size="sm"
                        className="gap-2 rounded-2xl shadow-lg shadow-primary/20"
                        onClick={() => setShowAddDialog(true)}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Record Visit</span>
                    </Button>
                )}
            </div>

            {/* Visits List - Native Android Cards */}
            {visits.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-100 dark:border-transparent shadow-sm">
                    <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                        <Stethoscope className="w-8 h-8 text-zinc-400" />
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">No visits recorded</p>
                    {(isProvider || isAdmin) && isPinVerified && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 gap-2 rounded-xl"
                            onClick={() => setShowAddDialog(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Record First Visit
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {visitItems.map((visit) => (
                        <div
                            key={visit.id}
                            className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${visit.is_emergency ? 'border-l-4 border-l-red-500' : ''
                                }`}
                        >
                            {/* Compact View */}
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                {getVisitTypeIcon(visit.visit_type)}
                                                <Badge className="bg-primary/10 text-primary rounded-full text-xs">
                                                    {visit.visit_type.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </div>
                                            <Badge className={`${getStatusColor(visit.visit_status)} rounded-full text-xs`}>
                                                {visit.visit_status.replace('_', ' ')}
                                            </Badge>
                                            {visit.is_emergency && (
                                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs animate-pulse">
                                                    ⚡ Emergency
                                                </Badge>
                                            )}
                                            {visit.severity && (
                                                <Badge className={`${getSeverityColor(visit.severity)} rounded-full text-xs`}>
                                                    {visit.severity}
                                                </Badge>
                                            )}
                                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(visit.visit_date).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="mt-2 flex flex-wrap items-center gap-3">
                                            {visit.chief_complaint && (
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-zinc-400">Chief Complaint</p>
                                                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                                                        {visit.chief_complaint}
                                                    </p>
                                                </div>
                                            )}
                                            {visit.primary_diagnosis && (
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-zinc-400">Primary Diagnosis</p>
                                                    <p className="text-sm font-medium text-primary truncate">
                                                        {visit.primary_diagnosis}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Vitals Summary - Quick glance */}
                                        {visit.vitals && Object.keys(visit.vitals).some(key => visit.vitals[key]) && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {visit.vitals.blood_pressure && (
                                                    <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                                                        <span className="text-[10px] text-zinc-400">BP</span>
                                                        <span className="text-xs font-bold ml-1">{visit.vitals.blood_pressure}</span>
                                                    </div>
                                                )}
                                                {visit.vitals.heart_rate && (
                                                    <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                                                        <span className="text-[10px] text-zinc-400">HR</span>
                                                        <span className="text-xs font-bold ml-1">{visit.vitals.heart_rate}</span>
                                                    </div>
                                                )}
                                                {visit.vitals.temperature && (
                                                    <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                                                        <span className="text-[10px] text-zinc-400">Temp</span>
                                                        <span className="text-xs font-bold ml-1">{visit.vitals.temperature}</span>
                                                    </div>
                                                )}
                                                {visit.vitals.oxygen_saturation && (
                                                    <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                                                        <span className="text-[10px] text-zinc-400">O₂</span>
                                                        <span className="text-xs font-bold ml-1">{visit.vitals.oxygen_saturation}</span>
                                                    </div>
                                                )}
                                                {visit.vitals.weight && (
                                                    <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                                                        <span className="text-[10px] text-zinc-400">Wt</span>
                                                        <span className="text-xs font-bold ml-1">{visit.vitals.weight}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {getOutcomeBadge(visit.outcome)}
                                            {visit.follow_up_required && (
                                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Follow-up
                                                </Badge>
                                            )}
                                            {visit.medications_prescribed && Array.isArray(visit.medications_prescribed) && visit.medications_prescribed.length > 0 && (
                                                <Badge variant="secondary" className="rounded-full text-xs">
                                                    <Pill className="w-3 h-3 mr-1" />
                                                    {visit.medications_prescribed.length} meds
                                                </Badge>
                                            )}
                                            {visit.procedures_performed && visit.procedures_performed.length > 0 && (
                                                <Badge variant="secondary" className="rounded-full text-xs">
                                                    <Scissors className="w-3 h-3 mr-1" />
                                                    {visit.procedures_performed.length} procedures
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <div className="flex gap-1">
                                            {(isProvider || isAdmin) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-xl"
                                                    onClick={() => {
                                                        setSelectedVisit(visit);
                                                        setShowDetailDialog(true);
                                                    }}
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-xl"
                                                onClick={() => toggleVisitExpand(visit.id)}
                                            >
                                                {visit.isExpanded ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <span className="text-[10px] text-zinc-400">
                                            Dr. {visit.provider?.full_name?.split(' ')[0] || 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded View - Additional Details */}
                            {visit.isExpanded && (
                                <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-800/30">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        {visit.history_of_presenting_illness && (
                                            <div className="md:col-span-2">
                                                <p className="text-xs text-zinc-400">History of Presenting Illness</p>
                                                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                                    {visit.history_of_presenting_illness}
                                                </p>
                                            </div>
                                        )}
                                        {visit.symptoms && visit.symptoms.length > 0 && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Symptoms</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {visit.symptoms.map((s, i) => (
                                                        <Badge key={i} variant="secondary" className="rounded-full text-xs">{s}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {visit.duration_of_symptoms && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Duration</p>
                                                <p className="text-zinc-700 dark:text-zinc-300">{visit.duration_of_symptoms}</p>
                                            </div>
                                        )}
                                        {visit.physical_examination && (
                                            <div className="md:col-span-2">
                                                <p className="text-xs text-zinc-400">Physical Examination</p>
                                                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                                    {visit.physical_examination}
                                                </p>
                                            </div>
                                        )}
                                        {visit.treatment_plan && (
                                            <div className="md:col-span-2">
                                                <p className="text-xs text-zinc-400">Treatment Plan</p>
                                                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                                    {visit.treatment_plan}
                                                </p>
                                            </div>
                                        )}
                                        {visit.clinical_notes && (
                                            <div className="md:col-span-2">
                                                <p className="text-xs text-zinc-400">Clinical Notes</p>
                                                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                                    {visit.clinical_notes}
                                                </p>
                                            </div>
                                        )}
                                        {visit.visit_duration_minutes && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Duration</p>
                                                <p className="text-zinc-700 dark:text-zinc-300">{visit.visit_duration_minutes} min</p>
                                            </div>
                                        )}
                                        {visit.outcome_notes && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Outcome Notes</p>
                                                <p className="text-zinc-700 dark:text-zinc-300">{visit.outcome_notes}</p>
                                            </div>
                                        )}
                                        {visit.follow_up_required && visit.follow_up_date && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Follow-up Date</p>
                                                <p className="text-zinc-700 dark:text-zinc-300">
                                                    {new Date(visit.follow_up_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                        {visit.follow_up_instructions && (
                                            <div className="md:col-span-2">
                                                <p className="text-xs text-zinc-400">Follow-up Instructions</p>
                                                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                                    {visit.follow_up_instructions}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* =============================================
                ADD VISIT DIALOG - Standard Dialog (Not Full Screen)
                ============================================= */}

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent
                    className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl p-0 gap-0 bg-zinc-50 dark:bg-zinc-950"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-transparent px-6 py-4 rounded-t-3xl flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Plus className="w-5 h-5 text-primary" />
                                Record Medical Visit
                            </DialogTitle>
                            <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
                                Document a complete medical visit record
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="px-6 py-6 space-y-6">
                        {/* Visit Type & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Visit Type</label>
                                <select
                                    value={formData.visit_type}
                                    onChange={(e) => setFormData({ ...formData, visit_type: e.target.value })}
                                    className="w-full mt-1 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-transparent px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="consultation">Consultation</option>
                                    <option value="emergency">Emergency</option>
                                    <option value="follow_up">Follow-up</option>
                                    <option value="home_visit">Home Visit</option>
                                    <option value="telemedicine">Telemedicine</option>
                                    <option value="procedure">Procedure</option>
                                    <option value="general_checkup">General Checkup</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Visit Status</label>
                                <select
                                    value={formData.visit_status}
                                    onChange={(e) => setFormData({ ...formData, visit_status: e.target.value })}
                                    className="w-full mt-1 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-transparent px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="completed">Completed</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="no_show">No Show</option>
                                </select>
                            </div>
                        </div>

                        {/* Emergency */}
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-800">
                            <input
                                type="checkbox"
                                checked={formData.is_emergency}
                                onChange={(e) => setFormData({ ...formData, is_emergency: e.target.checked })}
                                className="w-5 h-5 text-red-500 rounded focus:ring-red-500"
                            />
                            <label className="text-sm font-semibold text-red-600 dark:text-red-400">This is an Emergency Visit</label>
                        </div>

                        {formData.is_emergency && (
                            <div>
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Emergency Level</label>
                                <select
                                    value={formData.emergency_level}
                                    onChange={(e) => setFormData({ ...formData, emergency_level: e.target.value })}
                                    className="w-full mt-1 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-transparent px-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="">Select level</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        )}

                        {/* Vitals */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Vitals</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-500">Blood Pressure</label>
                                    <Input
                                        placeholder="120/80"
                                        value={formData.blood_pressure}
                                        onChange={(e) => setFormData({ ...formData, blood_pressure: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Heart Rate (bpm)</label>
                                    <Input
                                        placeholder="72"
                                        value={formData.heart_rate}
                                        onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Temperature (°C)</label>
                                    <Input
                                        placeholder="36.5"
                                        value={formData.temperature}
                                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">O₂ Saturation (%)</label>
                                    <Input
                                        placeholder="98"
                                        value={formData.oxygen_saturation}
                                        onChange={(e) => setFormData({ ...formData, oxygen_saturation: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Weight (kg)</label>
                                    <Input
                                        placeholder="70"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Height (cm)</label>
                                    <Input
                                        placeholder="175"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Respiratory Rate</label>
                                    <Input
                                        placeholder="16"
                                        value={formData.respiratory_rate}
                                        onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Blood Glucose (mmol/L)</label>
                                    <Input
                                        placeholder="5.6"
                                        value={formData.blood_glucose}
                                        onChange={(e) => setFormData({ ...formData, blood_glucose: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Patient Presentation */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Patient Presentation</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                    <label className="text-xs text-zinc-500">Chief Complaint</label>
                                    <Textarea
                                        placeholder="Patient's main reason for visit..."
                                        value={formData.chief_complaint}
                                        onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-zinc-500">History of Presenting Illness</label>
                                    <Textarea
                                        placeholder="Detailed history..."
                                        value={formData.history_of_presenting_illness}
                                        onChange={(e) => setFormData({ ...formData, history_of_presenting_illness: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Symptoms (comma separated)</label>
                                    <Input
                                        placeholder="Headache, fever, cough"
                                        value={formData.symptoms}
                                        onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Duration of Symptoms</label>
                                    <Input
                                        placeholder="3 days"
                                        value={formData.duration_of_symptoms}
                                        onChange={(e) => setFormData({ ...formData, duration_of_symptoms: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Severity</label>
                                    <select
                                        value={formData.severity}
                                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                        className="w-full mt-1 h-11 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-transparent px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="mild">Mild</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="severe">Severe</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Examination */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Examination</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                    <label className="text-xs text-zinc-500">Physical Examination</label>
                                    <Textarea
                                        placeholder="Physical exam findings..."
                                        value={formData.physical_examination}
                                        onChange={(e) => setFormData({ ...formData, physical_examination: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Systems Examined</label>
                                    <Input
                                        placeholder="CVS, Respiratory, Abdominal"
                                        value={formData.systems_examined}
                                        onChange={(e) => setFormData({ ...formData, systems_examined: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Findings</label>
                                    <Input
                                        placeholder="Normal, abnormal..."
                                        value={formData.findings}
                                        onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Investigations */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Investigations</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-500">Investigations Ordered</label>
                                    <Input
                                        placeholder="CBC, ECG, X-ray"
                                        value={formData.investigations_ordered}
                                        onChange={(e) => setFormData({ ...formData, investigations_ordered: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Lab Tests Done</label>
                                    <Input
                                        placeholder="Blood culture, Urinalysis"
                                        value={formData.lab_tests_done}
                                        onChange={(e) => setFormData({ ...formData, lab_tests_done: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Imaging Done</label>
                                    <Input
                                        placeholder="CT, MRI, Ultrasound"
                                        value={formData.imaging_done}
                                        onChange={(e) => setFormData({ ...formData, imaging_done: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Diagnosis */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Diagnosis</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-500">Primary Diagnosis</label>
                                    <Input
                                        placeholder="Main diagnosis"
                                        value={formData.primary_diagnosis}
                                        onChange={(e) => setFormData({ ...formData, primary_diagnosis: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Secondary Diagnosis</label>
                                    <Input
                                        placeholder="Secondary diagnoses"
                                        value={formData.secondary_diagnosis}
                                        onChange={(e) => setFormData({ ...formData, secondary_diagnosis: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Differential Diagnosis</label>
                                    <Input
                                        placeholder="Other possible diagnoses"
                                        value={formData.differential_diagnosis}
                                        onChange={(e) => setFormData({ ...formData, differential_diagnosis: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Treatment */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Treatment</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                    <label className="text-xs text-zinc-500">Treatment Plan</label>
                                    <Textarea
                                        placeholder="Treatment plan..."
                                        value={formData.treatment_plan}
                                        onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-zinc-500">Medications Prescribed (name, dosage, frequency, duration)</label>
                                    <Textarea
                                        placeholder="Amoxicillin, 500mg, TID, 7 days"
                                        value={formData.medications_prescribed}
                                        onChange={(e) => setFormData({ ...formData, medications_prescribed: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Procedures Performed</label>
                                    <Input
                                        placeholder="Wound debridement, IV insertion"
                                        value={formData.procedures_performed}
                                        onChange={(e) => setFormData({ ...formData, procedures_performed: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Referrals Made</label>
                                    <Input
                                        placeholder="Cardiology, Orthopedics"
                                        value={formData.referrals_made}
                                        onChange={(e) => setFormData({ ...formData, referrals_made: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Follow-up */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Follow-up</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.follow_up_required}
                                        onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
                                        className="w-5 h-5 text-primary rounded focus:ring-primary"
                                    />
                                    <label className="text-sm text-zinc-700 dark:text-zinc-300">Follow-up Required</label>
                                </div>
                                {formData.follow_up_required && (
                                    <div>
                                        <label className="text-xs text-zinc-500">Follow-up Date</label>
                                        <Input
                                            type="date"
                                            value={formData.follow_up_date}
                                            onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                )}
                                <div className="md:col-span-2">
                                    <label className="text-xs text-zinc-500">Follow-up Instructions</label>
                                    <Textarea
                                        placeholder="Follow-up instructions..."
                                        value={formData.follow_up_instructions}
                                        onChange={(e) => setFormData({ ...formData, follow_up_instructions: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Outcome */}
                        <div>
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Outcome</label>
                            <select
                                value={formData.outcome}
                                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                                className="w-full mt-1 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-transparent px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Select outcome</option>
                                <option value="improved">Improved</option>
                                <option value="stable">Stable</option>
                                <option value="worsened">Worsened</option>
                                <option value="referred">Referred</option>
                                <option value="admitted">Admitted</option>
                                <option value="discharged">Discharged</option>
                            </select>
                        </div>

                        {/* Clinical Notes */}
                        <div>
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Clinical Notes</label>
                            <Textarea
                                placeholder="Additional clinical notes..."
                                value={formData.clinical_notes}
                                onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
                                className="min-h-[80px] rounded-xl"
                            />
                        </div>

                        {/* Patient Education */}
                        <div>
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Patient Education Provided</label>
                            <Textarea
                                placeholder="What was discussed with the patient..."
                                value={formData.patient_education_provided}
                                onChange={(e) => setFormData({ ...formData, patient_education_provided: e.target.value })}
                                className="min-h-[60px] rounded-xl"
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Visit Duration (minutes)</label>
                            <Input
                                type="number"
                                placeholder="30"
                                value={formData.visit_duration_minutes}
                                onChange={(e) => setFormData({ ...formData, visit_duration_minutes: e.target.value })}
                                className="h-11 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-transparent px-6 py-4 rounded-b-3xl gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowAddDialog(false)}
                            className="rounded-2xl h-12 px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddVisit}
                            disabled={saving}
                            className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/20"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Record Visit
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =============================================
                VISIT DETAIL DIALOG - Standard Dialog
                ============================================= */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl p-0 gap-0">
                    {selectedVisit && (
                        <>
                            {/* Header */}
                            <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-transparent px-6 py-4 rounded-t-3xl flex items-center justify-between">
                                <div>
                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                        <FileText className="w-5 h-5 text-primary" />
                                        Visit Details
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Complete medical visit record
                                    </DialogDescription>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-6 space-y-6">
                                {/* Header */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        {getVisitTypeIcon(selectedVisit.visit_type)}
                                        <Badge className="bg-primary/10 text-primary rounded-full">
                                            {selectedVisit.visit_type.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </div>
                                    <Badge className={`${getStatusColor(selectedVisit.visit_status)} rounded-full`}>
                                        {selectedVisit.visit_status.replace('_', ' ')}
                                    </Badge>
                                    {selectedVisit.is_emergency && (
                                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full animate-pulse">
                                            ⚡ Emergency
                                        </Badge>
                                    )}
                                    <span className="text-sm text-zinc-500 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(selectedVisit.visit_date).toLocaleString()}
                                    </span>
                                    <Badge variant="outline" className="rounded-full">
                                        <User className="w-3 h-3 mr-1" />
                                        Dr. {selectedVisit.provider?.full_name || 'Unknown'}
                                    </Badge>
                                    {getOutcomeBadge(selectedVisit.outcome)}
                                </div>

                                {/* Vitals */}
                                {selectedVisit.vitals && Object.keys(selectedVisit.vitals).some(key => selectedVisit.vitals[key]) && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Vitals</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {selectedVisit.vitals.blood_pressure && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Blood Pressure</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedVisit.vitals.blood_pressure}</p>
                                                </div>
                                            )}
                                            {selectedVisit.vitals.heart_rate && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Heart Rate</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedVisit.vitals.heart_rate}</p>
                                                </div>
                                            )}
                                            {selectedVisit.vitals.temperature && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Temperature</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedVisit.vitals.temperature}</p>
                                                </div>
                                            )}
                                            {selectedVisit.vitals.oxygen_saturation && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">O₂ Saturation</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedVisit.vitals.oxygen_saturation}</p>
                                                </div>
                                            )}
                                            {selectedVisit.vitals.weight && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Weight</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedVisit.vitals.weight}</p>
                                                </div>
                                            )}
                                            {selectedVisit.vitals.height && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Height</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedVisit.vitals.height}</p>
                                                </div>
                                            )}
                                            {selectedVisit.vitals.respiratory_rate && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Respiratory Rate</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedVisit.vitals.respiratory_rate}</p>
                                                </div>
                                            )}
                                            {selectedVisit.vitals.blood_glucose && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Blood Glucose</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedVisit.vitals.blood_glucose}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Chief Complaint & History */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedVisit.chief_complaint && (
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-zinc-400">Chief Complaint</p>
                                            <p className="text-base font-medium text-zinc-900 dark:text-white">{selectedVisit.chief_complaint}</p>
                                        </div>
                                    )}
                                    {selectedVisit.history_of_presenting_illness && (
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-zinc-400">History of Presenting Illness</p>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                                {selectedVisit.history_of_presenting_illness}
                                            </p>
                                        </div>
                                    )}
                                    {selectedVisit.symptoms && selectedVisit.symptoms.length > 0 && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Symptoms</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedVisit.symptoms.map((s, i) => (
                                                    <Badge key={i} variant="secondary" className="rounded-full">{s}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedVisit.duration_of_symptoms && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Duration</p>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedVisit.duration_of_symptoms}</p>
                                        </div>
                                    )}
                                    {selectedVisit.severity && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Severity</p>
                                            <Badge className={`${getSeverityColor(selectedVisit.severity)} rounded-full`}>
                                                {selectedVisit.severity}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Physical Examination */}
                                {selectedVisit.physical_examination && (
                                    <div>
                                        <p className="text-xs text-zinc-400">Physical Examination</p>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                            {selectedVisit.physical_examination}
                                        </p>
                                    </div>
                                )}

                                {/* Systems Examined & Findings */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedVisit.systems_examined && selectedVisit.systems_examined.length > 0 && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Systems Examined</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedVisit.systems_examined.map((s, i) => (
                                                    <Badge key={i} variant="secondary" className="rounded-full">{s}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedVisit.findings && selectedVisit.findings.length > 0 && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Findings</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedVisit.findings.map((f, i) => (
                                                    <Badge key={i} variant="secondary" className="rounded-full">{f}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Investigations */}
                                {(selectedVisit.investigations_ordered?.length > 0 ||
                                    selectedVisit.lab_tests_done?.length > 0 ||
                                    selectedVisit.imaging_done?.length > 0) && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Investigations</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                                {selectedVisit.investigations_ordered?.length > 0 && (
                                                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                        <p className="text-xs text-zinc-400">Ordered</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {selectedVisit.investigations_ordered.map((i, idx) => (
                                                                <Badge key={idx} variant="secondary" className="rounded-full">{i}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedVisit.lab_tests_done?.length > 0 && (
                                                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                        <p className="text-xs text-zinc-400">Lab Tests</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {selectedVisit.lab_tests_done.map((l, idx) => (
                                                                <Badge key={idx} variant="secondary" className="rounded-full">{l}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedVisit.imaging_done?.length > 0 && (
                                                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                        <p className="text-xs text-zinc-400">Imaging</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {selectedVisit.imaging_done.map((i, idx) => (
                                                                <Badge key={idx} variant="secondary" className="rounded-full">{i}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Diagnosis */}
                                <div>
                                    <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Diagnosis</h4>
                                    <div className="space-y-2 mt-2">
                                        {selectedVisit.primary_diagnosis && (
                                            <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                <p className="text-xs text-zinc-400">Primary</p>
                                                <p className="text-base font-bold text-primary">{selectedVisit.primary_diagnosis}</p>
                                            </div>
                                        )}
                                        {selectedVisit.secondary_diagnosis?.length > 0 && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Secondary</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {selectedVisit.secondary_diagnosis.map((d, i) => (
                                                        <Badge key={i} variant="secondary" className="rounded-full">{d}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedVisit.differential_diagnosis?.length > 0 && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Differential</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {selectedVisit.differential_diagnosis.map((d, i) => (
                                                        <Badge key={i} variant="secondary" className="rounded-full">{d}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Treatment */}
                                <div>
                                    <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Treatment</h4>
                                    <div className="space-y-3 mt-2">
                                        {selectedVisit.treatment_plan && (
                                            <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                <p className="text-xs text-zinc-400">Treatment Plan</p>
                                                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                                    {selectedVisit.treatment_plan}
                                                </p>
                                            </div>
                                        )}
                                        {selectedVisit.medications_prescribed && Array.isArray(selectedVisit.medications_prescribed) && selectedVisit.medications_prescribed.length > 0 && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Medications Prescribed</p>
                                                <div className="space-y-2 mt-1">
                                                    {selectedVisit.medications_prescribed.map((med, i) => (
                                                        <div key={i} className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                            <p className="font-medium text-zinc-900 dark:text-white">{med.name}</p>
                                                            <p className="text-xs text-zinc-500">{med.dosage} • {med.frequency} • {med.duration}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedVisit.procedures_performed?.length > 0 && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Procedures Performed</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {selectedVisit.procedures_performed.map((p, i) => (
                                                        <Badge key={i} variant="secondary" className="rounded-full">{p}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedVisit.referrals_made?.length > 0 && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Referrals Made</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {selectedVisit.referrals_made.map((r, i) => (
                                                        <Badge key={i} variant="secondary" className="rounded-full">{r}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Follow-up */}
                                {selectedVisit.follow_up_required && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Follow-up</h4>
                                        <div className="space-y-2 mt-2">
                                            {selectedVisit.follow_up_date && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Date</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                                        {new Date(selectedVisit.follow_up_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedVisit.follow_up_instructions && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Instructions</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                                        {selectedVisit.follow_up_instructions}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Outcome */}
                                {selectedVisit.outcome && (
                                    <div>
                                        <p className="text-xs text-zinc-400">Outcome</p>
                                        <div className="mt-1">
                                            {getOutcomeBadge(selectedVisit.outcome)}
                                            {selectedVisit.outcome_notes && (
                                                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
                                                    {selectedVisit.outcome_notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Clinical Notes */}
                                {selectedVisit.clinical_notes && (
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                        <p className="text-xs text-zinc-400">Clinical Notes</p>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                            {selectedVisit.clinical_notes}
                                        </p>
                                    </div>
                                )}

                                {/* Patient Education */}
                                {selectedVisit.patient_education_provided && (
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                        <p className="text-xs text-zinc-400">Patient Education</p>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                            {selectedVisit.patient_education_provided}
                                        </p>
                                    </div>
                                )}

                                {/* Duration */}
                                {selectedVisit.visit_duration_minutes && (
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                        <p className="text-xs text-zinc-400">Visit Duration</p>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedVisit.visit_duration_minutes} minutes</p>
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="text-xs text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                                    <p>Created: {new Date(selectedVisit.created_at).toLocaleString()}</p>
                                    <p>Last Updated: {new Date(selectedVisit.updated_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <DialogFooter className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-transparent px-6 py-4 rounded-b-3xl">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDetailDialog(false)}
                                    className="rounded-2xl h-12 px-6"
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};