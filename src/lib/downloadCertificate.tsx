// src/lib/downloadCertificate.tsx
import { pdf } from "@react-pdf/renderer";
import {
    CertificatePDF,
    CertificatePDFProps,
} from "@/components/certificates/CertificatePDF";

export async function downloadCertificate(
    props: CertificatePDFProps,
): Promise<void> {
    const blob = await pdf(<CertificatePDF {...props} />).toBlob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    const safeName =
        props.caregiverName
            .trim()
            .replace(/[^a-zA-Z0-9-_ ]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 40) || "HommieCare";

    a.href = url;
    a.download = `${safeName}-certificate-milestone-${props.milestone}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}