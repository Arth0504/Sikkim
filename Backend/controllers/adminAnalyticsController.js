import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Package from '../models/Package.js';
import Monastery from '../models/Monastery.js';
import Festival from '../models/Festival.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Review from '../models/Review.js';
import FestivalReminder from '../models/FestivalReminder.js';
import CustomReservation from '../models/CustomReservation.js';

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const getAnalyticsDashboard = async (req, res) => {
  try {
    // -------------------------------------------------------------
    // 1. BOOKING TREND ANALYSIS
    // -------------------------------------------------------------
    // Chronological bookings grouped by year & month of travelStartDate
    const bookingChronologicalRaw = await Booking.aggregate([
      { $match: { bookingStatus: { $ne: "cancelled" } } },
      {
        $group: {
          _id: {
            year: { $year: "$travelStartDate" },
            month: { $month: "$travelStartDate" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const bookingChronological = bookingChronologicalRaw.map(item => ({
      month: `${MONTH_SHORT[item._id.month]} ${item._id.year}`,
      bookings: item.count
    }));

    // Seasonal booking counts (month of year) to detect peak/lowest
    const bookingSeasonality = await Booking.aggregate([
      { $match: { bookingStatus: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $month: "$travelStartDate" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Map seasonality count back to all 12 calendar months
    const seasonalityMap = Array.from({ length: 12 }, (_, i) => ({
      month: MONTH_NAMES[i + 1],
      monthShort: MONTH_SHORT[i + 1],
      bookings: 0
    }));

    bookingSeasonality.forEach(item => {
      seasonalityMap[item._id - 1].bookings = item.count;
    });

    // Peak & Lowest months calculation
    let peakBookingMonths = [];
    let lowestBookingMonths = [];

    if (bookingSeasonality.length > 0) {
      const sortedSeasonality = [...bookingSeasonality].sort((a, b) => b.count - a.count);
      const maxBookings = sortedSeasonality[0].count;
      const minBookings = sortedSeasonality[sortedSeasonality.length - 1].count;

      peakBookingMonths = sortedSeasonality
        .filter(item => item.count === maxBookings)
        .map(item => MONTH_NAMES[item._id]);

      lowestBookingMonths = sortedSeasonality
        .filter(item => item.count === minBookings)
        .map(item => MONTH_NAMES[item._id]);
    }

    // -------------------------------------------------------------
    // 2. REVENUE ANALYTICS
    // -------------------------------------------------------------
    // Total Revenue & average booking value
    const revenueAgg = await Payment.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          avgBookingValue: { $avg: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const avgBookingValue = revenueAgg[0]?.avgBookingValue || 0;

    // Monthly revenue timeline
    const monthlyRevenueRaw = await Payment.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthlyRevenue = monthlyRevenueRaw.map(item => ({
      month: `${MONTH_SHORT[item._id.month]} ${item._id.year}`,
      revenue: item.revenue
    }));

    let highestRevenueMonth = "N/A";
    let highestRevenueValue = 0;

    if (monthlyRevenueRaw.length > 0) {
      const sortedRevenue = [...monthlyRevenueRaw].sort((a, b) => b.revenue - a.revenue);
      highestRevenueMonth = `${MONTH_NAMES[sortedRevenue[0]._id.month]} ${sortedRevenue[0]._id.year}`;
      highestRevenueValue = sortedRevenue[0].revenue;
    }

    // -------------------------------------------------------------
    // 3. PACKAGE PERFORMANCE ANALYSIS
    // -------------------------------------------------------------
    const packagePerformance = await Package.aggregate([
      { $match: { isCustom: { $ne: true } } },
      {
        $lookup: {
          from: "bookings",
          let: { pkgId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ["$package", "$$pkgId"] }, { $ne: ["$bookingStatus", "cancelled"] } ] } } }
          ],
          as: "bookings"
        }
      },
      {
        $lookup: {
          from: "reviews",
          let: { pkgId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ["$package", "$$pkgId"] }, { $eq: ["$isApproved", true] } ] } } }
          ],
          as: "reviews"
        }
      },
      {
        $project: {
          name: 1,
          price: 1,
          duration: 1,
          bookingCount: { $size: "$bookings" },
          avgRating: { $ifNull: [ { $avg: "$reviews.rating" }, 0 ] },
          reviewCount: { $size: "$reviews" }
        }
      },
      { $sort: { bookingCount: -1 } }
    ]);

    let mostBookedPackage = "N/A";
    let leastBookedPackage = "N/A";
    let highestRatedPackage = "N/A";

    if (packagePerformance.length > 0) {
      mostBookedPackage = packagePerformance[0].name;
      leastBookedPackage = packagePerformance[packagePerformance.length - 1].name;

      const ratedSorted = [...packagePerformance].sort((a, b) => b.avgRating - a.avgRating);
      highestRatedPackage = ratedSorted[0].avgRating > 0 ? ratedSorted[0].name : "N/A";
    }

    // -------------------------------------------------------------
    // 4. MONASTERY INSIGHTS
    // -------------------------------------------------------------
    const monasteryPerformance = await Monastery.aggregate([
      {
        $lookup: {
          from: "packages",
          localField: "_id",
          foreignField: "monasteries",
          as: "packages"
        }
      },
      {
        $lookup: {
          from: "bookings",
          let: { pkgIds: "$packages._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$package", "$$pkgIds"] },
                    { $ne: ["$bookingStatus", "cancelled"] }
                  ]
                }
              }
            }
          ],
          as: "bookings"
        }
      },
      {
        $project: {
          name: 1,
          location: 1,
          bookingCount: { $size: "$bookings" }
        }
      },
      { $sort: { bookingCount: -1 } }
    ]);

    let mostVisitedMonastery = "N/A";
    let leastVisitedMonastery = "N/A";

    if (monasteryPerformance.length > 0) {
      mostVisitedMonastery = monasteryPerformance[0].name;
      leastVisitedMonastery = monasteryPerformance[monasteryPerformance.length - 1].name;
    }

    // -------------------------------------------------------------
    // 5. FESTIVAL ANALYTICS
    // -------------------------------------------------------------
    const festivalPerformance = await Festival.aggregate([
      {
        $lookup: {
          from: "festivalreminders",
          localField: "_id",
          foreignField: "festival",
          as: "subscriptions"
        }
      },
      {
        $project: {
          name: 1,
          month: 1,
          date: 1,
          location: 1,
          image: 1,
          subscriberCount: {
            $size: {
              $filter: {
                input: "$subscriptions",
                as: "sub",
                cond: { $eq: ["$$sub.subscribed", true] }
              }
            }
          }
        }
      },
      { $sort: { subscriberCount: -1 } }
    ]);

    let mostPopularFestival = "N/A";
    if (festivalPerformance.length > 0) {
      mostPopularFestival = festivalPerformance[0].name;
    }

    // Correlate bookings with festival months (Festival Booking Trends)
    const festivalTrends = festivalPerformance.map(festival => {
      // Find bookings in the calendar month of the festival
      const monthStr = festival.month;
      // parse to find matching seasonal booking counts
      const matchMonth = seasonalityMap.find(m => 
        m.month.toLowerCase().startsWith(monthStr.toLowerCase().substring(0, 3))
      );
      return {
        festivalName: festival.name,
        month: monthStr,
        bookingsInMonth: matchMonth ? matchMonth.bookings : 0,
        subscribers: festival.subscriberCount
      };
    });

    // -------------------------------------------------------------
    // 6. DRIVER ANALYTICS
    // -------------------------------------------------------------
    const driverPerformance = await Driver.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "driver",
          as: "bookings"
        }
      },
      {
        $project: {
          name: 1,
          phone: 1,
          vehicleNumber: 1,
          vehicleType: 1,
          status: 1,
          bookingsCount: { $size: "$bookings" }
        }
      },
      { $sort: { bookingsCount: -1 } }
    ]);

    let mostAssignedDriver = "N/A";
    if (driverPerformance.length > 0) {
      mostAssignedDriver = driverPerformance[0].name;
    }

    // -------------------------------------------------------------
    // 7. USER ANALYTICS
    // -------------------------------------------------------------
    const totalUsers = await User.countDocuments({ role: "user" });
    const activeUsers = await User.countDocuments({ role: "user", isBlocked: false });
    
    const userRegistrationsRaw = await User.aggregate([
      { $match: { role: "user" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const userRegistrations = userRegistrationsRaw.map(item => ({
      month: `${MONTH_SHORT[item._id.month]} ${item._id.year}`,
      registrations: item.count
    }));

    // -------------------------------------------------------------
    // 8. AI RECOMMENDATIONS GENERATOR
    // -------------------------------------------------------------
    const recommendations = [];

    // Recommendation A: Most popular package
    if (packagePerformance.length > 0 && packagePerformance[0].bookingCount > 0) {
      recommendations.push({
        id: "rec_popular_package",
        type: "info",
        message: `${packagePerformance[0].name} is the most popular tour package. Consider promoting it prominently on the homepage to leverage high organic demand.`
      });
    }

    // Recommendation B: Booking seasonality peaks
    if (bookingSeasonality.length > 0) {
      const topMonths = bookingSeasonality.slice(0, 2).map(item => MONTH_NAMES[item._id]);
      if (topMonths.length > 0) {
        const monthsStr = topMonths.join(" and ");
        recommendations.push({
          id: "rec_peak_season",
          type: "success",
          message: `${monthsStr} show maximum bookings. Consider increasing package availability and adding seasonal tours during these peak travel months.`
        });
      }
    }

    // Recommendation C: Driver capacities / Festival load
    const busyDrivers = driverPerformance.filter(d => d.status === "busy").length;
    const totalDrivers = driverPerformance.length;
    const totalActiveSubscribers = festivalPerformance.reduce((sum, f) => sum + f.subscriberCount, 0);

    if (totalActiveSubscribers > 0) {
      recommendations.push({
        id: "rec_driver_festival",
        type: "warning",
        message: `Festival interest is rising with ${totalActiveSubscribers} active email reminder subscriptions. Ensure additional drivers are contracted to manage higher tour workloads.`
      });
    }

    // Recommendation D: High ratings but low booking counts
    const lowBookingsHighRatings = packagePerformance.find(
      pkg => pkg.avgRating >= 4.0 && pkg.bookingCount <= 1
    );

    if (lowBookingsHighRatings) {
      recommendations.push({
        id: "rec_marketing_push",
        type: "danger",
        message: `${lowBookingsHighRatings.name} has low bookings (${lowBookingsHighRatings.bookingCount}) despite highly positive reviews (${lowBookingsHighRatings.avgRating.toFixed(1)} stars). We recommend running a targeted marketing campaign or discount.`
      });
    }

    // -------------------------------------------------------------
    // CUSTOM RESERVATIONS ANALYTICS
    // -------------------------------------------------------------
    const totalCustomReservations = await CustomReservation.countDocuments();
    const pendingCustomCount = await CustomReservation.countDocuments({ status: "Pending" });
    const approvedCustomCount = await CustomReservation.countDocuments({ status: "Approved" });
    const rejectedCustomCount = await CustomReservation.countDocuments({ status: "Rejected" });

    const customRevenueAgg = await CustomReservation.aggregate([
      { $match: { status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$estimatedPrice" } } }
    ]);
    const approvedCustomRevenue = customRevenueAgg[0]?.total || 0;

    const customRegionAgg = await CustomReservation.aggregate([
      { $group: { _id: "$region", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const topCustomRegion = customRegionAgg[0]?._id || "N/A";
    const topCustomRegionCount = customRegionAgg[0]?.count || 0;

    // Add reservation recommendations
    if (pendingCustomCount > 0) {
      recommendations.push({
        id: "rec_pending_reservations",
        type: "warning",
        message: `There are ${pendingCustomCount} custom tour reservations pending review. Review them in the Custom Requests panel to convert them to bookings.`
      });
    }

    if (topCustomRegionCount >= 3) {
      recommendations.push({
        id: "rec_popular_custom_region",
        type: "info",
        message: `High interest detected in custom tours for ${topCustomRegion} (${topCustomRegionCount} requests). Consider designing a new preset registry package for this region.`
      });
    }

    // Fallback default recommendations if data is empty/new database
    if (recommendations.length === 0) {
      recommendations.push({
        id: "rec_default_1",
        type: "info",
        message: "No booking data available yet. Promote packages on social channels to trigger initial bookings."
      });
      recommendations.push({
        id: "rec_default_2",
        type: "warning",
        message: "Check Driver details to make sure vehicles are registered before peak holidays."
      });
    }

    // -------------------------------------------------------------
    // RETURN CONSOLIDATED BI REPORT DATA
    // -------------------------------------------------------------
    return res.status(200).json({
      bookingTrend: {
        chronological: bookingChronological,
        seasonality: seasonalityMap,
        peakMonths: peakBookingMonths,
        lowestMonths: lowestBookingMonths
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        highestMonth: highestRevenueMonth,
        highestRevenueValue,
        avgBookingValue
      },
      packagePerformance: {
        mostBooked: mostBookedPackage,
        leastBooked: leastBookedPackage,
        highestRated: highestRatedPackage,
        ranking: packagePerformance
      },
      monasteryInsights: {
        mostVisited: mostVisitedMonastery,
        leastVisited: leastVisitedMonastery,
        ranking: monasteryPerformance
      },
      festivalAnalytics: {
        mostPopular: mostPopularFestival,
        trends: festivalTrends,
        participationReport: festivalPerformance
      },
      driverAnalytics: {
        mostAssigned: mostAssignedDriver,
        workloadReport: driverPerformance.map(d => ({
          name: d.name,
          phone: d.phone,
          vehicleNumber: d.vehicleNumber,
          vehicleType: d.vehicleType,
          status: d.status,
          bookingsCount: d.bookingsCount
        })),
        performanceStats: driverPerformance
      },
      userAnalytics: {
        totalUsers,
        activeUsers,
        registrations: userRegistrations
      },
      customReservationStats: {
        total: totalCustomReservations,
        pending: pendingCustomCount,
        approved: approvedCustomCount,
        rejected: rejectedCustomCount,
        projectedRevenue: approvedCustomRevenue,
        regionRanking: customRegionAgg
      },
      recommendations
    });

  } catch (error) {
    console.error("ANALYTICS ENGINE ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};
