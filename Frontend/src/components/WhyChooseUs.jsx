import { Shield, Compass, Map, Star } from "lucide-react";

const WhyChooseUs = () => {
  const features = [
    {
      icon: <Compass size={32} />,
      title: "Local Expertise",
      desc: "Our guides are born and raised in the Himalayas, offering authentic spiritual insights.",
    },
    {
      icon: <Star size={32} />,
      title: "Spiritual Access",
      desc: "Exclusive access to monasteries and private meditation sessions with resident monks.",
    },
    {
      icon: <Shield size={32} />,
      title: "Seamless Travel",
      desc: "All-inclusive packages with premium transport and carefully handpicked cozy stays.",
    },
    {
      icon: <Map size={32} />,
      title: "Custom Journeys",
      desc: "Tailored itineraries that match your spiritual pace and travel interests.",
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">The <span className="text-teal-600">Monastery360</span> Difference</h2>
          <p className="text-lg text-slate-500 max-w-2xl font-medium mx-auto">We don't just organize tours; we curate life-changing spiritual and cultural experiences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-teal-600 group-hover:text-white transition-all duration-500 shadow-sm">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">{f.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
