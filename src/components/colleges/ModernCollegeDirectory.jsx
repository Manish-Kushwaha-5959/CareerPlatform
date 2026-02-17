// src/components/ModernCollegeDirectory.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";

import {
  Search,
  MapPin,
  Star,
  Users,
  Loader2,
  Heart,
  X,
  Trophy,
  Filter,
} from "lucide-react";

import debounce from "lodash.debounce";

// Load student profile
const PROFILE_KEY = "apnidisha_student_profile";
const loadProfile = () => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const API = axios.create({
  baseURL: "http://127.0.0.1:8080/api",
  headers: { "Content-Type": "application/json" },
});

const ModernCollegeDirectory = () => {
  const student = loadProfile();
  const userSchool = student?.school || "Unknown";

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  // Filters state
  const [filters, setFilters] = useState({
    state: "",
    college_type: "",
    minRating: 0,
    sortBy: "relevance",
    nirfOnly: false, // NEW
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch colleges
  const fetchColleges = async () => {
    try {
      setLoading(true);

      // Always fetch all colleges from directory
      const res = await API.get(`/colleges/directory`);
      let data = res.data?.data || [];

      // Attach clean fields
      let list = data.map(c => ({
        ...c,
        interest: c.interest || 0,
        rating_num: parseFloat(c.rating) || 0,
        nirf_num:
          c.nirf_rank && !isNaN(c.nirf_rank)
            ? parseInt(c.nirf_rank)
            : 9999,
      }));

      // LOCAL FILTERS (client-side)

      // Search filter
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        list = list.filter(c =>
          c.name.toLowerCase().includes(s) ||
          c.city?.toLowerCase().includes(s) ||
          c.state?.toLowerCase().includes(s) ||
          c.district?.toLowerCase().includes(s)
        );
      }

      // State filter
      if (filters.state) {
        list = list.filter(c =>
          (c.state || "").toLowerCase() === filters.state.toLowerCase()
        );
      }

      // College type filter
      if (filters.college_type) {
        list = list.filter(c =>
          (c.college_type || "").toLowerCase().includes(filters.college_type.toLowerCase())
        );
      }

      // Rating filter
      if (filters.minRating > 0) {
        list = list.filter(c => c.rating_num >= filters.minRating);
      }

      // NIRF only filter
      if (filters.nirfOnly) {
        list = list.filter(
          c =>
            c.nirf_rank &&
            c.nirf_rank !== "Not Ranked" &&
            c.nirf_rank !== "N/A"
        );
      }

      // SORTING (local)
      if (filters.sortBy === "rating") {
        list.sort((a, b) => b.rating_num - a.rating_num);
      } else if (filters.sortBy === "nirf") {
        list.sort((a, b) => a.nirf_num - b.nirf_num);
      } else if (filters.sortBy === "interest") {
        list.sort((a, b) => b.interest - a.interest);
      } else if (filters.sortBy === "year") {
        list.sort(
          (a, b) =>
            (b.year_established || 0) - (a.year_established || 0)
        );
      } else {
        // relevance
        list.sort((a, b) => {
          if (b.interest !== a.interest) return b.interest - a.interest;
          if (b.rating_num !== a.rating_num) return b.rating_num - a.rating_num;
          return a.nirf_num - b.nirf_num;
        });
      }

      setColleges(list);
      setTotalResults(list.length);
      setTotalInterest(list.reduce((s, c) => s + c.interest, 0));
    } catch (err) {
      console.error("Error fetching colleges:", err);
      setColleges([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch
  const debouncedFetch = useRef(debounce(fetchColleges, 500)).current;

  useEffect(() => {
    debouncedFetch();
  }, [searchTerm, filters]);

  useEffect(() => {
    fetchColleges();
  }, []);

  // Handle View Details + Interest
  const handleViewDetails = async (college) => {
    const id = college._id;

    // Optimistic UI update
    setColleges(prev =>
      prev.map(c =>
        c._id === id ? { ...c, interest: (c.interest || 0) + 1 } : c
      )
    );
    setTotalInterest(prev => prev + 1);

    // Update backend
    try {
      await API.post("/colleges/interest-batch", { interest: { [id]: 1 } });
    } catch (e) { console.error("Global interest failed", e); }

    try {
      await API.post("/school-interest/increment", {
        college_id: id,
        school: userSchool
      });
    } catch (e) { console.error("School interest failed", e); }

    // Open website
    const url = college.website?.startsWith("http")
      ? college.website
      : `http://${college.website}`;

    window.open(url || `/colleges/${id}`, "_blank", "noopener,noreferrer");
  };

  const computeInterestPercent = (val) =>
    totalInterest > 0 ? `${Math.round((val / totalInterest) * 100)}%` : "0%";

  const clearFilters = () => {
    setFilters({
      state: "",
      college_type: "",
      minRating: 0,
      sortBy: "relevance",
      nirfOnly: false,
    });
  };

  const hasActiveFilters =
    filters.state ||
    filters.college_type ||
    filters.minRating > 0 ||
    filters.nirfOnly ||
    filters.sortBy !== "relevance";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900">College Directory</h1>
          <p className="text-gray-600 mt-2 text-lg">Discover top colleges across India</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search + Filter Toggle */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search colleges by name, city, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters {hasActiveFilters && <span className="text-blue-600">•</span>}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-8 border shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  Filters & Sorting
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" /> Clear all
                </Button>
              </div>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* State */}
              <div>
                <Label>State</Label>
                <Select
                  value={filters.state || "all"}
                  onValueChange={(v) =>
                    setFilters(f => ({ ...f, state: v === "all" ? "" : v }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                    <SelectItem value="Karnataka">Karnataka</SelectItem>
                    <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                    <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                    <SelectItem value="Gujarat">Gujarat</SelectItem>
                    <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* College Type */}
              <div>
                <Label>College Type</Label>
                <Select
                  value={filters.college_type || "all"}
                  onValueChange={(v) =>
                    setFilters(f => ({ ...f, college_type: v === "all" ? "" : v }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Government">Government</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="Deemed">Deemed University</SelectItem>
                    <SelectItem value="Autonomous">Autonomous</SelectItem>
                    <SelectItem value="Affiliated College">Affiliated College</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum Rating */}
              <div>
                <Label>Min Rating: {filters.minRating > 0 ? `${filters.minRating}+ ★` : "Any"}</Label>
                <Slider
                  value={[filters.minRating]}
                  onValueChange={([v]) =>
                    setFilters(f => ({ ...f, minRating: v }))
                  }
                  max={5}
                  step={0.5}
                  className="mt-3"
                />
              </div>

              {/* NIRF toggle */}
              <div>
                <Label>NIRF Ranked Only</Label>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.nirfOnly}
                    onChange={(e) =>
                      setFilters(f => ({ ...f, nirfOnly: e.target.checked }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Show only NIRF ranked colleges</span>
                </div>
              </div>

              {/* Sort By */}
              <div className="md:col-span-2 lg:col-span-4">
                <Label>Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(v) =>
                    setFilters(f => ({ ...f, sortBy: v }))
                  }
                >
                  <SelectTrigger className="mt-2 w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance (Default)</SelectItem>
                    <SelectItem value="interest">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                    <SelectItem value="nirf">Best NIRF Rank</SelectItem>
                    <SelectItem value="year">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600 font-medium">
          {loading
            ? "Loading colleges..."
            : `${totalResults} college${totalResults !== 1 ? "s" : ""} found`}
        </div>

        {/* College Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        ) : colleges.length === 0 ? (
          <Card className="text-center py-16 text-gray-500">
            <p className="text-xl font-medium">No colleges found</p>
            <p className="mt-2">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {colleges.map((college) => {
              const pct = computeInterestPercent(college.interest);

              return (
                <Card
                  key={college._id}
                  className="overflow-hidden hover:shadow-2xl transition-all group border-0 shadow-lg"
                >
                  <div className="relative h-48">
                    <img
                      src={
                        college.image_url ||
                        "https://via.placeholder.com/600x300?text=College"
                      }
                      alt={college.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Interest Badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold shadow-lg">
                      <Heart className="h-4 w-4 text-red-600 fill-red-600" />
                      {college.interest} Interested
                      {pct !== "0%" && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[9px] ml-1">
                          {pct}
                        </Badge>
                      )}
                    </div>

                    {/* NIRF Badge */}
                    {college.nirf_rank &&
                      college.nirf_rank !== "Not Ranked" &&
                      college.nirf_rank !== "N/A" && (
                        <div className="absolute top-3 right-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white px-2.5 py-1 rounded flex items-center gap-1 text-xs font-bold shadow-lg">
                          <Trophy className="h-3.5 w-3.5" />
                          NIRF {college.nirf_rank}
                        </div>
                      )}
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2 leading-tight">
                      {college.name.trim()}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{college.rating || "N/A"}</span>
                      {college.reviews_count > 0 && (
                        <span className="text-xs text-gray-500">
                          ({college.reviews_count} reviews)
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                      <span>
                        {college.city}
                        {college.district &&
                          college.district !== college.city &&
                          `, ${college.district}`}
                        {college.state && `, ${college.state}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="h-4 w-4" />
                      Est. {college.year_established || "N/A"}
                      {college.college_type && ` • ${college.college_type}`}
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 font-medium text-white"
                      onClick={() => handleViewDetails(college)}
                    >
                      View Details & Explore
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernCollegeDirectory;
