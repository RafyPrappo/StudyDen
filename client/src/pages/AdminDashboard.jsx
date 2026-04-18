import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/ui/Container";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { adminApi } from "../services/admin";
import { Shield, Users, CheckCircle2, MapPin, Flag, Loader2, ArrowRight } from "lucide-react";

const adminSections = [
  {
    key: "members",
    title: "Members",
    description: "View and manage registered users of the platform.",
    icon: Users,
    actionLabel: "Open Members",
    enabled: false,
  },
  {
    key: "approvals",
    title: "Approvals",
    description: "Review admin-side approvals and moderation-related actions.",
    icon: CheckCircle2,
    actionLabel: "Open Approvals",
    enabled: true,
  },
  {
    key: "spots",
    title: "Spots",
    description: "Search nearby places and import selected places as study spots.",
    icon: MapPin,
    actionLabel: "Import Spots",
    enabled: true, //Barikoi import
  },
  {
    key: "reports",
    title: "Reported Spots",
    description: "Review and resolve user-reported study spots.",
    icon: Flag,
    actionLabel: "View Reports",
    enabled: true, //AdminReports
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await adminApi.getDashboard();
        setAdminInfo(data.admin || null);
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
        setError(err.message || "Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const handleSectionClick = (sectionKey) => {
    if (sectionKey === "members") {
      // Future implementation
      return;
    }
    if (sectionKey === "approvals") {
      navigate("/admin/spots/verify");
      return;
    }
    if (sectionKey === "spots") {
      navigate("/admin/spots"); //Barikoi import
      return;
    }
    if (sectionKey === "reports") {
      navigate("/admin/reports"); //Reported spots
      return;
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 size={36} className="animate-spin text-blue-600" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="max-w-3xl mx-auto mt-10">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 text-sm font-medium mb-4">
            <Shield size={16} />
            Admin Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Welcome, {adminInfo?.name || "Admin"}</h1>
          <p className="text-gray-600 max-w-2xl">
            Manage platform-level tools from one place. Keep this dashboard modular and use each section for a dedicated admin workflow.
          </p>
          {adminInfo?.email && <p className="text-sm text-gray-400 mt-2">Signed in as {adminInfo.email}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.key} className="p-6 border border-gray-100 hover:border-blue-200 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Icon size={22} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{section.title}</h2>
                <p className="text-gray-600 text-sm leading-6 mb-6">{section.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full border ${section.enabled ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                    {section.enabled ? "Ready" : "Coming soon"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleSectionClick(section.key)}
                    disabled={!section.enabled}
                    className="border border-gray-200"
                  >
                    {section.actionLabel}
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Container>
  );
}