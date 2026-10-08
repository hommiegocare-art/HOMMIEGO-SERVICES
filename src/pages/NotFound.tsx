// src/pages/NotFound.tsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[60dvh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl font-black text-foreground">404</p>
        <p className="text-sm text-muted-foreground mt-2">
          This page doesn't exist.
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-5 px-5 h-11 leading-[44px] rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}