import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    ClipboardList,
    Plus,
    EyeIcon,
    Loader2,
    BadgeCheck,
    AlertTriangle,
    Calendar,
    Clock,
    User,
    Pill,
    Activity,
    HeartPulse,
    Thermometer,
    Droplet,
    Syringe,
    Scissors,
    Bandage,
    FileText,
    ChevronDown,
    ChevronUp,
    X,
    Save,
    Edit,
    Trash2,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface NursingNote {
    id: string;
    patient_id: string;
    nurse_id: string;
    assessment_date: string;
    assessment_type: string;
    vitals: any;
    general_appearance: string;
    mental_status: string;
    pain_assessment: string;
    pain_scale: number;
    skin_condition: string;
    wound_assessment: string;
    mobility_status: string;
    fall_risk: boolean;
    adl_assessment: any;
    interventions_performed: string[];
    medications_given: any;
    treatments_given: string[];
    education_provided: string;
    patient_response: string;
    family_present: boolean;
    family_education_provided: string;
    care_plan_updates: string;
    next_visit_plan: string;
    safety_concerns: string;
    safety_measures_taken: string;
    incident_reported: boolean;
    incident_details: string;
    provider_communication: string;
    family_communication: string;
    clinical_notes: string;
    follow_up_instructions: string;
    created_at: string;
    updated_at: string;
    nurse: {
        full_name: string;
    };
}

interface MedicalHistoryProps {
    patientId: string;
    isProvider: boolean;
    isAdmin: boolean;
    isPinVerified: boolean;
    canEdit: boolean;
}

