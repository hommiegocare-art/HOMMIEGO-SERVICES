// src/components/landing/CTA.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeartPulse, Stethoscope } from "lucide-react";

export function CTA() {
    return (
        <section className="border-t border-border/60 bg-muted/20">
            <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-24">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Ready when you are.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                    Join as a client looking for care, or as a caregiver ready to earn.
                    Free to sign up.
                </p>
                <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                    <Button asChild size="lg" className="w-full sm:w-auto">
                        <Link to="/auth?mode=signup&role=client">
                            <HeartPulse className="mr-2 h-4 w-4" />
                            I need care
                        </Link>
                    </Button>
                    <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto"
                    >
                        <Link to="/auth?mode=signup&role=caregiver">
                            <Stethoscope className="mr-2 h-4 w-4" />
                            I provide care
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}