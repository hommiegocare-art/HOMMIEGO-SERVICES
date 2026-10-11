// src/components/certificates/CertificatePDF.tsx
import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
} from "@react-pdf/renderer";

export type CertificateServiceLine = {
    service_title: string;
    short_description: string | null;
    completed_at: string;
};

export type CertificatePDFProps = {
    caregiverName: string;
    milestone: number;
    awardedAt: string;
    certificateCode: string;
    services: CertificateServiceLine[];
    issuedBy?: string;
};

const INK = "#111827";
const MUTED = "#6b7280";
const ACCENT = "#dc2626";
const RULE = "#e5e7eb";
const PAPER = "#ffffff";

/**
 * The logo lives in /public. react-pdf needs an absolute URL to fetch it,
 * so we derive it from window.location at render time. In SSR contexts
 * (none here) it would fall back to the brand text.
 */
const LOGO_URL =
    typeof window !== "undefined"
        ? `${window.location.origin}/pwa-512x512.png`
        : "";

const styles = StyleSheet.create({
    page: {
        backgroundColor: PAPER,
        paddingHorizontal: 56,
        paddingVertical: 44,
        fontFamily: "Helvetica",
        color: INK,
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    logo: {
        width: 44,
        height: 44,
        marginRight: 12,
        borderRadius: 22,
    },
    brandHommie: {
        fontSize: 22,
        fontFamily: "Helvetica-Bold",
        letterSpacing: 0.5,
    },
    brandCare: {
        fontSize: 22,
        fontFamily: "Helvetica-Bold",
        color: ACCENT,
        letterSpacing: 0.5,
    },

    rule: {
        height: 1,
        backgroundColor: RULE,
        marginVertical: 12,
    },

    // Kicker + title
    kicker: {
        fontSize: 9,
        color: MUTED,
        letterSpacing: 4,
        textAlign: "center",
        textTransform: "uppercase",
        marginTop: 4,
    },
    title: {
        fontSize: 20,
        fontFamily: "Helvetica-Bold",
        textAlign: "center",
        marginTop: 10,
        letterSpacing: 0.3,
    },

    // Name block
    subhead: {
        fontSize: 11,
        color: MUTED,
        textAlign: "center",
        marginTop: 12,
    },
    name: {
        fontSize: 26,
        fontFamily: "Helvetica-Bold",
        textAlign: "center",
        marginTop: 6,
        marginBottom: 4,
    },
    nameRule: {
        height: 1,
        backgroundColor: RULE,
        width: 220,
        alignSelf: "center",
        marginTop: 12,
        marginBottom: 16,
    },

    // Completed line
    forLine: {
        fontSize: 11,
        color: MUTED,
        textAlign: "center",
    },
    bigNumber: {
        fontSize: 40,
        fontFamily: "Helvetica-Bold",
        color: ACCENT,
        textAlign: "center",
        marginTop: 4,
        marginBottom: 2,
    },
    unit: {
        fontSize: 11,
        color: MUTED,
        textAlign: "center",
        marginBottom: 8,
    },

    // Service list
    listHeader: {
        fontSize: 8,
        color: MUTED,
        letterSpacing: 3,
        textTransform: "uppercase",
        textAlign: "center",
        marginTop: 12,
        marginBottom: 8,
    },
    listWrap: {
        paddingHorizontal: 20,
    },
    listRow: {
        flexDirection: "row",
        paddingVertical: 3,
        alignItems: "flex-start",
    },
    bullet: {
        fontSize: 9,
        color: ACCENT,
        width: 14,
        fontFamily: "Helvetica-Bold",
    },
    serviceTitle: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: INK,
        flex: 1,
    },
    serviceDesc: {
        fontSize: 9,
        color: MUTED,
        flex: 1,
        marginTop: 1,
    },
    serviceDate: {
        fontSize: 8,
        color: MUTED,
        fontFamily: "Courier",
        width: 70,
        textAlign: "right",
    },

    // Footer
    footerBlock: {
        marginTop: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    footerCol: {
        flex: 1,
    },
    footerLabel: {
        fontSize: 7,
        color: MUTED,
        letterSpacing: 2,
        textTransform: "uppercase",
        marginBottom: 2,
    },
    footerValue: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
    },
    code: {
        fontSize: 8,
        color: MUTED,
        fontFamily: "Courier",
    },
    signatureRule: {
        height: 1,
        backgroundColor: RULE,
        width: 150,
        marginBottom: 3,
    },
});

export function CertificatePDF({
    caregiverName,
    milestone,
    awardedAt,
    certificateCode,
    services,
    issuedBy = "HommieCare",
}: CertificatePDFProps) {
    const awardedDate = new Date(awardedAt).toLocaleDateString("en-KE", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <Document
            title={`HommieCare Certificate — Milestone ${milestone}`}
            author={issuedBy}
            subject="Certificate of Service Milestone"
        >
            <Page size="A4" orientation="portrait" style={styles.page}>
                {/* Header: logo + brand */}
                <View style={styles.header}>
                    {LOGO_URL ? (
                        <Image src={LOGO_URL} style={styles.logo} />
                    ) : null}
                    <View style={{ flexDirection: "row" }}>
                        <Text style={styles.brandHommie}>Hommie</Text>
                        <Text style={styles.brandCare}>Care</Text>
                    </View>
                </View>

                <View style={styles.rule} />

                {/* Kicker + title */}
                <Text style={styles.kicker}>
                    Certificate of Service Milestone
                </Text>
                <Text style={styles.title}>This certifies that</Text>

                {/* Name */}
                <Text style={styles.name}>{caregiverName}</Text>
                <View style={styles.nameRule} />

                {/* Count */}
                <Text style={styles.forLine}>
                    has successfully completed
                </Text>
                <Text style={styles.bigNumber}>{milestone}</Text>
                <Text style={styles.unit}>
                    care services on {issuedBy}
                </Text>

                <View style={styles.rule} />

                {/* Itemized list of the 10 services that earned this milestone */}
                {services.length > 0 && (
                    <>
                        <Text style={styles.listHeader}>
                            Services delivered
                        </Text>
                        <View style={styles.listWrap}>
                            {services.map((s, i) => (
                                <View key={i} style={styles.listRow}>
                                    <Text style={styles.bullet}>•</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.serviceTitle}>
                                            {s.service_title}
                                        </Text>
                                        {s.short_description && (
                                            <Text style={styles.serviceDesc}>
                                                {s.short_description}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={styles.serviceDate}>
                                        {new Date(s.completed_at).toLocaleDateString(
                                            "en-KE",
                                            {
                                                year: "2-digit",
                                                month: "short",
                                                day: "2-digit",
                                            },
                                        )}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.rule} />
                    </>
                )}

                {/* Footer */}
                <View style={styles.footerBlock}>
                    <View style={styles.footerCol}>
                        <Text style={styles.footerLabel}>Awarded on</Text>
                        <Text style={styles.footerValue}>{awardedDate}</Text>
                    </View>

                    <View style={styles.footerCol}>
                        <Text style={styles.footerLabel}>Certificate ID</Text>
                        <Text style={styles.code}>{certificateCode}</Text>
                    </View>

                    <View style={styles.footerCol}>
                        <View style={styles.signatureRule} />
                        <Text style={styles.footerLabel}>
                            {issuedBy} Operations
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}