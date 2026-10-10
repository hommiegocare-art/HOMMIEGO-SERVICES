// src/components/chat/MessageActions.tsx
import { Copy, Pencil, Reply, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MessageActionTarget {
    id: string;
    body: string | null;
    canEdit: boolean;
    canDelete: boolean;
}

interface Props {
    target: MessageActionTarget | null;
    onClose: () => void;
    onReply: (t: MessageActionTarget) => void;
    onEdit: (t: MessageActionTarget) => void;
    onCopy: (t: MessageActionTarget) => void;
    onDelete: (t: MessageActionTarget) => void;
}

function ActionButton({
    icon,
    label,
    destructive,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    destructive?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex h-11 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm",
                "transition-colors active:bg-muted",
                destructive ? "text-destructive" : "text-foreground",
            )}
        >
            {icon}
            {label}
        </button>
    );
}

export function MessageActions({
    target,
    onClose,
    onReply,
    onEdit,
    onCopy,
    onDelete,
}: Props) {
    if (!target) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end bg-foreground/40 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full rounded-t-3xl bg-card px-4 pb-6 pt-4 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />

                {target.body && !target.canEdit ? (
                    <div className="mb-3 rounded-2xl bg-muted px-3 py-2">
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                            {target.body}
                        </p>
                    </div>
                ) : null}

                <ul className="space-y-1">
                    <li>
                        <ActionButton
                            icon={<Reply className="h-4 w-4" />}
                            label="Reply"
                            onClick={() => {
                                onReply(target);
                                onClose();
                            }}
                        />
                    </li>
                    {target.body ? (
                        <li>
                            <ActionButton
                                icon={<Copy className="h-4 w-4" />}
                                label="Copy"
                                onClick={() => {
                                    onCopy(target);
                                    onClose();
                                }}
                            />
                        </li>
                    ) : null}
                    {target.canEdit ? (
                        <li>
                            <ActionButton
                                icon={<Pencil className="h-4 w-4" />}
                                label="Edit"
                                onClick={() => {
                                    onEdit(target);
                                    onClose();
                                }}
                            />
                        </li>
                    ) : null}
                    {target.canDelete ? (
                        <li>
                            <ActionButton
                                icon={<Trash2 className="h-4 w-4" />}
                                label="Delete"
                                destructive
                                onClick={() => {
                                    onDelete(target);
                                    onClose();
                                }}
                            />
                        </li>
                    ) : null}
                </ul>
            </div>
        </div>
    );
}