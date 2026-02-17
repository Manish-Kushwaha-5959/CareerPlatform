import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Star, Clock, Users, ExternalLink, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ContentSection() {
  const [data, setData] = useState([]);
  const [recs, setRecs] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    const storedValueRaw = localStorage.getItem("apnidisha_student_profile");
    if (!storedValueRaw) {
      console.warn("No student profile in localStorage");
      return;
    }

    try {
      const storedValue = JSON.parse(storedValueRaw);
      const recsObj = storedValue.quiz_results?.recommendations ?? [];
      const recsArr = [];

      recsObj.forEach((rec) => {
        rec.degrees.forEach((deg) => {
          recsArr.push(deg.degree);
        });
      });

      console.log("recs from localStorage:", recsArr);
      setRecs(recsArr);
    } catch (e) {
      console.error("Failed to parse apnidisha_student_profile:", e);
    }
  }, []);

  const fetchContentRecommendations = useCallback(async () => {
    try {
      console.log("Sending recs to backend:", recs);
      const response = await fetch(
        "http://localhost:8080/api/content/streams",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recs }),
        }
      );

      const result = await response.json();
      console.log("backend result:", result);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch content recommendations:", error);
    }
  }, [recs]);

  useEffect(() => {
    if (recs.length > 0) {
      fetchContentRecommendations();
    }
  }, [recs, fetchContentRecommendations]);

  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">
            {t("recommendations_1.content.noRecommendations")}
          </h3>
          <p className="text-gray-600">
            {t("recommendations_1.content.noRecommendationsDesc")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {safeData.map((content) => (
        <Card
          key={content._id}
          className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-indigo-100 text-indigo-800">
                {content.type}
              </Badge>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm text-gray-600">
                  {content.rating}/5
                </span>
              </div>
            </div>
            <CardTitle className="text-lg">{content.title}</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-gray-600 mb-4">{content.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-2" />
                <span>{content.duration}</span>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-2" />
                <span>
                  {content.enrollments}{" "}
                  {t("recommendations_1.content.enrolled")}
                </span>
              </div>
            </div>

            <Button className="w-full bg-transparent" variant="outline">
              {t("recommendations_1.content.accessContent")}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
