// src/contexts/WorkspaceContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Workspace {
    id: string;
    name: string;
    type: 'individual' | 'family' | 'organization' | 'agency';
    slug: string;
    logo_url: string | null;
    description: string | null;
    verification_status: string;
    country: string | null;
    county: string | null;
    city: string | null;
    created_at: string;
    updated_at: string;
}

interface WorkspaceMember {
    workspace_id: string;
    role: string;
    status: string;
    joined_at: string;
    workspaces: Workspace;
}

interface WorkspaceContextType {
    currentWorkspace: Workspace | null;
    setCurrentWorkspace: (workspace: Workspace | null) => void;
    workspaces: Workspace[];
    setWorkspaces: (workspaces: Workspace[]) => void;
    switchWorkspace: (workspaceId: string) => Promise<void>;
    isLoading: boolean;
    loadWorkspaces: () => Promise<void>;
    hasWorkspaces: boolean;
    getWorkspacePath: (type: string) => string;
    getWorkspaceIcon: (type: string) => string;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadWorkspaces = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setWorkspaces([]);
                setCurrentWorkspace(null);
                setIsLoading(false);
                return;
            }

            // Get user's workspaces with active status
            const { data, error } = await supabase
                .from('workspace_members')
                .select(`
          workspace_id,
          role,
          status,
          joined_at,
          workspaces!inner (
            id,
            name,
            type,
            slug,
            logo_url,
            description,
            verification_status,
            country,
            county,
            city,
            created_at,
            updated_at
          )
        `)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('joined_at', { ascending: true });

            if (error) {
                console.error('Error loading workspaces:', error);
                setWorkspaces([]);
                setIsLoading(false);
                return;
            }

            // Map the data to Workspace type
            const userWorkspaces = data
                .map(item => item.workspaces)
                .filter((workspace): workspace is Workspace => workspace !== null);

            setWorkspaces(userWorkspaces);

            // Set current workspace
            if (userWorkspaces.length > 0 && !currentWorkspace) {
                // Try to get last used workspace from localStorage
                const lastWorkspaceId = localStorage.getItem('currentWorkspaceId');
                const lastWorkspace = userWorkspaces.find(w => w.id === lastWorkspaceId);

                if (lastWorkspace) {
                    setCurrentWorkspace(lastWorkspace);
                } else {
                    // If no last workspace, use the first one
                    setCurrentWorkspace(userWorkspaces[0]);
                    localStorage.setItem('currentWorkspaceId', userWorkspaces[0].id);
                }
            } else if (userWorkspaces.length === 0) {
                setCurrentWorkspace(null);
            }

        } catch (error) {
            console.error('Error in loadWorkspaces:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const switchWorkspace = async (workspaceId: string) => {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (workspace) {
            setCurrentWorkspace(workspace);
            localStorage.setItem('currentWorkspaceId', workspace.id);

            // Update profile's current workspace
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('profiles')
                    .update({ current_workspace_id: workspace.id })
                    .eq('id', user.id);
            }
        }
    };

    const getWorkspacePath = (type: string) => {
        switch (type) {
            case 'individual':
                return '/dashboard/provider';
            case 'family':
                return '/dashboard/family';
            case 'organization':
                return '/dashboard/organization';
            case 'agency':
                return '/dashboard/agency';
            default:
                return '/dashboard';
        }
    };

    const getWorkspaceIcon = (type: string) => {
        switch (type) {
            case 'individual':
                return '👤';
            case 'family':
                return '👨‍👩‍👧‍👦';
            case 'organization':
                return '🏥';
            case 'agency':
                return '🏢';
            default:
                return '📋';
        }
    };

    useEffect(() => {
        loadWorkspaces();

        // Listen for auth changes to reload workspaces
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            loadWorkspaces();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const hasWorkspaces = workspaces.length > 0;

    const value = {
        currentWorkspace,
        setCurrentWorkspace,
        workspaces,
        setWorkspaces,
        switchWorkspace,
        isLoading,
        loadWorkspaces,
        hasWorkspaces,
        getWorkspacePath,
        getWorkspaceIcon,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}