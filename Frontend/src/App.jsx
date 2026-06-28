import { Routes, Route, Navigate, useLocation, useNavigationType } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// ✅ USER PAGES
import Home from "./pages/Home";
import Packages from "./pages/Packages";
import CustomBuilder from "./pages/CustomBuilder";
import PackageDetails from "./pages/PackageDetails";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import MyBookings from "./pages/MyBookings";
import Wishlist from "./pages/Wishlist";
import Festivals from "./pages/Festivals";
import FestivalDetails from "./pages/FestivalDetails";
import Monasteries from "./pages/Monasteries";
import MonasteryDetails from "./pages/MonasteryDetails";
import MonasteryTour from "./pages/MonasteryTour";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CancellationPolicy from "./pages/CancellationPolicy";
import OurTeam from "./components/OurTeam";
import Itinerary from "./pages/Itinerary";
import Compare from "./pages/Compare";
import TravelInsurance from "./pages/TravelInsurance";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

// ✅ ADMIN
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminPackages from "./admin/AdminPackages";
import AdminBookings from "./admin/AdminBookings";
import AdminMonasteries from "./admin/AdminMonasteries";
import AdminFestivals from "./admin/AdminFestivals";
import AdminPayments from "./admin/AdminPayments";
import AdminPolicy from "./admin/AdminPolicy";
import AdminLogin from "./admin/AdminLogin";
import AdminUsers from "./admin/AdminUsers";

// ✅ NEW ADMIN PAGE (Cancel Requests)
import AdminCancelRequests from "./admin/AdminCancelRequests";
import AdminQueries from "./admin/AdminQueries";
import AdminReviews from "./admin/AdminReviews";
import AdminReminders from "./admin/AdminReminders";
import AdminNotifications from "./admin/AdminNotifications";
import AdminDrivers from "./admin/AdminDrivers";
import AdminAnalytics from "./admin/AdminAnalytics";
import AdminCustomRequests from "./admin/AdminCustomRequests";

import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Restore auth state on app load (Remember Me session restoration)
  useEffect(() => {
    const localToken = localStorage.getItem("adminToken") || localStorage.getItem("userToken");
    const localRole = localStorage.getItem("role");

    if (localToken && localRole) {
      if (localRole === "admin") {
        sessionStorage.setItem("adminToken", localToken);
      } else {
        sessionStorage.setItem("userToken", localToken);
      }
      sessionStorage.setItem("role", localRole);
    } else {
      const token = sessionStorage.getItem("adminToken") || sessionStorage.getItem("userToken");
      const role = sessionStorage.getItem("role");
      if (!token || !role) {
        sessionStorage.clear();
        localStorage.clear();
      }
    }
  }, []);

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />
      {/* ✅ Navbar only for user routes */}
      {!isAdminRoute && <Navbar />}

      <Routes>
        {/* ================= ADMIN ================= */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="monasteries" element={<AdminMonasteries />} />
            <Route path="festivals" element={<AdminFestivals />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="policy" element={<AdminPolicy />} />
            <Route path="users" element={<AdminUsers />} />
            {/* ✅ NEW */}
            <Route path="cancel-requests" element={<AdminCancelRequests />} />
            <Route path="custom-requests" element={<AdminCustomRequests />} />
            <Route path="queries" element={<AdminQueries />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="reminders" element={<AdminReminders />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Route>

        {/* ================= USER ================= */}
        <Route path="/" element={<Home />} />

        <Route path="/packages" element={<Packages />} />
        <Route path="/packages/:id" element={<PackageDetails />} />
        <Route path="/custom-builder" element={<CustomBuilder />} />
        <Route path="/booking/:id" element={<Booking />} />
        <Route path="/payment/:bookingId" element={<Payment />} />
        <Route path="/itinerary/:bookingId" element={<Itinerary />} />
        <Route path="/compare" element={<Compare />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Route>
        <Route
          path="/cancellation-policy"
          element={<CancellationPolicy />}
        />
        <Route
          path="/travel-insurance"
          element={<TravelInsurance />}
        />
        <Route
          path="/privacy-policy"
          element={<PrivacyPolicy />}
        />
        <Route
          path="/terms-of-service"
          element={<TermsOfService />}
        />

        {/* ✅ Our Team */}
        <Route path="/our-team" element={<OurTeam />} />

        {/* ✅ Monasteries */}
        <Route
          path="/Monastries"
          element={<Navigate to="/monasteries" replace />}
        />
        <Route path="/monasteries" element={<Monasteries />} />
        <Route path="/monasteries/:id" element={<MonasteryDetails />} />
        <Route path="/monasteries/:id/tour" element={<MonasteryTour />} />

        {/* ✅ Festivals */}
        <Route path="/festivals" element={<Festivals />} />
        <Route path="/festivals/:id" element={<FestivalDetails />} />

        {/* ✅ Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ✅ fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ✅ Footer only for user routes */}
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
