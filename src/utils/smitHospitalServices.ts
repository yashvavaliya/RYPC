// Smit Hospital specific services and details extracted from smit-hospital.txt
export const smitHospitalServices = [
  // Core Medical Services
  "Doctor Expertise",
  "Gynecological Care",
  "Maternity Services",
  "Prenatal Care",
  "Delivery Experience",
  "Cesarean Delivery",
  "Normal Delivery",
  "Painless Delivery",
  "Infertility Treatment",
  "IVF Services",
  "High-Risk Pregnancy Care",
  "Laparoscopic Procedures",
  "Gynecological Surgeries",
  "Pap Smear & Cancer Screening",
  "Diagnosis of Vaginal Infections",
  "Endometriosis & Ovarian Cyst Management",
  "Dysfunctional Uterine Bleeding (DUB)",
  "Pelvic Inflammatory Disease (PID) Treatment",
  "Oncogynecology Counseling",
  "IUI & Infertility Counseling",
  "Preconception Clinics",
  "Menopause Clinics",

  // Wellness Programs
  "Garbh Sanskar Program",
  "Month-wise Antenatal Guidance",
  "Yoga & Music Therapy",
  "Mantra Chanting",
  "Counseling & Emotional Support",
  "Adolescent Counseling",
  "Mental Health for Teens",
  "STD Prevention",
  "Menstrual & PCOS Guidance",
  "Nutrition & Micronutrients",
  "Substance Abuse Awareness",
  "Physiotherapy Department",

  // Family Planning
  "Tubal Ligation",
  "Vasectomy",
  "Contraception Counseling",
  "Reproductive Rights Education",

  // Facility & Equipment
  "Modern Infrastructure",
  "Dedicated Labor Rooms",
  "High-End Diagnostic Equipment",
  "Advanced Sonography Systems",
  "Full Fetal Monitoring",
  "Cleanliness & Infection Control",
  "Homely & Comfortable Environment",

  // Service Quality
  "Treatment Effectiveness",
  "Consultation Quality",
  "Nursing Staff",
  "Staff Compassion",
  "Appointment Scheduling",
  "Billing Transparency",
  "Waiting Time Management",
  "Follow-up Care",
  "Emergency Handling",
  "Pain Management",
  "Patient Comfort",
  "Discharge Process",
  "Family Support",
  "Patient Privacy",
];

export const smitHospitalInfo = {
  name: "Smit Hospital",
  category: "Health & Medical",
  type: "Gynecological & Maternity Hospital",
  location: "Varachha, Surat",
  website: "www.smithospitals.com",
  googleReviewLink: "Leave a Review",
  experience: "15+ years",
  consultations: "1 lakh+ patient consultations",
  deliveries: "6000+ successful deliveries",

  keyDoctors: [
    "Dr. Vitthal F. Patel (M.B., D.G.O.) – Founder",
    "Dr. Vishal Savani – Assistant Gynac",
    "Mrs. Reena V. Patel – Chief Operating Officer"
  ],

  specializations: [
    "High-risk pregnancies (PET, GDM, cardiac, obesity)",
    "Normal, painless, and cesarean deliveries",
    "Advanced gynecological surgeries & laparoscopic procedures",
    "Infertility treatment including IVF (with lab tie-up)",
    "Holistic care for pregnancy, menopause, adolescents",
  ],

  uniquePrograms: [
    "Garbh Sanskar Program rooted in Indian tradition",
    "Menopause counseling and physical wellness",
    "Adolescent mental & sexual health counseling",
    "Physiotherapy for post-surgery & injury recovery",
    "Free wellness and awareness sessions"
  ],

  facilities: [
    "Modern diagnostic & treatment rooms",
    "Advanced ultrasound & fetal monitoring equipment",
    "Hygienic, peaceful & homely patient environment",
    "Compassionate and qualified staff",
    "Technology-supported emergency care"
  ],

  values: [
    "Ethical, transparent, and patient-first approach",
    "Safe, comfortable environment for women",
    "Holistic wellness and emotional well-being",
    "Empathy, trust, and lifelong care"
  ],

  reviewGenerationRules: {
    avoidRepetition: true,
    maxCharacters: 200,
    minCharacters: 150,
    varyStructure: true,
    noAIHints: true,
    generateBasedOnDescription: true,
    allowRealtimeUniqueness: true,
    shouldFeelHumanWritten: true,
    storePreviousReviews: true
  }
};
