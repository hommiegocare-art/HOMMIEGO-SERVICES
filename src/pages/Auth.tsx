import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Briefcase,
  Mail,
  Lock,
  Phone,
  MapPin,
  Loader2,
  ShieldCheck,
  ChevronLeft,
  Users,
  Building2,
  Home,
  Heart,
  Plus,
  X,
  Calendar,
  Stethoscope,
  BadgeCheck,
  FileText
} from "lucide-react";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const backgrounds = [
  "/background1.png",
  "/background2.png",
  "/background3.png",
  "/background4.png",
  "/background5.png",
  "/background6.png",
];

type WorkspaceType = 'individual' | 'family' | 'organization' | 'agency';
type OnboardingStep = 'role' | 'workspace' | 'profile' | 'family' | 'provider' | 'complete';

interface FamilyMember {
  id: string;
  full_name: string;
  relationship: string;
  date_of_birth: string;
  gender: string;
  phone: string;
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "signin";
  const [isSignUp, setIsSignUp] = useState(mode === "signup");

  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Onboarding state
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('role');
  const [selectedWorkspaceType, setSelectedWorkspaceType] = useState<WorkspaceType | null>(null);
  const [userData, setUserData] = useState({
    full_name: "",
    phone_number: "",
    country: "Kenya",
    county: "",
    city: "",
    date_of_birth: "",
    gender: "",
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [currentFamilyMember, setCurrentFamilyMember] = useState<Partial<FamilyMember>>({});
  const [showFamilyForm, setShowFamilyForm] = useState(false);

  // Provider specific
  const [providerData, setProviderData] = useState({
    professional_title: "",
    license_number: "",
    license_type: "",
    specialties: [] as string[],
    years_experience: 0,
    bio: "",
  });
  const [specialtyInput, setSpecialtyInput] = useState("");

  // Organization/Agency specific
  const [orgData, setOrgData] = useState({
    organization_name: "",
    registration_number: "",
    description: "",
    address: "",
  });

  const [currentBg, setCurrentBg] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Background rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check if user already has workspace
  useEffect(() => {
    const checkUserWorkspace = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: workspaceData } = await supabase
          .from("workspace_members")
          .select("workspace_id, role, workspaces!inner(*)")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (workspaceData?.workspaces) {
          navigate(`/dashboard/${workspaceData.workspaces.type}`);
        } else {
          // User exists but no workspace - start onboarding
          setCurrentStep('workspace');
        }
      }
    };
    checkUserWorkspace();
  }, [navigate]);

  // Auth state change handler
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Check if user has workspace
        const { data: workspaceData } = await supabase
          .from("workspace_members")
          .select("workspace_id, role, workspaces!inner(*)")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (workspaceData?.workspaces) {
          navigate(`/dashboard/${workspaceData.workspaces.type}`);
        } else {
          setCurrentStep('workspace');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // === STEP 1: ROLE SELECTION ===
  const renderRoleSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          How would you like to use HommieCare?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Choose the workspace that fits your needs
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            setSelectedWorkspaceType('individual');
            setCurrentStep('profile');
          }}
          className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-2">
            <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Individual Provider</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Offer healthcare services independently</p>
        </button>

        <button
          onClick={() => {
            setSelectedWorkspaceType('family');
            setCurrentStep('profile');
          }}
          className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-2">
            <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Family</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage care for yourself and family</p>
        </button>

        <button
          onClick={() => {
            setSelectedWorkspaceType('organization');
            setCurrentStep('profile');
          }}
          className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center mb-2">
            <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Organization</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hospital, clinic, or healthcare facility</p>
        </button>

        <button
          onClick={() => {
            setSelectedWorkspaceType('agency');
            setCurrentStep('profile');
          }}
          className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Agency</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Home care agency with multiple providers</p>
        </button>
      </div>

      <Button
        variant="ghost"
        className="w-full mt-2 text-sm text-slate-500"
        onClick={() => setCurrentStep('role')}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back
      </Button>
    </div>
  );

  // === STEP 2: PROFILE ===
  const renderProfile = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {selectedWorkspaceType === 'individual' ? 'Provider Profile' :
            selectedWorkspaceType === 'family' ? 'Family Details' :
              'Organization Details'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tell us about yourself
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name *</Label>
          <Input
            placeholder="John Doe"
            value={userData.full_name}
            onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email *</Label>
          <Input
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>

        {!isSignUp && (
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password *</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              minLength={6}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</Label>
            <Input
              placeholder="+254 700..."
              value={userData.phone_number}
              onChange={(e) => setUserData({ ...userData, phone_number: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</Label>
            <Input
              type="date"
              value={userData.date_of_birth}
              onChange={(e) => setUserData({ ...userData, date_of_birth: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Gender</Label>
            <Select
              value={userData.gender}
              onValueChange={(value) => setUserData({ ...userData, gender: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">County</Label>
            <Input
              placeholder="Nairobi"
              value={userData.county}
              onChange={(e) => setUserData({ ...userData, county: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">City</Label>
          <Input
            placeholder="Nairobi"
            value={userData.city}
            onChange={(e) => setUserData({ ...userData, city: e.target.value })}
            className="mt-1"
          />
        </div>

        {selectedWorkspaceType === 'organization' && (
          <>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Organization Name *</Label>
              <Input
                placeholder="Embu Level 5 Hospital"
                value={orgData.organization_name}
                onChange={(e) => setOrgData({ ...orgData, organization_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Registration Number</Label>
              <Input
                placeholder="REG-2024-001"
                value={orgData.registration_number}
                onChange={(e) => setOrgData({ ...orgData, registration_number: e.target.value })}
                className="mt-1"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setCurrentStep('role')}
        >
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            if (selectedWorkspaceType === 'family') {
              setCurrentStep('family');
            } else if (selectedWorkspaceType === 'individual') {
              setCurrentStep('provider');
            } else {
              setCurrentStep('complete');
            }
          }}
          disabled={!userData.full_name || !email || (selectedWorkspaceType === 'organization' && !orgData.organization_name)}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  // === STEP 3: FAMILY MEMBERS ===
  const renderFamilyMembers = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Family Members</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add people who will receive care in your family
        </p>
      </div>

      {/* Family member list */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {familyMembers.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-medium text-sm">{member.full_name}</p>
              <p className="text-xs text-slate-500">{member.relationship} • {member.gender}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFamilyMembers(familyMembers.filter(m => m.id !== member.id))}
              className="text-red-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add family member form */}
      {showFamilyForm ? (
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name *</Label>
            <Input
              placeholder="Mother"
              value={currentFamilyMember.full_name || ''}
              onChange={(e) => setCurrentFamilyMember({ ...currentFamilyMember, full_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Relationship</Label>
              <Input
                placeholder="Mother, Father, Son..."
                value={currentFamilyMember.relationship || ''}
                onChange={(e) => setCurrentFamilyMember({ ...currentFamilyMember, relationship: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Gender</Label>
              <Select
                value={currentFamilyMember.gender || ''}
                onValueChange={(value) => setCurrentFamilyMember({ ...currentFamilyMember, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</Label>
            <Input
              type="date"
              value={currentFamilyMember.date_of_birth || ''}
              onChange={(e) => setCurrentFamilyMember({ ...currentFamilyMember, date_of_birth: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</Label>
            <Input
              placeholder="+254 700..."
              value={currentFamilyMember.phone || ''}
              onChange={(e) => setCurrentFamilyMember({ ...currentFamilyMember, phone: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowFamilyForm(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (currentFamilyMember.full_name) {
                  setFamilyMembers([
                    ...familyMembers,
                    {
                      id: crypto.randomUUID(),
                      full_name: currentFamilyMember.full_name,
                      relationship: currentFamilyMember.relationship || 'Family',
                      date_of_birth: currentFamilyMember.date_of_birth || '',
                      gender: currentFamilyMember.gender || 'other',
                      phone: currentFamilyMember.phone || '',
                    }
                  ]);
                  setCurrentFamilyMember({});
                  setShowFamilyForm(false);
                }
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Member
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowFamilyForm(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Family Member
        </Button>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setCurrentStep('profile')}
        >
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={() => setCurrentStep('complete')}
        >
          Continue {familyMembers.length > 0 && `(${familyMembers.length} members)`}
        </Button>
      </div>
    </div>
  );

  // === STEP 4: PROVIDER DETAILS ===
  const renderProviderDetails = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Professional Details</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tell us about your healthcare profession
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Professional Title</Label>
          <Input
            placeholder="Registered Nurse, Clinical Officer, etc."
            value={providerData.professional_title}
            onChange={(e) => setProviderData({ ...providerData, professional_title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Number</Label>
            <Input
              placeholder="NCK-12345"
              value={providerData.license_number}
              onChange={(e) => setProviderData({ ...providerData, license_number: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Type</Label>
            <Input
              placeholder="Nursing, Medical, etc."
              value={providerData.license_type}
              onChange={(e) => setProviderData({ ...providerData, license_type: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Specialties</Label>
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="Wound Care, Home Nursing..."
              value={specialtyInput}
              onChange={(e) => setSpecialtyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && specialtyInput.trim()) {
                  setProviderData({
                    ...providerData,
                    specialties: [...providerData.specialties, specialtyInput.trim()]
                  });
                  setSpecialtyInput('');
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                if (specialtyInput.trim()) {
                  setProviderData({
                    ...providerData,
                    specialties: [...providerData.specialties, specialtyInput.trim()]
                  });
                  setSpecialtyInput('');
                }
              }}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {providerData.specialties.map((spec, idx) => (
              <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center gap-1">
                {spec}
                <button
                  onClick={() => setProviderData({
                    ...providerData,
                    specialties: providerData.specialties.filter((_, i) => i !== idx)
                  })}
                  className="hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Years of Experience</Label>
          <Input
            type="number"
            placeholder="5"
            value={providerData.years_experience || ''}
            onChange={(e) => setProviderData({ ...providerData, years_experience: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bio / Description</Label>
          <Textarea
            placeholder="Tell clients about yourself and your services..."
            value={providerData.bio}
            onChange={(e) => setProviderData({ ...providerData, bio: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setCurrentStep('profile')}
        >
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={() => setCurrentStep('complete')}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  // === STEP 5: COMPLETE - Create Account ===
  const createAccount = async () => {
    setIsLoading(true);

    try {
      let authResult;
      const signupData = {
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            role: selectedWorkspaceType === 'individual' ? 'provider' : 'client',
            phone_number: userData.phone_number,
            city: userData.city,
            country: userData.country,
            date_of_birth: userData.date_of_birth,
            gender: userData.gender,
            county: userData.county,
          }
        }
      };

      if (isSignUp) {
        authResult = await supabase.auth.signUp(signupData);
      } else {
        authResult = await supabase.auth.signInWithPassword({ email, password });
      }

      if (authResult.error) throw authResult.error;

      if (!authResult.data.user) {
        toast({
          title: "Error",
          description: "Failed to create account",
          variant: "destructive",
        });
        return;
      }

      const userId = authResult.data.user.id;

      // Create workspace with all collected data
      const workspaceName = selectedWorkspaceType === 'individual'
        ? userData.full_name
        : selectedWorkspaceType === 'family'
          ? `${userData.full_name}'s Family`
          : orgData.organization_name || userData.full_name;

      const slug = workspaceName.toLowerCase().replace(/\s+/g, '-') + '-' + crypto.randomUUID().slice(0, 8);

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceName,
          type: selectedWorkspaceType,
          slug: slug,
          created_by: userId,
          country: userData.country,
          county: userData.county,
          city: userData.city,
          description: selectedWorkspaceType === 'organization' ? orgData.description : providerData.bio,
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Add user as owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: userId,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // Update profile with current workspace
      await supabase
        .from('profiles')
        .update({ current_workspace_id: workspace.id })
        .eq('id', userId);

      // Handle different workspace types
      if (selectedWorkspaceType === 'individual') {
        // Create provider profile
        await supabase
          .from('provider_profiles')
          .insert({
            user_id: userId,
            professional_title: providerData.professional_title,
            license_number: providerData.license_number,
            license_type: providerData.license_type,
            specialties: providerData.specialties,
            years_experience: providerData.years_experience,
            bio: providerData.bio,
            verification_status: 'pending',
          });
      }

      if (selectedWorkspaceType === 'family') {
        // Add family members as patients
        for (const member of familyMembers) {
          await supabase
            .from('patients')
            .insert({
              workspace_id: workspace.id,
              full_name: member.full_name,
              relationship_to_owner: member.relationship,
              date_of_birth: member.date_of_birth,
              gender: member.gender,
              phone_number: member.phone,
              is_active: true,
            });
        }
      }

      if (selectedWorkspaceType === 'organization') {
        // Update provider profile for org admin
        await supabase
          .from('provider_profiles')
          .insert({
            user_id: userId,
            business_name: orgData.organization_name,
            verification_status: 'pending',
          });
      }

      toast({
        title: "🎉 Account Created!",
        description: `Your ${selectedWorkspaceType} workspace is ready.`,
      });

      // Redirect to dashboard
      const { data: roleData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      navigate(`/dashboard/${roleData?.role || 'client'}`);

    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderComplete = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Almost There! 🚀
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Review your details and create your account
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Name</span>
          <span className="font-medium">{userData.full_name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Email</span>
          <span className="font-medium">{email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Workspace</span>
          <span className="font-medium capitalize">{selectedWorkspaceType}</span>
        </div>
        {selectedWorkspaceType === 'family' && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Family Members</span>
            <span className="font-medium">{familyMembers.length}</span>
          </div>
        )}
        {selectedWorkspaceType === 'individual' && providerData.professional_title && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Title</span>
            <span className="font-medium">{providerData.professional_title}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            if (selectedWorkspaceType === 'family') setCurrentStep('family');
            else if (selectedWorkspaceType === 'individual') setCurrentStep('provider');
            else setCurrentStep('profile');
          }}
        >
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={createAccount}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </div>
    </div>
  );

  // === RENDER CURRENT STEP ===
  const renderStep = () => {
    switch (currentStep) {
      case 'role':
        return renderRoleSelection();
      case 'profile':
        return renderProfile();
      case 'family':
        return renderFamilyMembers();
      case 'provider':
        return renderProviderDetails();
      case 'complete':
        return renderComplete();
      default:
        return null;
    }
  };

  // === MAIN RENDER ===
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden p-0 m-0">
      {/* Background */}
      <div className="absolute inset-0">
        {backgrounds.map((bg, index) => (
          <div
            key={bg}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2s] ease-in-out ${index === currentBg ? "opacity-100" : "opacity-0"
              }`}
            style={{ backgroundImage: `url(${bg})` }}
          />
        ))}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center px-3 py-3">
        <Card className="w-full max-w-md h-full max-h-[95vh] flex flex-col bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-none shadow-2xl animate-in fade-in zoom-in duration-500 overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
            {/* Header with back button and steps indicator */}
            <div className="mb-3">
              <Button
                variant="ghost"
                onClick={() => {
                  if (currentStep === 'role') {
                    navigate("/");
                  } else {
                    setCurrentStep('role');
                  }
                }}
                className="group text-black dark:text-white transition-all pl-1 h-8 text-xs"
              >
                <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                {currentStep === 'role' ? 'Home' : 'Back'}
              </Button>
            </div>

            {/* Progress indicator */}
            <div className="flex justify-center gap-1 mb-4">
              {['role', 'profile', 'family', 'provider', 'complete'].map((step, idx) => {
                const isActive = currentStep === step;
                const isCompleted = ['role', 'profile', 'family', 'provider', 'complete'].indexOf(currentStep) > idx;
                return (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-all ${isActive ? 'bg-primary' :
                        isCompleted ? 'bg-primary/50' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                  />
                );
              })}
            </div>

            {renderStep()}
          </div>
        </Card>
      </div>
    </div>
  );
}