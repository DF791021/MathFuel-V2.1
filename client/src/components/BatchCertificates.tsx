import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Upload, X, Users, FileText, Plus, Trash2, Star, ChevronLeft, ChevronRight, Mail, Send, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface StudentEntry {
  id: string;
  name: string;
  email?: string;
}

const ACHIEVEMENT_TYPES = [
  { value: "completion", label: "Game Completion", icon: "🎮" },
  { value: "nutrition_expert", label: "Nutrition Expert", icon: "🥗" },
  { value: "wisconsin_explorer", label: "Wisconsin Explorer", icon: "🧀" },
  { value: "healthy_champion", label: "Healthy Champion", icon: "💪" },
  { value: "food_safety_star", label: "Food Safety Star", icon: "⭐" },
];

export default function BatchCertificates() {
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [bulkInput, setBulkInput] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [achievementType, setAchievementType] = useState("completion");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>("");
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [recipientType, setRecipientType] = useState<"student" | "parent">("parent");
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState(0);
  const [isIssuingAll, setIsIssuingAll] = useState(false);
  const [issuedCertificates, setIssuedCertificates] = useState<Array<{certificateId: string; studentName: string; signature: string}>>([]);
  const [primaryColor, setPrimaryColor] = useState("#2E7D32");
  const [secondaryColor, setSecondaryColor] = useState("#1B5E20");

  const bulkIssueMutation = trpc.certificates.bulkIssue.useMutation({
    onSuccess: (data) => {
      setIssuedCertificates(data.certificates.filter(c => c.certificateId).map(c => ({
        certificateId: c.certificateId!,
        studentName: c.studentName,
        signature: c.signature || '',
      })));
      toast.success(`Issued ${data.count} verified certificates with QR codes!`);
      setIsIssuingAll(false);
    },
    onError: (error) => {
      toast.error(`Failed to issue certificates: ${error.message}`);
      setIsIssuingAll(false);
    },
  });

  const sendBatchEmailsMutation = trpc.certificates.sendBatchEmails.useMutation({
    onSuccess: (data) => {
      toast.success(`Sent ${data.summary.sent} certificate emails successfully!`);
      if (data.summary.failed > 0) {
        toast.warning(`${data.summary.failed} emails failed to send`);
      }
      setIsEmailDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to send emails: ${error.message}`);
    },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

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

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        const newStudents: StudentEntry[] = [];
        
        lines.forEach((line, index) => {
          // Skip header row if it looks like a header
          if (index === 0 && (line.toLowerCase().includes("name") || line.toLowerCase().includes("student"))) {
            return;
          }
          // Handle CSV with commas - take first column as name, second as email
          const parts = line.split(",");
          const name = parts[0].trim().replace(/^"|"$/g, "");
          const email = parts[1]?.trim().replace(/^"|"$/g, "") || "";
          if (name) {
            newStudents.push({
              id: `csv-${Date.now()}-${index}`,
              name,
              email: email.includes("@") ? email : undefined,
            });
          }
        });
        
        if (newStudents.length > 0) {
          setStudents(prev => [...prev, ...newStudents]);
          toast.success(`Added ${newStudents.length} students from CSV`);
        } else {
          toast.error("No valid student names found in CSV");
        }
      };
      reader.readAsText(file);
      if (csvInputRef.current) {
        csvInputRef.current.value = "";
      }
    }
  };

  const handleBulkAdd = () => {
    const lines = bulkInput.split(/\n/).map(n => n.trim()).filter(n => n);
    if (lines.length === 0) {
      toast.error("Please enter at least one student name");
      return;
    }
    
    const newStudents: StudentEntry[] = lines.map((line, index) => {
      // Support format: "Name, email@example.com" or just "Name"
      const parts = line.split(",");
      const name = parts[0].trim();
      const email = parts[1]?.trim() || "";
      return {
        id: `bulk-${Date.now()}-${index}`,
        name,
        email: email.includes("@") ? email : undefined,
      };
    });
    
    setStudents(prev => [...prev, ...newStudents]);
    setBulkInput("");
    toast.success(`Added ${lines.length} students`);
  };

  const removeStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    if (currentPreviewIndex >= students.length - 1 && currentPreviewIndex > 0) {
      setCurrentPreviewIndex(currentPreviewIndex - 1);
    }
  };

  const clearAllStudents = () => {
    setStudents([]);
    setCurrentPreviewIndex(0);
  };

  const getAchievementTitle = () => {
    switch (achievementType) {
      case "completion": return "Certificate of Completion";
      case "nutrition_expert": return "Nutrition Expert Award";
      case "wisconsin_explorer": return "Wisconsin Explorer Certificate";
      case "healthy_champion": return "Healthy Champion Award";
      case "food_safety_star": return "Food Safety Star Certificate";
      default: return "Certificate of Achievement";
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

  const handlePrintAll = () => {
    if (students.length === 0) {
      toast.error("Please add at least one student");
      return;
    }

    setIsPrinting(true);
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print certificates");
      setIsPrinting(false);
      return;
    }

    const certificatesHTML = students.map(student => `
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
          <h2 class="student-name">${student.name}</h2>
          <p class="message">${getDefaultMessage()}</p>
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
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Batch Certificates - ${students.length} Students</title>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Nunito', sans-serif;
              background: #f5f5f5;
            }
            .certificate {
              width: 11in;
              height: 8.5in;
              background: linear-gradient(135deg, #FDF8F3 0%, #FFF9E6 50%, #FDF8F3 100%);
              border: 12px solid #5D4E37;
              border-radius: 8px;
              padding: 40px;
              position: relative;
              page-break-after: always;
              margin: 0 auto;
            }
            .certificate:last-child {
              page-break-after: auto;
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
            .logo { font-size: 48px; margin-bottom: 10px; }
            .title {
              font-family: 'Playfair Display', serif;
              font-size: 42px;
              color: #5D4E37;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 4px;
              margin-bottom: 5px;
            }
            .subtitle { font-size: 18px; color: #8B7355; font-weight: 600; }
            .content { text-align: center; margin: 30px 60px; }
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
            .footer {
              display: flex;
              justify-content: space-around;
              align-items: flex-end;
              margin-top: 30px;
              padding: 0 40px;
            }
            .signature-block { text-align: center; min-width: 200px; }
            .signature-line {
              border-top: 2px solid #5D4E37;
              padding-top: 8px;
              margin-top: 30px;
            }
            .signature-label { font-size: 14px; color: #8B7355; }
            .signature-name {
              font-family: 'Playfair Display', serif;
              font-size: 20px;
              color: #5D4E37;
              font-weight: 600;
            }
            .date-block { text-align: center; }
            .date-value { font-size: 18px; color: #5D4E37; font-weight: 600; }
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
            }
            .seal-icon { font-size: 32px; }
            .seal-text { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
            .corner-decoration {
              position: absolute;
              font-size: 60px;
              opacity: 0.3;
            }
            .corner-tl { top: 30px; left: 30px; }
            .corner-tr { top: 30px; right: 30px; transform: scaleX(-1); }
            .corner-bl { bottom: 30px; left: 30px; transform: scaleY(-1); }
            .corner-br { bottom: 30px; right: 30px; transform: scale(-1); }
            @media print {
              body { background: white; }
              .certificate { 
                box-shadow: none;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${certificatesHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      setIsPrinting(false);
    }, 1000);
  };

  const currentStudent = students[currentPreviewIndex];

  return (
    <div className="space-y-6">
      {/* Student List Input Section */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 text-amber-900 font-semibold">
          <Users className="w-5 h-5" />
          <span>Add Students ({students.length} added)</span>
        </div>

        {/* Bulk Text Input */}
        <div className="space-y-2">
          <Label>Enter student names (one per line or comma-separated)</Label>
          <Textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder="John Smith&#10;Jane Doe&#10;Mike Johnson"
            className="min-h-[100px] border-amber-300"
          />
          <Button 
            onClick={handleBulkAdd}
            variant="outline"
            className="border-amber-400 hover:bg-amber-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Names
          </Button>
        </div>

        {/* CSV Upload */}
        <div className="flex items-center gap-2">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleCSVUpload}
            className="hidden"
            id="csvUpload"
          />
          <Button
            variant="outline"
            onClick={() => csvInputRef.current?.click()}
            className="border-amber-400 hover:bg-amber-100"
          >
            <FileText className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <span className="text-sm text-muted-foreground">
            Upload a CSV file with student names
          </span>
        </div>

        {/* Student List */}
        {students.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Student List</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllStudents}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
            <div className="max-h-[200px] overflow-y-auto border border-amber-200 rounded-lg bg-white">
              {students.map((student, index) => (
                <div 
                  key={student.id}
                  className={`flex items-center justify-between px-3 py-2 border-b border-amber-100 last:border-b-0 ${
                    index === currentPreviewIndex ? "bg-green-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                    <span className="text-amber-900">{student.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStudent(student.id)}
                    className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Certificate Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            className="border-amber-300"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schoolName">School Name</Label>
          <Input
            id="schoolName"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="School name"
            className="border-amber-300"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-amber-300"
          />
        </div>

        {/* School Logo Upload */}
        <div className="space-y-2 md:col-span-2">
          <Label>School Logo (optional)</Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="batchLogoUpload"
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
                className="border-amber-300 hover:bg-amber-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Preview */}
      {students.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Certificate Preview</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                disabled={currentPreviewIndex === 0}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPreviewIndex + 1} of {students.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPreviewIndex(Math.min(students.length - 1, currentPreviewIndex + 1))}
                disabled={currentPreviewIndex === students.length - 1}
                className="h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPreviewIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
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

              {/* School Logo */}
              {schoolLogo && (
                <div className="absolute top-8 left-8 w-14 h-14 z-20">
                  <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain rounded" />
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-between py-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">{selectedAchievement?.icon || "🏆"}</div>
                  <h1 className="font-display text-2xl md:text-3xl text-amber-900 font-bold uppercase tracking-wider">
                    {getAchievementTitle()}
                  </h1>
                  <p className="text-amber-700 font-semibold text-sm">Wisconsin Food Explorer</p>
                </div>

                <div className="text-center flex-1 flex flex-col justify-center py-4">
                  <p className="text-amber-700 text-xs uppercase tracking-widest mb-2">
                    This certificate is proudly presented to
                  </p>
                  <h2 className="font-display text-3xl md:text-4xl text-green-800 font-bold border-b-2 border-amber-400 pb-2 px-4 inline-block mx-auto">
                    {currentStudent?.name || "Student Name"}
                  </h2>
                  <p className="text-amber-900 text-sm mt-4 max-w-md mx-auto leading-relaxed">
                    {getDefaultMessage()}
                  </p>
                </div>

                <div className="flex justify-around w-full px-4 text-center">
                  <div>
                    <div className="border-t-2 border-amber-900 pt-1 mt-4 min-w-[120px]">
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
                    <div className="border-t-2 border-amber-900 pt-1 mt-4 min-w-[120px]">
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
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end gap-3">
        <Button
          onClick={() => {
            setIsIssuingAll(true);
            bulkIssueMutation.mutate({
              students: students.map(s => ({
                studentName: s.name,
                achievementType,
                email: s.email,
              })),
              teacherName: teacherName || undefined,
              schoolName: schoolName || undefined,
              schoolLogoUrl: schoolLogo || undefined,
              primaryColor,
              secondaryColor,
            });
          }}
          disabled={students.length === 0 || isIssuingAll}
          variant="outline"
          className="border-amber-500 text-amber-700 hover:bg-amber-50"
        >
          {isIssuingAll ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Issuing...
            </>
          ) : (
            <>
              <Star className="w-4 h-4 mr-2" />
              Issue All with QR ({students.length})
            </>
          )}
        </Button>
        <Button
          onClick={() => setIsEmailDialogOpen(true)}
          disabled={students.length === 0 || students.filter(s => s.email).length === 0}
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <Mail className="w-4 h-4 mr-2" />
          Email All ({students.filter(s => s.email).length})
        </Button>
        <Button
          onClick={handlePrintAll}
          disabled={students.length === 0 || isPrinting}
          className="bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 text-white"
        >
          {isPrinting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Preparing...
            </>
          ) : (
            <>
              <Printer className="w-4 h-4 mr-2" />
              Print All {students.length > 0 ? `(${students.length})` : ""} Certificates
            </>
          )}
        </Button>
      </div>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Email All Certificates
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Students with email addresses:</Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                {students.filter(s => s.email).map((student) => (
                  <div key={student.id} className="flex items-center justify-between text-sm p-1 bg-green-50 rounded">
                    <span className="font-medium">{student.name}</span>
                    <span className="text-muted-foreground">{student.email}</span>
                  </div>
                ))}
                {students.filter(s => !s.email).length > 0 && (
                  <div className="text-sm text-amber-600 mt-2 p-2 bg-amber-50 rounded">
                    ⚠️ {students.filter(s => !s.email).length} student(s) without email will be skipped
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Send to:</Label>
              <RadioGroup value={recipientType} onValueChange={(v) => setRecipientType(v as "student" | "parent")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="parent" id="batch-parent" />
                  <Label htmlFor="batch-parent" className="font-normal cursor-pointer">Parent/Guardian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="batch-student" />
                  <Label htmlFor="batch-student" className="font-normal cursor-pointer">Student</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">📧 Each recipient will receive:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Personalized certificate for their student</li>
                <li>Achievement details and congratulations</li>
                <li>Link to view and download the certificate</li>
              </ul>
            </div>

            {isSendingEmails && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sending emails...</span>
                  <span>{emailProgress} / {students.filter(s => s.email).length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${(emailProgress / students.filter(s => s.email).length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)} disabled={isSendingEmails}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                const studentsWithEmail = students.filter(s => s.email);
                if (studentsWithEmail.length === 0) {
                  toast.error("No students have email addresses");
                  return;
                }
                setIsSendingEmails(true);
                setEmailProgress(0);
                try {
                  await sendBatchEmailsMutation.mutateAsync({
                    students: studentsWithEmail.map(s => ({ name: s.name, email: s.email! })),
                    recipientType,
                    achievementType,
                    teacherName: teacherName || "Teacher",
                    schoolName: schoolName || "School",
                    date: new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
                  });
                } finally {
                  setIsSendingEmails(false);
                }
              }}
              disabled={students.filter(s => s.email).length === 0 || isSendingEmails}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSendingEmails ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send {students.filter(s => s.email).length} Emails
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
