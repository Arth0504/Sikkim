import arthImg from "../assets/TeemM/Arth.jpg";
import sagarImg from "../assets/TeemM/sagar.jpg";
import sejalImg from "../assets/TeemM/Sejalmem.png";
import { Mail } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

const OurTeam = () => {
  const team = [
    {
      name: "Arth Prajapati",
      role: "Lead Developer",
      image: arthImg,
      desc: "Architect of the Monastery360 platform, specialized in MERN stack development, backend architecture, database design, and immersive UI/UX experiences.",
    },
    {
      name: "Sagar Mehta",
      role: "Operations Support",
      image: sagarImg,
      desc: "Ensuring smooth platform operations and coordinating with local travel partners in Sikkim.",
    },
  ];

  const mentor = {
    name: "Dr. Sejal Haveliwala",
    role: "Faculty Mentor",
    image: sejalImg,
    desc: "Faculty Mentor and Academic Guide for the Monastery360 project, providing valuable guidance, mentorship, and domain expertise throughout the development journey.",
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Meet Our <span className="text-teal-600">Team</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl font-medium mx-auto">
            The passionate individuals behind the platform, dedicated to connecting you with the heart of Sikkim.
          </p>
        </div>

        {/* Core Team Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto justify-items-center mb-16">
          {team.map((member, i) => (
            <div key={i} className="w-full flex flex-col items-center">
              <div className="flip-card w-[320px] h-[420px]">
                <div className="flip-card-inner">
                  {/* FRONT: Large Image + Name/Role Overlaid */}
                  <div className="flip-card-front relative shadow-md">
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-end p-6">
                      <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                      <p className="text-teal-400 text-xs font-black uppercase tracking-[0.2em]">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  {/* BACK: Description + Social Links */}
                  <div className="flip-card-back flex flex-col justify-between p-8 text-center bg-slate-900 border-2 border-teal-600 rounded-[3rem]">
                    <div className="space-y-4">
                      <span className="text-teal-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        {member.role}
                      </span>
                      <h3 className="text-xl font-black text-white">{member.name}</h3>
                      <hr className="w-10 border-teal-500/30 mx-auto" />
                      <p className="text-slate-300 text-sm leading-relaxed font-medium pt-2">
                        {member.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-6">
                      <a
                        href="#"
                        className="w-10 h-10 rounded-full bg-white/5 text-slate-300 hover:bg-teal-600 hover:text-white hover:scale-110 transition-all flex items-center justify-center border border-white/10"
                      >
                        <FaLinkedin size={18} />
                      </a>
                      <a
                        href="#"
                        className="w-10 h-10 rounded-full bg-white/5 text-slate-300 hover:bg-teal-600 hover:text-white hover:scale-110 transition-all flex items-center justify-center border border-white/10"
                      >
                        <FaGithub size={18} />
                      </a>
                      <a
                        href="#"
                        className="w-10 h-10 rounded-full bg-white/5 text-slate-300 hover:bg-teal-600 hover:text-white hover:scale-110 transition-all flex items-center justify-center border border-white/10"
                      >
                        <Mail size={18} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mentor Section */}
        <div className="mt-12 pt-8 border-t border-slate-100 text-center flex flex-col items-center animate-on-scroll">
          <span className="text-teal-600 text-xs font-black uppercase tracking-[0.3em] mb-6">Project Mentor</span>
          
          {/* Photo above name */}
          <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-teal-600/20 hover:border-teal-600 shadow-xl mb-6 shrink-0 transition-all duration-300 hover:scale-105 cursor-pointer">
            <img src={mentor.image} alt={mentor.name} className="w-full h-full object-cover" />
          </div>

          <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{mentor.name}</h3>
          <p className="text-slate-500 text-lg font-bold uppercase tracking-widest mt-2">{mentor.role}</p>
          <p className="text-slate-600 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto font-medium mt-6">
            {mentor.desc}
          </p>
        </div>
      </div>
    </section>
  );
};

export default OurTeam;
