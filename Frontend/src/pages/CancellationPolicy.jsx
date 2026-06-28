import { useEffect, useState } from "react";
import { ShieldCheck, Info, Loader2 } from "lucide-react";
import API from "../services/api";
import { DetailSkeleton } from "../components/SkeletonLoader";

const CancellationPolicy = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/policy")
      .then((res) => {
        setPolicy(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <DetailSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-teal-600/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{policy?.title || "Cancellation Policy"}</h1>
          <p className="text-slate-500 font-medium">Transparent terms for a worry-free spiritual journey</p>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 md:p-16">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap font-medium">
              {policy?.description || "Policy details are being updated. Please contact support for more information."}
            </p>
          </div>

          <div className="mt-16 pt-10 border-t border-slate-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
              <Info size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 mb-1">Need Clarification?</p>
              <p className="text-sm text-slate-500 font-medium">If you have any questions regarding these terms, please reach out to our travel support desk at support@monastery360.com.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicy;
