import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Star, Upload, X, Mail, Send, Loader2, Save, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface CertificateProps {
  onClose?: () => void;
  defaultStudentName?: string;
  defaultScore?: number;
}

const ACHIEVEMENT_TYPES = [
  { value: "completion", label: "Game Completion", icon: "🎮" },
  { value: "nutrition_expert", label: "Nutrition Expert", icon: "🥗" },
  { value: "wisconsin_explorer", label: "Wisconsin Explorer", icon: "🧀" },
  { value: "healthy_champion", label: "Healthy Champion", icon: "💪" },
  { value: "food_safety_star", label: "Food Safety Star", icon: "⭐" },
];

export default function Certificate({ onClose, defaultStudentName = "", defaultScore }: CertificateProps) {
  const [studentName, setStudentName] = useState(defaultStudentName);
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [achievementType, setAchievementType] = useState("completion");
  const [customMessage, setCustomMessage] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>("");
  
  // Email states
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientType, setRecipientType] = useState<"student" | "parent">("parent");
  const [isSending, setIsSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  
  // Template states
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  
  // Template queries
  const { data: savedTemplates = [], refetch: refetchTemplates } = trpc.emailTemplates.getAll.useQuery();
  const { data: defaultTemplate } = trpc.emailTemplates.getDefault.useQuery(
    { achievementType },
    { enabled: !!achievementType }
  );
  
  const createTemplateMutation = trpc.emailTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template saved successfully!");
      setIsSaveTemplateDialogOpen(false);
      setTemplateName("");
      setSetAsDefault(false);
      refetchTemplates();
    },
    onError: (error) => {
      toast.error(`Failed to save template: ${error.message}`);
    },
  });
  
  const deleteTemplateMutation = trpc.emailTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted");
      setSelectedTemplateId(null);
      refetchTemplates();
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
  
  // Load default template when achievement type changes
  useEffect(() => {
    if (defaultTemplate && !selectedTemplateId) {
      setEmailSubject(defaultTemplate.subject);
      setEmailBody(defaultTemplate.body);
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [defaultTemplate, achievementType]);

  const getDefaultEmailSubject = () => {
    return `🎉 Congratulations! ${studentName || "{student_name}"} earned a ${getAchievementTitle()}!`;
  };

  const getDefaultEmailBody = () => {
    return `Dear ${recipientType === "parent" ? "Parent/Guardian" : studentName || "{student_name}"},

We are thrilled to share some wonderful news!

${studentName || "{student_name}"} has successfully completed the Wisconsin Food Explorer nutrition adventure and earned a ${getAchievementTitle()}!

This achievement demonstrates excellent knowledge of healthy eating habits and Wisconsin's rich agricultural heritage.

Congratulations on this fantastic accomplishment!

Best regards,
${teacherName || "{teacher_name}"}
${schoolName || "{school_name}"}`;
  };

  const replaceEmailVariables = (text: string) => {
    return text
      .replace(/{student_name}/g, studentName || "Student")
      .replace(/{achievement}/g, getAchievementTitle())
      .replace(/{teacher_name}/g, teacherName || "Teacher")
      .replace(/{school_name}/g, schoolName || "School")
      .replace(/{date}/g, new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  };
  
  const certificateRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendEmailMutation = trpc.certificates.sendEmail.useMutation({
    onSuccess: (data) => {
      toast.success(`Certificate email sent to ${recipientEmail}!`);
      setIsEmailDialogOpen(false);
      setRecipientEmail("");
    },
    onError: (error) => {
      toast.error(`Failed to send email: ${error.message}`);
    },
  });

  const selectedAchievement = ACHIEVEMENT_TYPES.find(a => a.value === achievementType);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo file must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setLogoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setSchoolLogo(null);
    setLogoFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getAchievementTitle = () => {
    switch (achievementType) {
      case "completion":
        return "Certificate of Completion";
      case "nutrition_expert":
        return "Nutrition Expert Award";
      case "wisconsin_explorer":
        return "Wisconsin Explorer Certificate";
      case "healthy_champion":
        return "Healthy Champion Award";
      case "food_safety_star":
        return "Food Safety Star Certificate";
      default:
        return "Certificate of Achievement";
    }
  };

  const getDefaultMessage = () => {
    switch (achievementType) {
      case "completion":
        return "has successfully completed the Wisconsin Food Explorer nutrition adventure and demonstrated excellent knowledge of healthy eating habits.";
      case "nutrition_expert":
        return "has shown exceptional understanding of nutrition concepts including the five food groups, vitamins, and the importance of balanced meals.";
      case "wisconsin_explorer":
        return "has explored Wisconsin's rich agricultural heritage and learned about the state's famous foods including cheese, cranberries, and dairy products.";
      case "healthy_champion":
        return "has demonstrated outstanding commitment to healthy lifestyle choices and understanding of how nutrition affects our bodies.";
      case "food_safety_star":
        return "has mastered important food safety practices including proper hand washing, safe food storage, and kitchen hygiene.";
      default:
        return "has completed the Wisconsin Food Explorer program.";
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !studentName) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      // Process custom email template with variable replacement
      const processedSubject = emailSubject ? replaceEmailVariables(emailSubject) : undefined;
      const processedBody = emailBody ? replaceEmailVariables(emailBody) : undefined;
      
      await sendEmailMutation.mutateAsync({
        studentName,
        recipientEmail,
        recipientType,
        achievementType,
        teacherName: teacherName || "Teacher",
        schoolName: schoolName || "School",
        date: new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        customMessage: customMessage || undefined,
        emailSubject: processedSubject,
        emailBody: processedBody,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    const printContent = certificateRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${studentName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Nunito', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
              padding: 20px;
            }
            .certificate {
              width: 11in;
              height: 8.5in;
              background: linear-gradient(135deg, #FDF8F3 0%, #FFF9E6 50%, #FDF8F3 100%);
              border: 12px solid #5D4E37;
              border-radius: 8px;
              padding: 40px;
              position: relative;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .certificate::before {
              content: '';
              position: absolute;
              top: 12px;
              left: 12px;
              right: 12px;
              bottom: 12px;
              border: 3px solid #8B7355;
              border-radius: 4px;
              pointer-events: none;
            }
            .certificate::after {
              content: '';
              position: absolute;
              top: 20px;
              left: 20px;
              right: 20px;
              bottom: 20px;
              border: 1px dashed #C4A77D;
              border-radius: 4px;
              pointer-events: none;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              position: relative;
            }
            .school-logo {
              position: absolute;
              top: 0;
              left: 40px;
              width: 80px;
              height: 80px;
              object-fit: contain;
            }
            .logo {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .title {
              font-family: 'Playfair Display', serif;
              font-size: 42px;
              color: #5D4E37;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 4px;
              margin-bottom: 5px;
            }
            .subtitle {
              font-size: 18px;
              color: #8B7355;
              font-weight: 600;
            }
            .content {
              text-align: center;
              margin: 30px 60px;
            }
            .presented-to {
              font-size: 16px;
              color: #8B7355;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .student-name {
              font-family: 'Playfair Display', serif;
              font-size: 48px;
              color: #2D5016;
              font-weight: 700;
              margin-bottom: 20px;
              border-bottom: 3px solid #C4A77D;
              padding-bottom: 10px;
              display: inline-block;
            }
            .message {
              font-size: 18px;
              color: #5D4E37;
              line-height: 1.8;
              max-width: 700px;
              margin: 0 auto 30px;
            }
            .score-badge {
              display: inline-block;
              background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
              color: #5D4E37;
              padding: 8px 24px;
              border-radius: 20px;
              font-weight: 700;
              font-size: 18px;
              margin-top: 10px;
            }
            .footer {
              display: flex;
              justify-content: space-around;
              align-items: flex-end;
              margin-top: 30px;
              padding: 0 40px;
            }
            .signature-block {
              text-align: center;
              min-width: 200px;
            }
            .signature-line {
              border-top: 2px solid #5D4E37;
              padding-top: 8px;
              margin-top: 30px;
            }
            .signature-label {
              font-size: 14px;
              color: #8B7355;
            }
            .signature-name {
              font-family: 'Playfair Display', serif;
              font-size: 20px;
              color: #5D4E37;
              font-weight: 600;
            }
            .date-block {
              text-align: center;
            }
            .date-value {
              font-size: 18px;
              color: #5D4E37;
              font-weight: 600;
            }
            .seal {
              position: absolute;
              bottom: 60px;
              right: 60px;
              width: 100px;
              height: 100px;
              background: linear-gradient(135deg, #C4A77D 0%, #8B7355 100%);
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 700;
              box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            }
            .seal-icon {
              font-size: 32px;
            }
            .seal-text {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .corner-decoration {
              position: absolute;
              width: 80px;
              height: 80px;
              opacity: 0.3;
            }
            .corner-tl { top: 30px; left: 30px; }
            .corner-tr { top: 30px; right: 30px; transform: scaleX(-1); }
            .corner-bl { bottom: 30px; left: 30px; transform: scaleY(-1); }
            .corner-br { bottom: 30px; right: 30px; transform: scale(-1); }
            @media print {
              body { background: white; padding: 0; }
              .certificate { 
                box-shadow: none;
                width: 100%;
                height: 100%;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="corner-decoration corner-tl">🌾</div>
            <div class="corner-decoration corner-tr">🌾</div>
            <div class="corner-decoration corner-bl">🌾</div>
            <div class="corner-decoration corner-br">🌾</div>
            
            <div class="header">
              ${schoolLogo ? `<img src="${schoolLogo}" alt="School Logo" class="school-logo" />` : ""}
              <div class="logo">${selectedAchievement?.icon || "🏆"}</div>
              <h1 class="title">${getAchievementTitle()}</h1>
              <p class="subtitle">Wisconsin Food Explorer</p>
            </div>
            
            <div class="content">
              <p class="presented-to">This certificate is proudly presented to</p>
              <h2 class="student-name">${studentName || "Student Name"}</h2>
              <p class="message">${customMessage || getDefaultMessage()}</p>
              ${defaultScore !== undefined ? `<div class="score-badge">🏆 Score: ${defaultScore} Points</div>` : ""}
            </div>
            
            <div class="footer">
              <div class="signature-block">
                <div class="signature-line">
                  <p class="signature-name">${teacherName || "Teacher Name"}</p>
                  <p class="signature-label">Teacher</p>
                </div>
              </div>
              
              <div class="date-block">
                <p class="date-value">${new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                <p class="signature-label">Date Awarded</p>
              </div>
              
              <div class="signature-block">
                <div class="signature-line">
                  <p class="signature-name">${schoolName || "School Name"}</p>
                  <p class="signature-label">School</p>
                </div>
              </div>
            </div>
            
            <div class="seal">
              <span class="seal-icon">⭐</span>
              <span class="seal-text">Certified</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <div 
        ref={certificateRef}
        className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 border-8 border-amber-900 rounded-lg p-6 aspect-[11/8.5] overflow-hidden"
      >
        {/* Inner border */}
        <div className="absolute inset-3 border-2 border-amber-700 rounded pointer-events-none" />
        <div className="absolute inset-5 border border-dashed border-amber-400 rounded pointer-events-none" />
        
        {/* Corner decorations */}
        <div className="absolute top-6 left-6 text-4xl opacity-30">🌾</div>
        <div className="absolute top-6 right-6 text-4xl opacity-30 scale-x-[-1]">🌾</div>
        <div className="absolute bottom-6 left-6 text-4xl opacity-30 scale-y-[-1]">🌾</div>
        <div className="absolute bottom-6 right-6 text-4xl opacity-30 scale-[-1]">🌾</div>

        {/* School Logo in Preview */}
        {schoolLogo && (
          <div className="absolute top-8 left-8 w-14 h-14 z-20">
            <img 
              src={schoolLogo} 
              alt="School Logo" 
              className="w-full h-full object-contain rounded"
            />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-between py-4">
          {/* Header */}
          <div className="text-center">
            <div className="text-4xl mb-2">{selectedAchievement?.icon || "🏆"}</div>
            <h1 className="font-display text-2xl md:text-3xl text-amber-900 font-bold uppercase tracking-wider">
              {getAchievementTitle()}
            </h1>
            <p className="text-amber-700 font-semibold text-sm">Wisconsin Food Explorer</p>
          </div>

          {/* Main Content */}
          <div className="text-center flex-1 flex flex-col justify-center py-4">
            <p className="text-amber-700 text-xs uppercase tracking-widest mb-2">
              This certificate is proudly presented to
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-green-800 font-bold border-b-2 border-amber-400 pb-2 px-4 inline-block mx-auto">
              {studentName || "Student Name"}
            </h2>
            <p className="text-amber-900 text-sm mt-4 max-w-md mx-auto leading-relaxed">
              {customMessage || getDefaultMessage()}
            </p>
            {defaultScore !== undefined && (
              <div className="mt-3 inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-amber-900 px-4 py-1 rounded-full font-bold text-sm">
                🏆 Score: {defaultScore} Points
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-around w-full px-4 text-center">
            <div>
              <div className="border-t-2 border-amber-900 pt-1 mt-4 min-w-[100px]">
                <p className="font-display text-sm text-amber-900 font-semibold">{teacherName || "Teacher Name"}</p>
                <p className="text-xs text-amber-700">Teacher</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-amber-900 font-semibold">
                {new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <p className="text-xs text-amber-700">Date Awarded</p>
            </div>
            <div>
              <div className="border-t-2 border-amber-900 pt-1 mt-4 min-w-[100px]">
                <p className="font-display text-sm text-amber-900 font-semibold">{schoolName || "School Name"}</p>
                <p className="text-xs text-amber-700">School</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seal */}
        <div className="absolute bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex flex-col items-center justify-center text-white shadow-lg">
          <Star className="w-6 h-6" />
          <span className="text-[8px] uppercase tracking-wider font-bold">Certified</span>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="studentName">Student Name *</Label>
          <Input
            id="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter student's name"
            className="border-amber-300 focus:border-green-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="achievementType">Achievement Type</Label>
          <Select value={achievementType} onValueChange={setAchievementType}>
            <SelectTrigger className="border-amber-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACHIEVEMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="teacherName">Teacher Name</Label>
          <Input
            id="teacherName"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder="Your name"
            className="border-amber-300 focus:border-green-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schoolName">School Name</Label>
          <Input
            id="schoolName"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="School name"
            className="border-amber-300 focus:border-green-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-amber-300 focus:border-green-500"
          />
        </div>

        {/* School Logo Upload */}
        <div className="space-y-2">
          <Label>School Logo (optional)</Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logoUpload"
            />
            {schoolLogo ? (
              <div className="flex items-center gap-2 flex-1 p-2 border border-amber-300 rounded-md bg-amber-50">
                <img src={schoolLogo} alt="Logo preview" className="w-8 h-8 object-contain" />
                <span className="text-sm text-amber-800 truncate flex-1">{logoFileName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeLogo}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-amber-300 hover:bg-amber-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, or SVG. Max 5MB.</p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customMessage">Custom Message (optional)</Label>
          <Textarea
            id="customMessage"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Leave blank to use the default message for the selected achievement type"
            className="border-amber-300 focus:border-green-500 min-h-[80px]"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end flex-wrap">
        {onClose && (
          <Button variant="outline" onClick={onClose} className="border-amber-300">
            Cancel
          </Button>
        )}
        <Button
          onClick={() => setIsEmailDialogOpen(true)}
          disabled={!studentName.trim()}
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <Mail className="w-4 h-4 mr-2" />
          Email Certificate
        </Button>
        <Button
          onClick={handlePrint}
          disabled={!studentName.trim()}
          className="bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 text-white"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Certificate
        </Button>
      </div>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Email Certificate
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sending certificate for:</Label>
              <p className="text-lg font-semibold text-green-700">{studentName}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Recipient Email *</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="parent@email.com"
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label>Send to:</Label>
              <RadioGroup value={recipientType} onValueChange={(v) => setRecipientType(v as "student" | "parent")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="parent" id="parent" />
                  <Label htmlFor="parent" className="font-normal cursor-pointer">Parent/Guardian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student" className="font-normal cursor-pointer">Student</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Email Template Customization */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-base font-semibold">Customize Email Template</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmailPreview(!showEmailPreview)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {showEmailPreview ? "Edit Template" : "Preview Email"}
                  </Button>
                </div>
              </div>

              {/* Template Selector */}
              {savedTemplates.length > 0 && (
                <div className="space-y-2">
                  <Label>Load Saved Template</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedTemplateId?.toString() || ""}
                      onValueChange={(value) => {
                        if (value) {
                          const template = savedTemplates.find(t => t.id === parseInt(value));
                          if (template) {
                            setSelectedTemplateId(template.id);
                            setEmailSubject(template.subject);
                            setEmailBody(template.body);
                            toast.success(`Loaded template: ${template.name}`);
                          }
                        } else {
                          setSelectedTemplateId(null);
                          setEmailSubject("");
                          setEmailBody("");
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1 border-blue-200">
                        <SelectValue placeholder="Select a saved template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {savedTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              {template.name}
                              {template.isDefault && (
                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Default</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTemplateId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Delete this template?")) {
                            deleteTemplateMutation.mutate({ id: selectedTemplateId });
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {!showEmailPreview ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="emailSubject">Email Subject</Label>
                    <Input
                      id="emailSubject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder={getDefaultEmailSubject()}
                      className="border-blue-200 focus:border-blue-500"
                    />
                    <p className="text-xs text-muted-foreground">Leave blank to use the default subject</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailBody">Email Body</Label>
                    <Textarea
                      id="emailBody"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder={getDefaultEmailBody()}
                      className="border-blue-200 focus:border-blue-500 min-h-[150px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Available variables: {'{student_name}'}, {'{achievement}'}, {'{teacher_name}'}, {'{school_name}'}, {'{date}'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Subject</p>
                    <p className="font-medium text-gray-900">
                      {replaceEmailVariables(emailSubject || getDefaultEmailSubject())}
                    </p>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Body</p>
                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                      {replaceEmailVariables(emailBody || getDefaultEmailBody())}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">📧 What will be sent:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Your customized email message</li>
                <li>Certificate as a downloadable attachment</li>
                <li>Link to view the certificate online</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsSaveTemplateDialogOpen(true)}
              disabled={!emailSubject && !emailBody}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Template
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={!recipientEmail || isSending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Template Dialog */}
      <Dialog open={isSaveTemplateDialogOpen} onOpenChange={setIsSaveTemplateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-green-600" />
              Save Email Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name *</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Parent Congratulations Email"
                className="border-green-200 focus:border-green-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="setAsDefault"
                checked={setAsDefault}
                onCheckedChange={(checked) => setSetAsDefault(checked === true)}
              />
              <Label htmlFor="setAsDefault" className="font-normal cursor-pointer">
                Set as default template for "{selectedAchievement?.label}"
              </Label>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              <p className="font-medium mb-1">💾 Template will include:</p>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>Email subject: {emailSubject ? emailSubject.substring(0, 40) + "..." : "(default)"}</li>
                <li>Email body: {emailBody ? emailBody.substring(0, 40) + "..." : "(default)"}</li>
                <li>Achievement type: {selectedAchievement?.label}</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!templateName.trim()) {
                  toast.error("Please enter a template name");
                  return;
                }
                createTemplateMutation.mutate({
                  name: templateName.trim(),
                  subject: emailSubject || getDefaultEmailSubject(),
                  body: emailBody || getDefaultEmailBody(),
                  achievementType: achievementType,
                  isDefault: setAsDefault,
                });
              }}
              disabled={!templateName.trim() || createTemplateMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {createTemplateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
