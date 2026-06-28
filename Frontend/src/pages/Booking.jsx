import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Users, Phone, CheckCircle, ArrowLeft, Loader2, User, MapPin, Shield, Camera, Plus, Trash2 } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError, showWarning } from "../utils/toast";
import BookingReceipt from "../components/BookingReceipt";
import { DetailSkeleton } from "../components/SkeletonLoader";

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const [form, setForm] = useState({
    travelStartDate: "",
    persons: 1,
    specialRequest: "",
    firstName: "",
    lastName: "",
    mobile: "",
    age: "",
    address: "",
    idProofType: "Aadhaar",
    idProofNumber: "",
    paymentMethod: "online",
  });

  const [travellers, setTravellers] = useState([]);
  const [passportPhoto, setPassportPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    API.get(`/packages/${id}`)
      .then((res) => {
        setPkg(res.data);
        setInitialLoading(false);
      })
      .catch(() => {
        setInitialLoading(false);
      });
  }, [id]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTravellerChange = (index, field, value) => {
    const updated = [...travellers];
    updated[index][field] = value;
    setTravellers(updated);
  };

  const addTraveller = () => {
    if (travellers.length < Number(form.persons) - 1) {
      setTravellers([...travellers, { name: "", age: "" }]);
    }
  };

  const removeTraveller = (index) => {
    setTravellers(travellers.filter((_, i) => i !== index));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ✅ File Type Validation
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        showError("Only JPG, PNG, or WEBP images are allowed.");
        e.target.value = ""; // Reset input
        return;
      }

      // ✅ Optional: File Size Warning
      if (file.size > 10 * 1024 * 1024) {
        showWarning("Large file detected. Upload might take some time.");
      }

      setPassportPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Validate travel start date (7+ days from today)
    if (!form.travelStartDate) {
      showError("Please select a travel start date.");
      return;
    }
    const startDate = new Date(form.travelStartDate);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 7);
    minDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    if (startDate < minDate) {
      showError("Travel start date must be at least 7 days from today.");
      return;
    }

    // Validate phone number
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(form.mobile)) {
      showError("Please enter a valid 10-digit mobile number starting with 6-9.");
      return;
    }

    // Validate primary traveler age
    const ageNum = Number(form.age);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 80) {
      showError("Primary traveler age must be between 13 and 80.");
      return;
    }

    // Validate ID proof number
    if (!form.idProofNumber.trim()) {
      showError("Please enter an ID proof number.");
      return;
    }

    // Validate additional travelers details
    const personsNum = Number(form.persons);
    const primaryTraveller = { name: `${form.firstName} ${form.lastName}`.trim(), age: form.age };
    const allTravellers = [primaryTraveller, ...travellers];

    if (allTravellers.length !== personsNum) {
      showError(`Please provide details for all ${personsNum} traveler(s).`);
      return;
    }

    for (let i = 1; i < allTravellers.length; i++) {
      const t = allTravellers[i];
      if (!t.name.trim()) {
        showError(`Please enter a name for traveler ${i + 1}.`);
        return;
      }
      const tAge = Number(t.age);
      if (isNaN(tAge) || tAge < 1 || tAge > 100) {
        showError(`Please enter a valid age (1-100) for traveler ${i + 1}.`);
        return;
      }
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem("userToken");
      if (!token) {
        showError("Please login to book!");
        setLoading(false);
        return navigate("/login");
      }

      if (!passportPhoto) {
        showError("Please upload a passport photo.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      formData.append("packageId", id);
      formData.append("passportPhoto", passportPhoto);
      formData.append("travellers", JSON.stringify(allTravellers));

      const res = await API.post("/bookings", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (form.paymentMethod === "cash") {
        showSuccess("Booking Created Successfully! Payment pending.");
        setConfirmedBooking(res.data.booking);
      } else {
        showSuccess("Booking Created! Proceeding to Payment...");
        navigate(`/payment/${res.data.booking._id}`);
      }
    } catch (err) {
      showError(err.response?.data?.message || "Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <DetailSkeleton />;

  if (!pkg) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest">Package Not Found</div>;

  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-24 flex items-center justify-center">
        <BookingReceipt
          booking={{ ...confirmedBooking, package: pkg }}
          onClose={() => navigate("/my-bookings")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-xs mb-10 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Package
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* LEFT: FORM */}
          <div className="lg:col-span-8 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* SECTION: PRIMARY TRAVELER */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 md:p-14 shadow-2xl shadow-slate-200/50">
                <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <User className="text-teal-600" /> Primary Traveler Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                    <input name="firstName" value={form.firstName} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-900 font-medium" placeholder="e.g. John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                    <input name="lastName" value={form.lastName} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-900 font-medium" placeholder="e.g. Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Mobile Number</label>
                    <input name="mobile" type="tel" value={form.mobile} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-900 font-medium" placeholder="10 Digit Number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Age</label>
                    <input name="age" type="number" value={form.age} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-900 font-medium" placeholder="13 - 80" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2"><MapPin size={12} /> Permanent Address</label>
                    <textarea name="address" value={form.address} onChange={handleInputChange} required rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-900 font-medium" placeholder="Full address for booking records..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">ID Proof Type</label>
                    <select name="idProofType" value={form.idProofType} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-900 font-medium">
                      <option value="Aadhaar">Aadhar Card</option>
                      <option value="VoterID">Voter ID</option>
                      <option value="Passport">Passport</option>
                      <option value="DrivingLicense">Driving License</option>
                      <option value="PAN">PAN Card</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">ID Proof Number</label>
                    <input name="idProofNumber" value={form.idProofNumber} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-900 font-medium" placeholder="Enter ID number" />
                  </div>
                </div>
              </div>

              {/* SECTION: JOURNEY DETAILS */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 md:p-14 shadow-2xl shadow-slate-200/50">
                <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <Calendar className="text-teal-600" /> Journey Specifications
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Travel Start Date</label>
                    <input type="date" name="travelStartDate" value={form.travelStartDate} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-900 font-medium" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">* Must be 7+ days from today</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Total Persons</label>
                    <input type="number" name="persons" value={form.persons} min="1" max="10" onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-900 font-medium" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Payment Method</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-all ${form.paymentMethod === 'online' ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <input type="radio" name="paymentMethod" value="online" checked={form.paymentMethod === 'online'} onChange={handleInputChange} className="hidden" />
                        Pay Now (Online)
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-all ${form.paymentMethod === 'cash' ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <input type="radio" name="paymentMethod" value="cash" checked={form.paymentMethod === 'cash'} onChange={handleInputChange} className="hidden" />
                        Pay Later (Cash)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: ALL TRAVELLERS */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 md:p-14 shadow-2xl shadow-slate-200/50">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Users className="text-teal-600" /> Travelers List
                  </h2>
                  {Number(form.persons) > 1 && (
                    <button
                      type="button"
                      onClick={addTraveller}
                      disabled={travellers.length >= Number(form.persons) - 1}
                      className="text-xs font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 disabled:opacity-30 flex items-center gap-1"
                    >
                      <Plus size={16} /> Add Traveler
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Primary traveller — read-only, auto-filled from form */}
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          value={`${form.firstName} ${form.lastName}`.trim() || "Primary Traveler"}
                          readOnly
                          className="w-full bg-teal-50 border border-teal-100 rounded-xl px-5 py-3.5 text-slate-700 font-bold cursor-not-allowed"
                        />
                        <span className="absolute -top-2 left-3 bg-teal-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Primary</span>
                      </div>
                      <input
                        value={form.age || ""}
                        readOnly
                        placeholder="Age (from above)"
                        className="bg-teal-50 border border-teal-100 rounded-xl px-5 py-3.5 text-slate-700 font-bold cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Additional travellers */}
                  {travellers.map((t, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          placeholder={`Traveler ${index + 2} Name`}
                          value={t.name}
                          onChange={(e) => handleTravellerChange(index, "name", e.target.value)}
                          required
                          className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-900 font-medium"
                        />
                        <input
                          type="number"
                          placeholder="Age"
                          value={t.age}
                          onChange={(e) => handleTravellerChange(index, "age", e.target.value)}
                          required
                          className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-900 font-medium"
                        />
                      </div>
                      <button type="button" onClick={() => removeTraveller(index)} className="p-4 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}

                  {Number(form.persons) > 1 && travellers.length < Number(form.persons) - 1 && (
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                      Add {Number(form.persons) - 1 - travellers.length} more traveler(s) to match your persons count.
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION: PASSPORT PHOTO */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 md:p-14 shadow-2xl shadow-slate-200/50">
                <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <Shield className="text-teal-600" /> Identity Verification
                </h2>
                <div className="flex flex-col md:flex-row gap-10 items-center">
                  <div className="flex-1 space-y-4">
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                      Please upload a clear passport-sized photograph of the primary traveler. This is required for permits and monastery access.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1">
                        <Shield size={10} /> Important Requirement
                      </p>
                      <p className="text-xs font-bold text-amber-700">
                        Only single person photo allowed. Group photos or photos without faces will be automatically rejected.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl cursor-pointer hover:bg-slate-800 transition-all">
                      <Camera size={18} /> Select Photo
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" required={!passportPhoto} />
                    </label>
                  </div>
                  <div className="w-48 h-48 rounded-3xl border-4 border-dashed border-slate-100 flex items-center justify-center overflow-hidden bg-slate-50 relative group">
                    {photoPreview ? (
                      <img src={photoPreview} className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={40} className="text-slate-200" />
                    )}
                    {photoPreview && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">
                        Change
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="inline-flex items-center justify-center gap-3 px-8 py-6 bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-widest rounded-[2rem] transition-all duration-300 w-full shadow-2xl shadow-teal-600/20 disabled:opacity-50 disabled:translate-y-0 active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Confirm & Proceed to Payment"}
              </button>
            </form>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
                <div className="aspect-square rounded-3xl overflow-hidden mb-8 shadow-2xl">
                  <img src={pkg.image} className="w-full h-full object-cover" alt={pkg.name} />
                </div>
                <h3 className="text-2xl font-black mb-2 leading-tight">{pkg.name}</h3>
                <div className="flex items-center gap-2 text-teal-400 text-xs font-black uppercase tracking-widest mb-8">
                  <MapPin size={14} /> Sikkim Himalayas
                </div>
                
                <div className="space-y-4 pt-8 border-t border-white/10">
                  <div className="flex justify-between items-center text-white/60">
                    <span className="text-xs font-bold uppercase tracking-widest">Base Price</span>
                    <span className="font-bold">₹{pkg.price}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/60">
                    <span className="text-xs font-bold uppercase tracking-widest">Travelers</span>
                    <span className="font-bold">x {form.persons}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-lg font-black uppercase tracking-widest">Total Payable</span>
                    <span className="text-3xl font-black text-teal-500">₹{pkg.price * form.persons}</span>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-[2rem] bg-white border border-slate-200 text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Secure Reservation</p>
                <div className="flex justify-center gap-4 opacity-40 grayscale">
                  <span className="text-[10px] font-bold">UPI</span>
                  <span className="text-[10px] font-bold">CARDS</span>
                  <span className="text-[10px] font-bold">NETBANKING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;