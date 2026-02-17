import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import {
  BookOpen,
  Star,
  Eye,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

const ContentDetail = () => {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch content details
  useEffect(() => {
    const fetchContentDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`http://localhost:8080/api/content/${id}`);
        const data = await response.json();
        setContent(data);
        console.log(data);
        setRetryCount(0);
      } catch (err) {
        console.error("Failed to fetch content details:", err);
        setError(
          "Failed to load content details. Please check your connection."
        );
        if (retryCount === 0) {
          setContent({
            _id: id,
            title: "Sample Content Title",
            description:
              "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tenetur, atque adipisci? Enim necessitatibus ullam, facere eligendi soluta debitis et? Modi vel reiciendis qui eveniet minus necessitatibus eos accusantium nulla perspiciatis.",
            type: "Guide",
            tags: ["sample", "fallback"],
            rating: 4.5,
            downloads: 100,
            readTime: "10 min",
            link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContentDetails();
  }, [id, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const getTypeColor = (type) => {
    const colors = {
      Guide: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      Tutorial: "bg-green-100 text-green-800 hover:bg-green-200",
      Resource: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      Article: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      Default: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    };
    return colors[type] || colors.Default;
  };

  if (loading)
    return <div className="p-6 text-center">Loading content details...</div>;

  if (!content) return <div className="p-6 text-center">No content found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back Button - Top Left Fixed */}

      {error && (
        <Alert variant="destructive" className="mb-6 max-w-3xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Content Load Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="max-w-3xl mx-auto hover:shadow-xl transition-all duration-300 rounded-2xl border-0 shadow-md bg-white/80 backdrop-blur-sm pt-20">
        <div className="fixed top-6 left-6 z-50">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 shadow-md hover:bg-gray-100 rounded-lg"
          >
            <Link to="/content" className="flex items-center justify-center">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        </div>
        <CardHeader className="pb-4 p-6">
          <div className="flex items-start justify-between mb-3">
            <Badge
              className={`${getTypeColor(
                content.type
              )} rounded-full px-3 py-1 text-xs font-medium`}
            >
              {content.type}
            </Badge>
            {content.rating && (
              <div className="flex items-center gap-1 text-sm text-yellow-600 bg-yellow-50 rounded-full px-2 py-1">
                <Star className="h-3 w-3 fill-current" />
                <span className="font-medium">{content.rating}</span>
              </div>
            )}
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900 leading-tight mb-2">
            {content.title}
          </CardTitle>
          <p className="text-gray-600 text-sm leading-relaxed">
            {isExpanded
              ? content.description
              : `${content.description.slice(0, 150)}${
                  content.description.length > 150 ? "..." : ""
                }`}
            {content.description.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm ml-1"
              >
                {isExpanded ? "Read less" : "Read more"}
              </button>
            )}
          </p>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4 bg-gray-50 rounded-lg p-3">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {content.readTime}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {content.downloads} views
            </span>
          </div>

          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {content.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs rounded-full border-gray-200 text-gray-600 hover:bg-gray-100"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Action Buttons - No Download */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Primary: Go to Content using link */}
            <a
              href={content.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 Button asChild size='sm' className='flex-1 rounded-xl'"
            >
              <Button
                size="sm"
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                Go to {content.type}
              </Button>
            </a>

            {/* Secondary: Back to Hub */}
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link to="/content">Back to Hub</Link>
            </Button>
          </div>
        </CardContent>

        {/* Resource ID Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          Resource ID:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded font-mono">
            {content._id}
          </code>
        </div>
      </Card>
    </div>
  );
};

export default ContentDetail;
