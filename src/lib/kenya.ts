// src/lib/kenya.ts

/* =========================================================
   COUNTIES
   ========================================================= */

export const KENYA_COUNTIES = [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet",
    "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado",
    "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga",
    "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia",
    "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit",
    "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
    "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua",
    "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River",
    "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu",
    "Vihiga", "Wajir", "West Pokot",
] as const;

export type KenyaCounty = (typeof KENYA_COUNTIES)[number];

/* =========================================================
   LANGUAGES
   ========================================================= */

export const KENYA_LANGUAGES = [
    { code: "en", label: "English" },
    { code: "sw", label: "Kiswahili" },
    { code: "ki", label: "Kikuyu" },
    { code: "luo", label: "Dholuo" },
    { code: "kam", label: "Kamba" },
    { code: "luy", label: "Luhya" },
    { code: "som", label: "Somali" },
    { code: "kln", label: "Kalenjin" },
    { code: "mer", label: "Kimeru" },
    { code: "mas", label: "Maasai" },
    { code: "kis", label: "Kisii" },
    { code: "tai", label: "Taita" },
    { code: "bor", label: "Borana" },
    { code: "ren", label: "Rendille" },
    { code: "tuk", label: "Turkana" },
    { code: "samb", label: "Samburu" },
    { code: "pok", label: "Pokot" },
    { code: "kur", label: "Kuria" },
    { code: "tes", label: "Teso" },
    { code: "mij", label: "Mijikenda" },
] as const;

/* =========================================================
   PROFESSIONAL TITLES
   Grouped so it reads cleanly in the dropdown.
   ========================================================= */

export const PROFESSIONAL_TITLES = [
    // — Nursing
    "Registered Nurse (RN)",
    "Enrolled Nurse (EN)",
    "Nurse Assistant",
    "Nurse Aide",
    "Midwife",
    "Community Health Nurse",
    "Public Health Nurse",
    "Critical Care Nurse",
    "Theatre Nurse",
    "Pediatric Nurse",
    "Mental Health Nurse",

    // — Medical
    "Medical Doctor",
    "Consultant Physician",
    "Clinical Officer",
    "Medical Intern",
    "Anesthesiologist",
    "Radiologist",
    "Pathologist",

    // — Pharmacy
    "Pharmacist",
    "Pharmaceutical Technologist",
    "Pharmacy Assistant",
    "Pharmacy Delivery Rider",

    // — Emergency & transport
    "Paramedic",
    "Emergency Medical Technician (EMT)",
    "Ambulance Driver",
    "First Responder",

    // — Therapy & rehab
    "Physiotherapist",
    "Occupational Therapist",
    "Speech & Language Therapist",
    "Respiratory Therapist",
    "Nutritionist / Dietitian",
    "Psychologist",
    "Counsellor",
    "Psychiatrist",
    "Behavioral Therapist",
    "Rehabilitation Assistant",

    // — Caregiving (home & facility)
    "Caregiver",
    "Professional Caregiver",
    "Home Health Aide",
    "Home Care Assistant",
    "Elderly Caregiver",
    "Live-in Caregiver",
    "Live-out Caregiver",
    "Night-shift Caregiver",
    "Companion Caregiver",
    "Post-surgical Caregiver",
    "Palliative Caregiver",
    "Hospice Caregiver",
    "Dementia Caregiver",
    "Disability Support Worker",
    "Special Needs Caregiver",
    "Pediatric Caregiver",
    "Maternity / Postnatal Caregiver",
    "Nanny / Childcare Provider",
    "Babysitter",

    // — Social & community
    "Social Worker",
    "Community Health Worker (CHW)",
    "Community Health Volunteer (CHV)",
    "Case Manager",

    // — Lab & diagnostics
    "Medical Laboratory Technologist",
    "Phlebotomist",
    "Sonographer / Ultrasound Tech",
    "Radiographer",

    // — Alternative & wellness
    "Traditional Birth Attendant (TBA)",
    "Herbalist",
    "Massage Therapist",
    "Reflexologist",

    // — Support services
    "Cleaner / Housekeeper",
    "Laundry Assistant",
    "Cook / Meal Preparer",
    "Driver",
    "Errand Runner",
    "Medical Equipment Technician",
] as const;

