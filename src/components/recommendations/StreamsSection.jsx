"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Star, Users, TrendingUp, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export default function StreamsSection() {
  const { t } = useTranslation();
  const [streamsData, setStreamsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserStreams = () => {
      try {
        const raw = localStorage.getItem("apnidisha_student_profile");
        if (!raw) return [];

        const profile = JSON.parse(raw);
        const quizResults = profile?.quiz_results;
        if (!quizResults || !quizResults.recommendations || quizResults.recommendations.length === 0) {
          return [];
        }

        // Extract unique streams from all recommendations
        const uniqueStreams = [...new Set(quizResults.recommendations.map(rec => rec.stream))];
        return uniqueStreams;
      } catch (error) {
        console.error("Error parsing user profile:", error);
        return [];
      }
    };

    const userStreams = getUserStreams();
    if (userStreams.length === 0) {
      setLoading(false);
      return;
    }

    // Hardcoded all possible streams data - filter by userStreams
    const allStreams = [
      {
        _id: "science_1",
        stream: "science",
        category: "Science",
        name: "Science Stream",
        description: "Dive deep into Physics, Chemistry, Biology, and Mathematics to build a strong foundation for engineering, medicine, and research careers.",
        matchScore: 95,
      },
      {
        _id: "commerce_1",
        stream: "commerce",
        category: "Commerce",
        name: "Commerce Stream",
        description: "Explore Accountancy, Business Studies, Economics, and Mathematics for pathways into business, finance, management, and entrepreneurship.",
        matchScore: 92,
      },
      {
        _id: "arts_1",
        stream: "arts",
        category: "Arts",
        name: "Arts Stream",
        description: "Engage with History, Political Science, Psychology, and Literature to pursue careers in law, journalism, design, and social sciences.",
        matchScore: 88,
      },
    ];

    // Filter streams by user's unique streams
    const filteredStreams = allStreams.filter((stream) => userStreams.includes(stream.stream));

    setStreamsData(filteredStreams);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <h3 className="text-xl font-semibold">Loading stream recommendations...</h3>
        </CardContent>
      </Card>
    );
  }

  const safeData = Array.isArray(streamsData) ? streamsData : [];

  if (safeData.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {t("recommendations_1.streams.noRecommendations") || "No stream recommendations"}
          </h3>
          <p className="text-gray-600">
            {t("recommendations_1.streams.noRecommendationsDesc") || "Complete your profile to get stream suggestions."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {safeData.map((stream) => (
        <Card key={stream._id} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-blue-100 text-blue-800">{stream.category}</Badge>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm text-gray-600">
                  {stream.matchScore}% {t("recommendations_1.streams.match") || "match"}
                </span>
              </div>
            </div>
            <CardTitle className="text-lg">{stream.name}</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-gray-600 mb-4">{stream.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-2" />
                <span>{t("recommendations_1.streams.studentsEnrolled") || "High enrollment"}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span>{t("recommendations_1.streams.jobGrowth") || "Strong job growth"}</span>
              </div>
            </div>

            <Button className="w-full bg-transparent" variant="outline">
              {t("recommendations_1.streams.learnMore") || "Learn More"}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}