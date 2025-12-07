import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShieldCheck, ShieldX, Loader2, Home, Award, Calendar, 
  User, School, FileText, Clock, AlertTriangle, CheckCircle2
} from "lucide-react";

export default function VerifyCertificate() {
  const { id } = useParams<{ id: string }>();
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "valid" | "invalid" | "revoked">("loading");

  const { data: certificate, isLoading, error } = trpc.certificates.verify.useQuery(
    { certificateId: id || "" },
    { enabled: !!id }
  );

  useEffect(() => {
    if (isLoading) {
      setVerificationStatus("loading");
    } else if (error || !certificate) {
      setVerificationStatus("invalid");
    } else if (certificate.revokedAt) {
      setVerificationStatus("revoked");
    } else {
      setVerificationStatus("valid");
    }
  }, [certificate, isLoading, error]);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAchievementTitle = (type: string) => {
    const titles: Record<string, string> = {
      completion: "Game Completion Certificate",
      nutrition_expert: "Nutrition Expert Award",
      wisconsin_explorer: "Wisconsin Explorer Certificate",
      healthy_champion: "Healthy Champion Award",
      food_safety_star: "Food Safety Star Certificate",
    };
    return titles[type] || "Certificate of Achievement";
  };

  const getAchievementIcon = (type: string) => {
    const icons: Record<string, string> = {
      completion: "🎮",
      nutrition_expert: "🥗",
      wisconsin_explorer: "🧀",
      healthy_champion: "💪",
      food_safety_star: "⭐",
    };
    return icons[type] || "🏆";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-800 to-green-700 text-white py-4 px-6 shadow-lg">
        <div className="container flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <span className="text-2xl">🌽</span>
              <span className="font-display text-xl font-bold">Wisconsin Food Explorer</span>
            </a>
          </Link>
          <Link href="/">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Home className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Verification Status Card */}
          <Card className="border-2 shadow-xl overflow-hidden">
            {/* Status Banner */}
            <div className={`py-6 px-8 text-center ${
              verificationStatus === "loading" ? "bg-gray-100" :
              verificationStatus === "valid" ? "bg-gradient-to-r from-green-600 to-green-500" :
              verificationStatus === "revoked" ? "bg-gradient-to-r from-orange-600 to-orange-500" :
              "bg-gradient-to-r from-red-600 to-red-500"
            }`}>
              {verificationStatus === "loading" ? (
                <div className="flex flex-col items-center text-gray-600">
                  <Loader2 className="w-16 h-16 animate-spin mb-3" />
                  <h2 className="text-xl font-bold">Verifying Certificate...</h2>
                  <p className="text-sm opacity-80">Please wait while we check the authenticity</p>
                </div>
              ) : verificationStatus === "valid" ? (
                <div className="flex flex-col items-center text-white">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <ShieldCheck className="w-20 h-20 mb-3" />
                  </motion.div>
                  <h2 className="text-2xl font-bold">Certificate Verified</h2>
                  <p className="text-sm opacity-90 mt-1">This is an authentic Wisconsin Food Explorer certificate</p>
                </div>
              ) : verificationStatus === "revoked" ? (
                <div className="flex flex-col items-center text-white">
                  <AlertTriangle className="w-20 h-20 mb-3" />
                  <h2 className="text-2xl font-bold">Certificate Revoked</h2>
                  <p className="text-sm opacity-90 mt-1">This certificate has been revoked by the issuer</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-white">
                  <ShieldX className="w-20 h-20 mb-3" />
                  <h2 className="text-2xl font-bold">Certificate Not Found</h2>
                  <p className="text-sm opacity-90 mt-1">This certificate ID does not exist in our system</p>
                </div>
              )}
            </div>

            {/* Certificate Details */}
            {certificate && verificationStatus !== "invalid" && (
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <span className="text-5xl mb-3 block">{getAchievementIcon(certificate.achievementType)}</span>
                  <h3 className="font-display text-2xl text-amber-900 font-bold">
                    {getAchievementTitle(certificate.achievementType)}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                    <User className="w-5 h-5 text-amber-700" />
                    <div>
                      <p className="text-xs text-amber-600 uppercase tracking-wider">Awarded To</p>
                      <p className="font-semibold text-amber-900">{certificate.studentName}</p>
                    </div>
                  </div>

                  {certificate.schoolName && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <School className="w-5 h-5 text-green-700" />
                      <div>
                        <p className="text-xs text-green-600 uppercase tracking-wider">School</p>
                        <p className="font-semibold text-green-900">{certificate.schoolName}</p>
                      </div>
                    </div>
                  )}

                  {certificate.teacherName && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Award className="w-5 h-5 text-blue-700" />
                      <div>
                        <p className="text-xs text-blue-600 uppercase tracking-wider">Issued By</p>
                        <p className="font-semibold text-blue-900">{certificate.teacherName}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-700" />
                    <div>
                      <p className="text-xs text-purple-600 uppercase tracking-wider">Date Issued</p>
                      <p className="font-semibold text-purple-900">{formatDate(certificate.issuedAt)}</p>
                    </div>
                  </div>

                  {certificate.customMessage && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-700 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wider">Message</p>
                        <p className="text-gray-900">{certificate.customMessage}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Verification Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified {certificate.verificationCount} time{certificate.verificationCount !== 1 ? 's' : ''}</span>
                    </div>
                    {certificate.lastVerifiedAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Last checked: {formatDate(certificate.lastVerifiedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificate ID */}
                <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Certificate ID</p>
                  <p className="font-mono text-lg font-bold text-gray-800">{certificate.certificateId}</p>
                  <p className="text-xs text-gray-400 mt-1">Signature: {certificate.signature?.substring(0, 16)}...</p>
                </div>
              </CardContent>
            )}

            {/* Invalid Certificate Message */}
            {verificationStatus === "invalid" && (
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 mb-4">
                  The certificate ID <span className="font-mono font-bold">{id}</span> was not found in our database.
                </p>
                <p className="text-sm text-gray-500">
                  This could mean the certificate is fake, the ID was entered incorrectly, or the certificate has been deleted.
                </p>
                <Link href="/">
                  <Button className="mt-6 bg-green-700 hover:bg-green-800">
                    <Home className="w-4 h-4 mr-2" />
                    Return to Home
                  </Button>
                </Link>
              </CardContent>
            )}
          </Card>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-white/80 rounded-lg border border-amber-200 text-center">
            <p className="text-sm text-amber-800">
              <strong>Wisconsin Food Explorer</strong> certificates include QR codes and digital signatures 
              to prevent forgery and ensure authenticity.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