export const MedicalHistory = ({
    patientId,
    isProvider,
    isAdmin,
    isPinVerified,
    canEdit
}: MedicalHistoryProps) => {
    const { toast } = useToast();
    const [nursingNotes, setNursingNotes] = useState<NursingNote[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [selectedNote, setSelectedNote] = useState<NursingNote | null>(null);
    const [saving, setSaving] = useState(false);
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

    // Form state for adding nursing note
    const [formData, setFormData] = useState({
        assessment_type: "routine",
        general_appearance: "",
        mental_status: "",
        pain_assessment: "",
        pain_scale: "",
        skin_condition: "",
        wound_assessment: "",
        mobility_status: "",
        fall_risk: false,
        clinical_notes: "",
        interventions_performed: "",
        treatments_given: "",
        education_provided: "",
        patient_response: "",
        family_present: false,
        family_education_provided: "",
        safety_concerns: "",
        safety_measures_taken: "",
        incident_reported: false,
        incident_details: "",
        provider_communication: "",
        family_communication: "",
        follow_up_instructions: "",
        blood_pressure: "",
        heart_rate: "",
        temperature: "",
        oxygen_saturation: "",
        weight: "",
        height: "",
    });

    useEffect(() => {
        if (patientId) {
            fetchNursingNotes();
        }
    }, [patientId]);

    const fetchNursingNotes = useCallback(async () => {
        try {
            setLoading(true);

            // Check cache first
            const cacheKey = `nursing_notes_${patientId}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 30000) {
                    setNursingNotes(parsed.data);
                    setLoading(false);
                    return;
                }
            }

            const { data, error } = await supabase
                .from("nursing_notes")
                .select(`
                    *,
                    nurse:nurse_id (
                        full_name
                    )
                `)
                .eq("patient_id", patientId)
                .order("assessment_date", { ascending: false });

            if (error) throw error;

            sessionStorage.setItem(cacheKey, JSON.stringify({
                data: data || [],
                timestamp: Date.now()
            }));

            setNursingNotes(data || []);
        } catch (err: any) {
            console.error("Error fetching nursing notes:", err);
            toast({
                title: "Error",
                description: "Failed to load nursing notes",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [patientId, toast]);

    const toggleNoteExpand = useCallback((noteId: string) => {
        setExpandedNotes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(noteId)) {
                newSet.delete(noteId);
            } else {
                newSet.add(noteId);
            }
            return newSet;
        });
    }, []);

    const handleAddNursingNote = useCallback(async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    title: "Authentication Required",
                    description: "Please log in to add nursing notes.",
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
            };

            const interventions = formData.interventions_performed
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);
            const treatments = formData.treatments_given
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);

            const { error } = await supabase
                .from("nursing_notes")
                .insert({
                    patient_id: patientId,
                    nurse_id: user.id,
                    assessment_type: formData.assessment_type,
                    general_appearance: formData.general_appearance,
                    mental_status: formData.mental_status,
                    pain_assessment: formData.pain_assessment,
                    pain_scale: formData.pain_scale ? parseInt(formData.pain_scale) : null,
                    skin_condition: formData.skin_condition,
                    wound_assessment: formData.wound_assessment,
                    mobility_status: formData.mobility_status,
                    fall_risk: formData.fall_risk,
                    vitals: vitals,
                    clinical_notes: formData.clinical_notes,
                    interventions_performed: interventions,
                    treatments_given: treatments,
                    education_provided: formData.education_provided,
                    patient_response: formData.patient_response,
                    family_present: formData.family_present,
                    family_education_provided: formData.family_education_provided,
                    safety_concerns: formData.safety_concerns,
                    safety_measures_taken: formData.safety_measures_taken,
                    incident_reported: formData.incident_reported,
                    incident_details: formData.incident_details,
                    provider_communication: formData.provider_communication,
                    family_communication: formData.family_communication,
                    follow_up_instructions: formData.follow_up_instructions,
                });

            if (error) throw error;

            sessionStorage.removeItem(`nursing_notes_${patientId}`);

            toast({
                title: "Nursing Note Added",
                description: "The nursing note has been recorded successfully.",
            });

            setFormData({
                assessment_type: "routine",
                general_appearance: "",
                mental_status: "",
                pain_assessment: "",
                pain_scale: "",
                skin_condition: "",
                wound_assessment: "",
                mobility_status: "",
                fall_risk: false,
                clinical_notes: "",
                interventions_performed: "",
                treatments_given: "",
                education_provided: "",
                patient_response: "",
                family_present: false,
                family_education_provided: "",
                safety_concerns: "",
                safety_measures_taken: "",
                incident_reported: false,
                incident_details: "",
                provider_communication: "",
                family_communication: "",
                follow_up_instructions: "",
                blood_pressure: "",
                heart_rate: "",
                temperature: "",
                oxygen_saturation: "",
                weight: "",
                height: "",
            });
            setShowAddDialog(false);
            await fetchNursingNotes();

        } catch (err: any) {
            console.error("Error adding nursing note:", err);
            toast({
                title: "Error",
                description: err.message || "Failed to add nursing note",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    }, [formData, patientId, toast, fetchNursingNotes]);

    const getStatusColor = useCallback((type: string) => {
        switch (type) {
            case 'emergency': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'initial': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'follow_up': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'discharge': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
        }
    }, []);

    const getMentalStatusBadge = useCallback((status: string) => {
        switch (status) {
            case 'alert': return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">Alert</Badge>;
            case 'confused': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">Confused</Badge>;
            case 'lethargic': return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">Lethargic</Badge>;
            case 'unresponsive': return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Unresponsive</Badge>;
            case 'agitated': return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">Agitated</Badge>;
            case 'anxious': return <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full">Anxious</Badge>;
            default: return <Badge variant="outline" className="rounded-full">Unknown</Badge>;
        }
    }, []);

    // Memoized notes list
    const noteItems = useMemo(() => {
        return nursingNotes.map((note) => ({
            ...note,
            isExpanded: expandedNotes.has(note.id)
        }));
    }, [nursingNotes, expandedNotes]);

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
                        <ClipboardList className="w-5 h-5 text-primary" />
                        Nursing Cardex
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {nursingNotes.length} nursing note{nursingNotes.length !== 1 ? 's' : ''} recorded
                    </p>
                </div>
                {(isProvider || isAdmin) && isPinVerified && (
                    <Button
                        size="sm"
                        className="gap-2 rounded-2xl shadow-lg shadow-primary/20"
                        onClick={() => setShowAddDialog(true)}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Note</span>
                    </Button>
                )}
            </div>

            {/* Nursing Notes List - Native Android Cards */}
            {nursingNotes.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-100 dark:border-transparent shadow-sm">
                    <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                        <ClipboardList className="w-8 h-8 text-zinc-400" />
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">No nursing notes recorded</p>
                    {(isProvider || isAdmin) && isPinVerified && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 gap-2 rounded-xl"
                            onClick={() => setShowAddDialog(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Add First Note
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {noteItems.map((note) => (
                        <div
                            key={note.id}
                            className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${note.assessment_type === 'emergency' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-primary'
                                }`}
                        >
                            {/* Compact View */}
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge className={`${getStatusColor(note.assessment_type)} rounded-full text-xs`}>
                                                {note.assessment_type || 'Routine'}
                                            </Badge>
                                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(note.assessment_date).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(note.assessment_date).toLocaleTimeString()}
                                            </span>
                                            <Badge variant="outline" className="rounded-full text-xs">
                                                <User className="w-3 h-3 mr-1" />
                                                {note.nurse?.full_name?.split(' ')[0] || 'Unknown'}
                                            </Badge>
                                            {note.fall_risk && (
                                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs">
                                                    ⚠️ Fall Risk
                                                </Badge>
                                            )}
                                            {note.incident_reported && (
                                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs">
                                                    Incident Reported
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Vitals Summary */}
                                        {note.vitals && Object.keys(note.vitals).some(key => note.vitals[key]) && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {note.vitals.blood_pressure && (
                                                    <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                                                        <span className="text-[10px] text-zinc-400">BP</span>
                                                        <span className="text-xs font-bold ml-1">{note.vitals.blood_pressure}</span>
                                                    </div>
                                                )}
                                                {note.vitals.heart_rate && (
                                                    <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                                                        <span className="text-[10px] text-zinc-400">HR</span>
                                                        <span className="text-xs font-bold ml-1">{note.vitals.heart_rate}</span>
                                                    </div>
                                                )}
                                                {note.vitals.temperature && (
                                                    <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                                                        <span className="text-[10px] text-zinc-400">Temp</span>
                                                        <span className="text-xs font-bold ml-1">{note.vitals.temperature}</span>
                                                    </div>
                                                )}
                                                {note.vitals.oxygen_saturation && (
                                                    <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                                                        <span className="text-[10px] text-zinc-400">O₂</span>
                                                        <span className="text-xs font-bold ml-1">{note.vitals.oxygen_saturation}</span>
                                                    </div>
                                                )}
                                                {note.pain_scale !== null && note.pain_scale !== undefined && (
                                                    <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                                                        <span className="text-[10px] text-zinc-400">Pain</span>
                                                        <span className="text-xs font-bold ml-1">{note.pain_scale}/10</span>
                                                    </div>
                                                )}
                                                {note.mental_status && (
                                                    <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                                                        <span className="text-[10px] text-zinc-400">Mental</span>
                                                        <span className="text-xs font-medium capitalize">{note.mental_status}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Clinical Notes Preview */}
                                        {note.clinical_notes && (
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-2">
                                                {note.clinical_notes}
                                            </p>
                                        )}

                                        {/* Interventions Tags */}
                                        {note.interventions_performed && note.interventions_performed.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {note.interventions_performed.slice(0, 3).map((intervention, i) => (
                                                    <Badge key={i} variant="secondary" className="rounded-full text-xs">
                                                        {intervention}
                                                    </Badge>
                                                ))}
                                                {note.interventions_performed.length > 3 && (
                                                    <Badge variant="secondary" className="rounded-full text-xs">
                                                        +{note.interventions_performed.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
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
                                                        setSelectedNote(note);
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
                                                onClick={() => toggleNoteExpand(note.id)}
                                            >
                                                {note.isExpanded ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <span className="text-[10px] text-zinc-400">
                                            {note.nurse?.full_name?.split(' ')[0] || 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded View */}
                            {note.isExpanded && (
                                <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-800/30">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        {note.general_appearance && (
                                            <div>
                                                <p className="text-xs text-zinc-400">General Appearance</p>
                                                <p className="text-zinc-700 dark:text-zinc-300">{note.general_appearance}</p>
                                            </div>
                                        )}
                                        {note.mental_status && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Mental Status</p>
                                                {getMentalStatusBadge(note.mental_status)}
                                            </div>
                                        )}
                                        {note.pain_assessment && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Pain Assessment</p>
                                                <p className="text-zinc-700 dark:text-zinc-300">{note.pain_assessment}</p>
                                            </div>
                                        )}
                                        {note.skin_condition && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Skin Condition</p>
                                                <p className="text-zinc-700 dark:text-zinc-300">{note.skin_condition}</p>
                                            </div>
                                        )}
                                        {note.wound_assessment && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Wound Assessment</p>
                                                <p className="text-zinc-700 dark:text-zinc-300">{note.wound_assessment}</p>
                                            </div>
                                        )}
                                        {note.mobility_status && (
                                            <div>
                                                <p className="text-xs text-zinc-400">Mobility Status</p>
                                                <p className="text-zinc-700 dark:text-zinc-300 capitalize">{note.mobility_status}</p>
                                            </div>
                                        )}
                                        {note.follow_up_instructions && (
                                            <div className="md:col-span-2">
                                                <p className="text-xs text-zinc-400">Follow-up Instructions</p>
                                                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{note.follow_up_instructions}</p>
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
                ADD NURSING NOTE DIALOG - Standard Dialog
                ============================================= */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl p-0 gap-0 bg-zinc-50 dark:bg-zinc-950">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-transparent px-6 py-4 rounded-t-3xl flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Plus className="w-5 h-5 text-primary" />
                                Add Nursing Note
                            </DialogTitle>
                            <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
                                Record a comprehensive nursing assessment and care note
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="px-6 py-6 space-y-6">
                        {/* Assessment Type */}
                        <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Assessment Type
                            </label>
                            <select
                                value={formData.assessment_type}
                                onChange={(e) => setFormData({ ...formData, assessment_type: e.target.value })}
                                className="w-full mt-1 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-transparent px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="routine">Routine</option>
                                <option value="initial">Initial</option>
                                <option value="follow_up">Follow-up</option>
                                <option value="emergency">Emergency</option>
                                <option value="discharge">Discharge</option>
                            </select>
                        </div>

                        {/* Vitals */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Vitals</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                            </div>
                        </div>

                        {/* Assessment */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Assessment</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-500">General Appearance</label>
                                    <Textarea
                                        placeholder="Patient appears..."
                                        value={formData.general_appearance}
                                        onChange={(e) => setFormData({ ...formData, general_appearance: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Mental Status</label>
                                    <select
                                        value={formData.mental_status}
                                        onChange={(e) => setFormData({ ...formData, mental_status: e.target.value })}
                                        className="w-full mt-1 h-11 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-transparent px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Select</option>
                                        <option value="alert">Alert</option>
                                        <option value="confused">Confused</option>
                                        <option value="lethargic">Lethargic</option>
                                        <option value="unresponsive">Unresponsive</option>
                                        <option value="agitated">Agitated</option>
                                        <option value="anxious">Anxious</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Pain Assessment</label>
                                    <Input
                                        placeholder="Describe pain..."
                                        value={formData.pain_assessment}
                                        onChange={(e) => setFormData({ ...formData, pain_assessment: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Pain Scale (0-10)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="10"
                                        placeholder="3"
                                        value={formData.pain_scale}
                                        onChange={(e) => setFormData({ ...formData, pain_scale: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Skin Condition</label>
                                    <Input
                                        placeholder="Skin condition..."
                                        value={formData.skin_condition}
                                        onChange={(e) => setFormData({ ...formData, skin_condition: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Wound Assessment</label>
                                    <Input
                                        placeholder="Wound description..."
                                        value={formData.wound_assessment}
                                        onChange={(e) => setFormData({ ...formData, wound_assessment: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Mobility Status</label>
                                    <select
                                        value={formData.mobility_status}
                                        onChange={(e) => setFormData({ ...formData, mobility_status: e.target.value })}
                                        className="w-full mt-1 h-11 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-transparent px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Select</option>
                                        <option value="independent">Independent</option>
                                        <option value="assisted">Assisted</option>
                                        <option value="wheelchair">Wheelchair</option>
                                        <option value="bedridden">Bedridden</option>
                                        <option value="fall_risk">Fall Risk</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.fall_risk}
                                        onChange={(e) => setFormData({ ...formData, fall_risk: e.target.checked })}
                                        className="w-5 h-5 text-primary rounded focus:ring-primary"
                                    />
                                    <label className="text-sm text-zinc-700 dark:text-zinc-300">Fall Risk</label>
                                </div>
                            </div>
                        </div>

                        {/* Clinical Notes */}
                        <div>
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Clinical Notes</label>
                            <Textarea
                                placeholder="Detailed clinical notes..."
                                value={formData.clinical_notes}
                                onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
                                className="min-h-[100px] rounded-xl"
                            />
                        </div>

                        {/* Interventions & Treatments */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Interventions Performed</label>
                                <Input
                                    placeholder="Comma separated list"
                                    value={formData.interventions_performed}
                                    onChange={(e) => setFormData({ ...formData, interventions_performed: e.target.value })}
                                    className="h-11 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Treatments Given</label>
                                <Input
                                    placeholder="Comma separated list"
                                    value={formData.treatments_given}
                                    onChange={(e) => setFormData({ ...formData, treatments_given: e.target.value })}
                                    className="h-11 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Patient Education */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Patient Education</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-500">Education Provided</label>
                                    <Textarea
                                        placeholder="What was taught..."
                                        value={formData.education_provided}
                                        onChange={(e) => setFormData({ ...formData, education_provided: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Patient Response</label>
                                    <Textarea
                                        placeholder="How did patient respond..."
                                        value={formData.patient_response}
                                        onChange={(e) => setFormData({ ...formData, patient_response: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Family Education</label>
                                    <Textarea
                                        placeholder="Family education provided..."
                                        value={formData.family_education_provided}
                                        onChange={(e) => setFormData({ ...formData, family_education_provided: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.family_present}
                                        onChange={(e) => setFormData({ ...formData, family_present: e.target.checked })}
                                        className="w-5 h-5 text-primary rounded focus:ring-primary"
                                    />
                                    <label className="text-sm text-zinc-700 dark:text-zinc-300">Family Present</label>
                                </div>
                            </div>
                        </div>

                        {/* Safety & Communication */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Safety & Communication</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-500">Safety Concerns</label>
                                    <Textarea
                                        placeholder="Any safety concerns..."
                                        value={formData.safety_concerns}
                                        onChange={(e) => setFormData({ ...formData, safety_concerns: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Safety Measures Taken</label>
                                    <Textarea
                                        placeholder="Measures taken..."
                                        value={formData.safety_measures_taken}
                                        onChange={(e) => setFormData({ ...formData, safety_measures_taken: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Provider Communication</label>
                                    <Textarea
                                        placeholder="Communication with provider..."
                                        value={formData.provider_communication}
                                        onChange={(e) => setFormData({ ...formData, provider_communication: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500">Family Communication</label>
                                    <Textarea
                                        placeholder="Communication with family..."
                                        value={formData.family_communication}
                                        onChange={(e) => setFormData({ ...formData, family_communication: e.target.value })}
                                        className="min-h-[60px] rounded-xl"
                                    />
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.incident_reported}
                                        onChange={(e) => setFormData({ ...formData, incident_reported: e.target.checked })}
                                        className="w-5 h-5 text-red-500 rounded focus:ring-red-500"
                                    />
                                    <label className="text-sm text-zinc-700 dark:text-zinc-300">Incident Reported</label>
                                </div>
                                {formData.incident_reported && (
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-zinc-500">Incident Details</label>
                                        <Textarea
                                            placeholder="Describe the incident..."
                                            value={formData.incident_details}
                                            onChange={(e) => setFormData({ ...formData, incident_details: e.target.value })}
                                            className="min-h-[60px] rounded-xl"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Follow-up */}
                        <div>
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Follow-up Instructions</label>
                            <Textarea
                                placeholder="Follow-up instructions..."
                                value={formData.follow_up_instructions}
                                onChange={(e) => setFormData({ ...formData, follow_up_instructions: e.target.value })}
                                className="min-h-[60px] rounded-xl"
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
                            onClick={handleAddNursingNote}
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
                                    Save Note
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =============================================
                NURSING NOTE DETAIL DIALOG - Standard Dialog
                ============================================= */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl p-0 gap-0 bg-zinc-50 dark:bg-zinc-950">
                    {selectedNote && (
                        <>
                            {/* Header */}
                            <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-transparent px-6 py-4 rounded-t-3xl flex items-center justify-between">
                                <div>
                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                        <FileText className="w-5 h-5 text-primary" />
                                        Nursing Note Details
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Complete nursing assessment record
                                    </DialogDescription>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-6 space-y-6">
                                {/* Header */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={`${getStatusColor(selectedNote.assessment_type)} rounded-full`}>
                                        {selectedNote.assessment_type || 'Routine'}
                                    </Badge>
                                    <span className="text-sm text-zinc-500 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(selectedNote.assessment_date).toLocaleString()}
                                    </span>
                                    <Badge variant="outline" className="rounded-full">
                                        <User className="w-3 h-3 mr-1" />
                                        {selectedNote.nurse?.full_name || 'Unknown'}
                                    </Badge>
                                    {selectedNote.fall_risk && (
                                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                            ⚠️ Fall Risk
                                        </Badge>
                                    )}
                                    {selectedNote.incident_reported && (
                                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                                            Incident Reported
                                        </Badge>
                                    )}
                                </div>

                                {/* Vitals */}
                                {selectedNote.vitals && Object.keys(selectedNote.vitals).some(key => selectedNote.vitals[key]) && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Vitals</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {selectedNote.vitals.blood_pressure && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Blood Pressure</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedNote.vitals.blood_pressure}</p>
                                                </div>
                                            )}
                                            {selectedNote.vitals.heart_rate && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Heart Rate</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedNote.vitals.heart_rate}</p>
                                                </div>
                                            )}
                                            {selectedNote.vitals.temperature && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Temperature</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedNote.vitals.temperature}</p>
                                                </div>
                                            )}
                                            {selectedNote.vitals.oxygen_saturation && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">O₂ Saturation</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedNote.vitals.oxygen_saturation}</p>
                                                </div>
                                            )}
                                            {selectedNote.vitals.weight && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Weight</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedNote.vitals.weight}</p>
                                                </div>
                                            )}
                                            {selectedNote.vitals.height && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Height</p>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedNote.vitals.height}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Assessment Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedNote.general_appearance && (
                                        <div>
                                            <p className="text-xs text-zinc-400">General Appearance</p>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedNote.general_appearance}</p>
                                        </div>
                                    )}
                                    {selectedNote.mental_status && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Mental Status</p>
                                            {getMentalStatusBadge(selectedNote.mental_status)}
                                        </div>
                                    )}
                                    {selectedNote.pain_assessment && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Pain Assessment</p>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedNote.pain_assessment}</p>
                                        </div>
                                    )}
                                    {selectedNote.pain_scale !== null && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Pain Scale</p>
                                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{selectedNote.pain_scale}/10</p>
                                        </div>
                                    )}
                                    {selectedNote.skin_condition && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Skin Condition</p>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedNote.skin_condition}</p>
                                        </div>
                                    )}
                                    {selectedNote.wound_assessment && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Wound Assessment</p>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedNote.wound_assessment}</p>
                                        </div>
                                    )}
                                    {selectedNote.mobility_status && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Mobility Status</p>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">{selectedNote.mobility_status}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Clinical Notes */}
                                {selectedNote.clinical_notes && (
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                        <p className="text-xs text-zinc-400">Clinical Notes</p>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{selectedNote.clinical_notes}</p>
                                    </div>
                                )}

                                {/* Interventions & Treatments */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedNote.interventions_performed && selectedNote.interventions_performed.length > 0 && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Interventions Performed</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {selectedNote.interventions_performed.map((item, i) => (
                                                    <Badge key={i} variant="secondary" className="rounded-full">{item}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedNote.treatments_given && selectedNote.treatments_given.length > 0 && (
                                        <div>
                                            <p className="text-xs text-zinc-400">Treatments Given</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {selectedNote.treatments_given.map((item, i) => (
                                                    <Badge key={i} variant="secondary" className="rounded-full">{item}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Patient Education */}
                                {(selectedNote.education_provided || selectedNote.patient_response || selectedNote.family_education_provided) && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Patient Education</h4>
                                        <div className="space-y-3">
                                            {selectedNote.education_provided && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Education Provided</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedNote.education_provided}</p>
                                                </div>
                                            )}
                                            {selectedNote.patient_response && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Patient Response</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedNote.patient_response}</p>
                                                </div>
                                            )}
                                            {selectedNote.family_education_provided && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Family Education</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedNote.family_education_provided}</p>
                                                </div>
                                            )}
                                            {selectedNote.family_present && (
                                                <Badge variant="outline" className="rounded-full">Family Present</Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Safety */}
                                {(selectedNote.safety_concerns || selectedNote.safety_measures_taken || selectedNote.incident_reported) && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Safety</h4>
                                        <div className="space-y-3">
                                            {selectedNote.safety_concerns && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Safety Concerns</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedNote.safety_concerns}</p>
                                                </div>
                                            )}
                                            {selectedNote.safety_measures_taken && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Safety Measures Taken</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedNote.safety_measures_taken}</p>
                                                </div>
                                            )}
                                            {selectedNote.incident_reported && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Incident Details</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedNote.incident_details}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Communication */}
                                {(selectedNote.provider_communication || selectedNote.family_communication) && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Communication</h4>
                                        <div className="space-y-3">
                                            {selectedNote.provider_communication && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Provider Communication</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedNote.provider_communication}</p>
                                                </div>
                                            )}
                                            {selectedNote.family_communication && (
                                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                                    <p className="text-xs text-zinc-400">Family Communication</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedNote.family_communication}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Follow-up */}
                                {selectedNote.follow_up_instructions && (
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-transparent shadow-sm">
                                        <p className="text-xs text-zinc-400">Follow-up Instructions</p>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{selectedNote.follow_up_instructions}</p>
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="text-xs text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                                    <p>Created: {new Date(selectedNote.created_at).toLocaleString()}</p>
                                    <p>Last Updated: {new Date(selectedNote.updated_at).toLocaleString()}</p>
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