/* =========================================================
   CAREGIVER SPECIALTIES / SERVICES OFFERED
   Broad coverage: clinical, home, therapy, logistics.
   ========================================================= */

export const CAREGIVER_SPECIALTIES = [
    // — Core nursing / clinical
    "Home nursing",
    "Wound care & dressing",
    "Post-surgery care",
    "Postnatal care",
    "Antenatal care",
    "Maternity support",
    "Medication management",
    "Medication reminders",
    "IV infusion / drip administration",
    "Injections (insulin, IM, SC)",
    "Catheter care",
    "Colostomy / stoma care",
    "Nasogastric (NG) tube feeding",
    "PEG tube feeding",
    "Vital signs monitoring",
    "Blood pressure monitoring",
    "Blood sugar monitoring",
    "Diabetes care",
    "Oxygen therapy support",
    "Ventilator care",
    "Tracheostomy care",
    "Wound vacuum (VAC) care",
    "Pressure sore / bedsore care",
    "Palliative care",
    "Hospice / end-of-life care",
    "Pain management support",
    "Cancer care support",
    "Post-chemotherapy care",
    "Stroke rehabilitation support",
    "Physiotherapy support",
    "Occupational therapy support",
    "Speech therapy support",

    // — Elderly & chronic
    "Elderly care",
    "Dementia / Alzheimer's care",
    "Parkinson's care",
    "Arthritis care",
    "Mobility assistance",
    "Fall prevention",
    "Bedridden patient care",
    "Palliative wound care",

    // — Pediatric & special needs
    "Pediatric / child care",
    "Newborn care",
    "Special needs care",
    "Autism support",
    "Cerebral palsy care",
    "Down syndrome care",

    // — Mental health
    "Mental health support",
    "Depression & anxiety support",
    "Substance recovery support",
    "Companionship & emotional support",

    // — Daily living (ADLs)
    "Personal hygiene assistance",
    "Bathing & grooming",
    "Dressing assistance",
    "Feeding assistance",
    "Toileting assistance",
    "Incontinence care",
    "Bed-making & positioning",
    "Transfer & lifting assistance",

    // — Household
    "Meal preparation",
    "Special diet cooking (diabetic, renal, etc.)",
    "Light housekeeping",
    "Laundry & ironing",
    "Grocery shopping",
    "Errand running",
    "Bill payment assistance",
    "Pet care",

    // — Transport & logistics
    "Hospital accompaniment",
    "Doctor visit escort",
    "Medical appointment transport",
    "Prescription pickup",
    "Medication delivery (pharmacy to doorstep)",
    "Medical equipment delivery",
    "Sample / specimen delivery to lab",
    "Ambulance / patient transport",
    "Wheelchair transport",
    "Stretcher transport",
    "Airport / travel assistance for patients",

    // — Monitoring & tech
    "Remote patient monitoring",
    "Telehealth assistance",
    "Medical alert device setup",
    "Health record keeping",

    // — Wellness
    "Massage therapy",
    "Exercise & mobility coaching",
    "Yoga / gentle movement for seniors",
    "Nutritional counselling",
    "Smoking cessation support",

    // — Care coordination
    "Care plan development",
    "Family caregiver training",
    "Care coordination with hospitals",
    "Insurance / NHIF paperwork help",
] as const;

/* =========================================================
   PHONE NORMALIZER
   ========================================================= */

/** Normalize KE phone numbers to +2547XXXXXXXX / +2541XXXXXXXX */
export function normalizePhone(input: string): string {
    const digits = input.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("254")) return `+${digits}`;
    if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
    if (digits.length === 9) return `+254${digits}`;
    return input.trim();
}