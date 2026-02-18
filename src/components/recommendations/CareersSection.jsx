"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Star, TrendingUp, IndianRupee, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export default function CareersSection() {
  const { t } = useTranslation();
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);

  const inferIndustry = (careerTitle) => {
    const titleLower = careerTitle.toLowerCase();
    if (titleLower.includes('manager') || titleLower.includes('marketing')) {
      return 'Marketing';
    }
    if (titleLower.includes('entrepreneur')) {
      return 'Business';
    }
    if (titleLower.includes('designer') || titleLower.includes('industrial')) {
      return 'Design';
    }
    // Default
    return 'Professional Services';
  };

  useEffect(() => {
    const getRecommendedCareers = () => {
      try {
        const raw = localStorage.getItem("apnidisha_student_profile");
        if (!raw) return [];

        const profile = JSON.parse(raw);
        const quizResults = profile?.quiz_results;
        if (!quizResults || !quizResults.recommendations || quizResults.recommendations.length === 0) {
          return [];
        }

        // Map recommendations to career data
        const recommendedCareers = quizResults.recommendations.map((rec, idx) => ({
          _id: `career_${idx}`,
          title: rec.career,
          description: rec.reason,
          industry: inferIndustry(rec.career),
          matchScore: Math.round(85 + Math.random() * 15), // 85-100%
          averageSalary: Math.round(500000 + Math.random() * 1500000), // 5-20 lakhs
          growthRate: "8-12%"
        }));

        return recommendedCareers;
      } catch (error) {
        console.error("Error parsing user profile:", error);
        return [];
      }
    };

    const careerData = getRecommendedCareers();
    setCareers(careerData);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <h3 className="text-xl font-semibold">Loading career recommendations...</h3>
        </CardContent>
      </Card>
    );
  }

  const safeData = Array.isArray(careers) ? careers : [];

  if (safeData.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {t("recommendations_1.careers.noRecommendations") || "No career recommendations"}
          </h3>
          <p className="text-gray-600">
            {t("recommendations_1.careers.noRecommendationsDesc") || "Complete your quiz to get career suggestions."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {safeData.map((career) => (
        <Card key={career._id} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-orange-100 text-orange-800">{career.industry}</Badge>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm">
                  {career.matchScore}% {t("recommendations_1.careers.match") || "match"}
                </span>
              </div>
            </div>
            <CardTitle className="text-lg">{career.title}</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-gray-600 mb-4">{career.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <IndianRupee className="h-4 w-4 mr-2" />
                <span>₹{career.averageSalary?.toLocaleString()} {t("recommendations_1.careers.perYear") || "per year"}</span>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span>{career.growthRate} {t("recommendations_1.careers.jobGrowth") || "job growth"}</span>
              </div>
            </div>

            <Button className="w-full bg-transparent" variant="outline">
              {t("recommendations_1.careers.exploreCareer") || "Explore Career"}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}