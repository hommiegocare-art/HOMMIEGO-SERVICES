import { useEffect, useState } from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
    src?: string | null;
    fallback?: React.ReactNode;
};

export function SafeImage({ src, fallback, ...rest }: Props) {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [src]);

    if (!src || failed) return <>{fallback ?? null}</>;

    return <img src={src} {...rest} onError={() => setFailed(true)} />;
}