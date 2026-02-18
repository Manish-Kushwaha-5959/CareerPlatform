"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Star,
  Users,
  MapPin,
  IndianRupee,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function CollegesSection({
  apiBase = "http://localhost:8080",
}) {
  const { t } = useTranslation();

  const [colleges, setColleges] = useState([]);
  const [schoolInterestMap, setSchoolInterestMap] = useState({});
  const [loadingInterest, setLoadingInterest] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  /* ---------------------------------------------
        Get user_id from localStorage
    ------------------------------------------------*/
  const getUserId = () => {
    try {
      const raw = localStorage.getItem("apnidisha_student_profile");
      if (!raw) return null;

      const profile = JSON.parse(raw);
      return profile?.user_id || null;
    } catch {
      return null;
    }
  };

  /* ---------------------------------------------
        Get user school from localStorage
    ------------------------------------------------*/
  const getUserSchool = () => {
    try {
      const raw = localStorage.getItem("apnidisha_student_profile");
      if (!raw) return "Unknown";

      const profile = JSON.parse(raw);
      return profile?.school || "Unknown";
    } catch {
      return "Unknown";
    }
  };

  /* ---------------------------------------------
        Fetch recommendations
    ------------------------------------------------*/
  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setLoadingRecommendations(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/colleges/recommend/${userId}`);
        if (res.data?.success) {
          setColleges(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, []);

  /* ---------------------------------------------
        Fetch school interest per college
    ------------------------------------------------*/
  useEffect(() => {
    const school = getUserSchool();
    let mounted = true;

    const fetchInterests = async () => {
      if (!colleges.length) return;

      setLoadingInterest(true);

      const promises = colleges.map((college) => {
        const url = `${apiBase}/api/school-interest/${college._id}/${school}`;

        return axios
          .get(url)
          .then((res) => ({ id: college._id, count: res.data?.count ?? 0 }))
          .catch(() => ({ id: college._id, count: 0 }));
      });

      const results = await Promise.all(promises);
      if (!mounted) return;

      const map = {};
      results.forEach((r) => (map[r.id] = r.count));

      setSchoolInterestMap(map);
      setLoadingInterest(false);
    };

    fetchInterests();
    return () => (mounted = false);
  }, [colleges]);

  /* ---------------------------------------------
        Compute popularity percentage
    ------------------------------------------------*/
  const computePct = (college) => {
    const schoolCount = schoolInterestMap[college._id] || 0;
    const globalInterest = Number(college.interest || 0);

    if (globalInterest === 0) return schoolCount > 0 ? 100 : 0;

    return Math.round((schoolCount / globalInterest) * 100);
  };

  const POPULAR_THRESHOLD = 40;

  /* ---------------------------------------------
        Compute average annual fee from matched courses
    ------------------------------------------------*/
  const computeAverageFee = (college) => {
    const matched = college.matched_courses || [];
    if (!matched.length) return 0;

    const fees = matched
      .map((course) => course.annual_fee || course.tuition_fee / (course.duration?.match(/(\d+)/)?.[1] || 4))
      .filter((f) => f && f > 0);

    if (!fees.length) return 0;

    return Math.round(fees.reduce((a, b) => a + b, 0) / fees.length);
  };

  /* ---------------------------------------------
        Get safe website URL
    ------------------------------------------------*/
  const getSafeWebsiteUrl = (website) => {
    if (!website) return null;
    if (website.startsWith('http://') || website.startsWith('https://')) {
      return website;
    }
    return `https://${website}`;
  };

  /* ---------------------------------------------
        Open details modal
    ------------------------------------------------*/
  const openDetails = (college) => {
    setSelectedCollege(college);
    setIsOpen(true);
  };

  /* ---------------------------------------------
        If loading
    ------------------------------------------------*/
  if (loadingRecommendations) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <h3 className="text-xl font-semibold">Loading recommendations...</h3>
        </CardContent>
      </Card>
    );
  }

  const safeColleges = Array.isArray(colleges) ? colleges : [];

  /* ---------------------------------------------
        If no data
    ------------------------------------------------*/
  if (!safeColleges.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <h3 className="text-xl font-semibold">
            {t("recommendations_1.colleges.noRecommendations") ||
              "No recommendations available"}
          </h3>
          <p className="text-gray-600">
            {t("recommendations_1.colleges.noRecommendationsDesc") ||
              "Complete the quiz to get personalized college recommendations."}
          </p>
        </CardContent>
      </Card>
    );
  }

  /* ---------------------------------------------
        College Details Modal
    ------------------------------------------------*/
  const CollegeDetailsModal = () => {
    if (!selectedCollege) return null;

    const college = selectedCollege;
    const matched = college.matched_courses || [];
    const safeWebsite = getSafeWebsiteUrl(college.website);
    const nirfRank = college.nirf_rank_parsed || college.nirf_rank;
    const avgFee = computeAverageFee(college);
    const reviewCount = college.reviews_count || 0;

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{college.name}</span>
              {nirfRank && (
                <Badge variant="secondary" className="ml-2">
                  NIRF #{nirfRank}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Type:</strong> {college.college_type || college.type || "College"}
              </div>
              <div>
                <strong>Location:</strong> {college.district || college.nirf_city || college.location}, {college.state}
              </div>
              <div>
                <strong>Established:</strong> {college.year_established || "N/A"}
              </div>
              <div>
                <strong>Rating:</strong> {college.rating || 0}/5 ({reviewCount} reviews)
              </div>
              {avgFee > 0 && (
                <div>
                  <strong>Avg Annual Fee:</strong> ₹{avgFee.toLocaleString()}
                </div>
              )}
            </div>

            {safeWebsite && (
              <Button asChild variant="outline" className="w-full">
                <a href={safeWebsite} target="_blank" rel="noopener noreferrer">
                  Visit Website <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}

            {matched.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Matched Courses</h3>
                <div className="space-y-4">
                  {matched.map((course, idx) => (
                    <div key={idx} className="border p-3 rounded-md">
                      <h4 className="font-medium">{course.name}</h4>
                      {course.specializations && course.specializations.length > 0 && (
                        <div className="text-sm text-gray-600 mb-1">
                          Specializations: {course.specializations.join(", ")}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 mb-1">Duration: {course.duration}</div>
                      <div className="text-sm text-gray-600 mb-1">Eligibility: {course.eligibility || "N/A"}</div>
                      {(course.annual_fee || course.tuition_fee) && (
                        <div className="text-sm text-gray-600">
                          Fee: ₹{(course.annual_fee || course.tuition_fee).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  /* ---------------------------------------------
        UI
    ------------------------------------------------*/
  return (
    <div>
      {loadingInterest && (
        <div className="mb-4 text-sm text-gray-500">
          Loading school popularity...
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeColleges.map((college) => {
          const pct = computePct(college);
          const isPopular = pct >= POPULAR_THRESHOLD;
          const avgFee = computeAverageFee(college);
          const reviewCount = college.reviews_count || 0;

          return (
            <>
              <Card
                key={college._id}
                className="relative shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* ⭐ Pink Gradient Top Pick Badge */}
                {isPopular && (
                  <div
                    className="
                      absolute top-2 right-2 
                      px-2 py-0.5 
                      text-[10px] font-semibold 
                      bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500
                      text-white 
                      rounded-full shadow-lg
                      animate-pulse
                      ring-1 ring-pink-300
                      backdrop-blur-sm
                      glow-badge-pink
                    "
                  >
                    ★ Top Pick
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {college.name}
                      </CardTitle>

                      <div className="mt-2 flex gap-2 items-center">
                        <Badge className="bg-purple-100 text-purple-900">
                          {college.college_type || "College"}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <Star className="h-4 w-4 text-yellow-500 inline-block" />
                      <span>{college.rating || 0}/5</span>
                      <div className="text-xs text-gray-500">
                        {reviewCount} reviews
                      </div>
                      <div className="text-xs text-gray-500">
                        {pct > 0 ? `Popular  from your school` : "—"}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {college.district || college.nirf_city || college.location}, {college.state}
                    </div>

                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {reviewCount} reviews
                    </div>

                    {avgFee > 0 && (
                      <div className="flex items-center">
                        <IndianRupee className="h-4 w-4 mr-2" />
                        ₹{avgFee.toLocaleString()} per year (avg)
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => openDetails(college)}
                    >
                      View Details
                    </Button>
                    {college.website && (
                      <Button
                        asChild
                        variant="secondary"
                        className="flex-1 justify-center"
                        size="sm"
                      >
                        <a
                          href={getSafeWebsiteUrl(college.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Site
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          );
        })}
      </div>

      <CollegeDetailsModal />
    </div>
  );
}