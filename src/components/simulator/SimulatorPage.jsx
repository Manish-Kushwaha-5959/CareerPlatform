"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic,
  Volume2,
  X,
  Target,
  Users,
  GraduationCap,
  Pause,
  RotateCcw,
  Download,
  Share2,
  Shield,
  TrendingUp,
  Plus,
  Trash2,
  ExternalLink,
  Clock,
  IndianRupee,
} from "lucide-react"
import FullScreenFlowChart from "./fullScreenFlowChart"
import { ReactFlowProvider } from "reactflow"
import FlowChartEmbedded from "./FlowChartEmbedded"
import ShareModule from "./share"
import SharePdfModule from "./sharePDF"
import Portal from "@/utils/portal"
import exportSummary from "./exportSummary"

/* -----------------------
   INTEGRATED COLLEGE DATA (with source links)
   ----------------------- */
const INTEGRATED_COLLEGE_DATA = [
  {
    name: "Ramdeobaba University (RBU), Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://www.rknec.edu/placements/, https://collegedunia.com/college/15096-ramdeobaba-university-rbu-nagpur/placement",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 850,
      overallPlacementRate: 90
    },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 1285000,
        avgPackage: 980000,
        placementRate: 92,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Electronics & Computer Science",
        shortName: "BTECH ECS",
        duration: "4 years",
        fees: 916000,
        avgPackage: 660000,
        placementRate: 88,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Mechanical Engineering",
        shortName: "BTECH ME",
        duration: "4 years",
        fees: 916000,
        avgPackage: 610000,
        placementRate: 75,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "MBA (Master of Business Administration)",
        shortName: "MBA",
        duration: "2 years",
        fees: 570000,
        avgPackage: 650000,
        placementRate: 85,
        growthRate: 0.095,
        discountRate: 0.08,
        careerYears: 28,
        stream: "Commerce"
      }
    ]
  },
  {
    name: "Government College of Engineering, Nagpur (GCOEN)",
    location: "Nagpur, Maharashtra",
    type: "Government",
    source: "https://collegedunia.com/college/58789-government-college-of-engineering-gcoen-nagpur, https://gcoen.ac.in",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 280,
      overallPlacementRate: 82
    },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 110000,
        avgPackage: 720000,
        placementRate: 85,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Civil Engineering",
        shortName: "BTECH CE",
        duration: "4 years",
        fees: 110000,
        avgPackage: 480000,
        placementRate: 70,
        growthRate: 0.095,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Electrical Engineering",
        shortName: "BTECH EE",
        duration: "4 years",
        fees: 110000,
        avgPackage: 520000,
        placementRate: 75,
        growthRate: 0.098,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "IIM Nagpur (Indian Institute of Management)",
    location: "Nagpur, Maharashtra",
    type: "Government",
    source: "https://www.shiksha.com/college/iim-nagpur-indian-institute-of-management-47711/placement, https://collegedunia.com/university/55137-indian-institute-of-management-iimn-nagpur/placement",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 238,
      overallPlacementRate: 100
    },
    courses: [
      {
        name: "MBA (Master of Business Administration)",
        shortName: "MBA",
        duration: "2 years",
        fees: 1975000,
        avgPackage: 1807000,
        placementRate: 100,
        growthRate: 0.095,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Commerce"
      }
    ]
  },
  {
    name: "Institute of Management Technology (IMT), Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://www.linkedin.com/pulse/best-mba-colleges-nagpur-fees-admission-courses-placements-atkuf, https://mba.hitbullseye.com/info/mba-colleges-in-nagpur.php",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 180,
      overallPlacementRate: 95
    },
    courses: [
      {
        name: "MBA (Master of Business Administration)",
        shortName: "MBA",
        duration: "2 years",
        fees: 1450000,
        avgPackage: 1325000,
        placementRate: 95,
        growthRate: 0.095,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Commerce"
      }
    ]
  },
  {
    name: "Priyadarshini College of Engineering (PCE), Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://collegedunia.com/engineering/nagpur-colleges, https://www.shiksha.com/engineering/colleges/b-tech-colleges-nagpur",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 320,
      overallPlacementRate: 75
    },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 511000,
        avgPackage: 520000,
        placementRate: 78,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Information Technology",
        shortName: "BTECH IT",
        duration: "4 years",
        fees: 511000,
        avgPackage: 490000,
        placementRate: 75,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Electronics & Communication Engineering",
        shortName: "BTECH ECE",
        duration: "4 years",
        fees: 511000,
        avgPackage: 450000,
        placementRate: 72,
        growthRate: 0.098,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "St. Vincent Pallotti College of Engineering and Technology (SVPCET), Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://collegedunia.com/engineering/nagpur-colleges, https://www.shiksha.com/engineering/colleges/b-tech-colleges-nagpur",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 280,
      overallPlacementRate: 72
    },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 457000,
        avgPackage: 450000,
        placementRate: 75,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Mechanical Engineering",
        shortName: "BTECH ME",
        duration: "4 years",
        fees: 457000,
        avgPackage: 380000,
        placementRate: 68,
        growthRate: 0.095,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "SB Jain Institute of Technology, Management & Research (SBJITMR), Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://collegedunia.com/engineering/nagpur-colleges",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 245,
      overallPlacementRate: 70
    },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 454000,
        avgPackage: 420000,
        placementRate: 72,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Electronics & Telecommunication Engineering",
        shortName: "BTECH ETC",
        duration: "4 years",
        fees: 454000,
        avgPackage: 380000,
        placementRate: 68,
        growthRate: 0.098,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "Cummins College of Engineering for Women, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://collegedunia.com/engineering/nagpur-colleges",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 175,
      overallPlacementRate: 78
    },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 502000,
        avgPackage: 580000,
        placementRate: 82,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Information Technology",
        shortName: "BTECH IT",
        duration: "4 years",
        fees: 502000,
        avgPackage: 550000,
        placementRate: 78,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "KDK College of Engineering, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://collegedunia.com/engineering/nagpur-colleges",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 210,
      overallPlacementRate: 68
    },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 440000,
        avgPackage: 410000,
        placementRate: 70,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Civil Engineering",
        shortName: "BTECH CE",
        duration: "4 years",
        fees: 440000,
        avgPackage: 360000,
        placementRate: 65,
        growthRate: 0.095,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "GH Raisoni College of Engineering and Management (GHRCEM), Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://collegedunia.com/engineering/nagpur-colleges",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 480,
      overallPlacementRate: 82
    },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 555000,
        avgPackage: 540000,
        placementRate: 85,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Artificial Intelligence & Data Science",
        shortName: "BTECH AI-DS",
        duration: "4 years",
        fees: 555000,
        avgPackage: 620000,
        placementRate: 83,
        growthRate: 0.105,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "Datta Meghe College of Engineering (DMCE), Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://collegedunia.com/engineering/nagpur-colleges",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 195,
      overallPlacementRate: 65
    },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 480000,
        avgPackage: 450000,
        placementRate: 68,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Electronics Engineering",
        shortName: "BTECH EE",
        duration: "4 years",
        fees: 480000,
        avgPackage: 400000,
        placementRate: 62,
        growthRate: 0.098,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "Rashtrasant Tukadoji Maharaj Nagpur University (RTMNU) - Pharmacy Department",
    location: "Nagpur, Maharashtra",
    type: "Government",
    source: "https://www.shiksha.com/medicine-health-sciences/pharmacy/ranking/top-pharmacy-colleges-in-nagpur/117-2-0-156-0, https://pharmacy.careers360.com/colleges/list-of-pharmacy-colleges-in-nagpur",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 85,
      overallPlacementRate: 75
    },
    courses: [
      {
        name: "Bachelor of Pharmacy (B.Pharm)",
        shortName: "BPHARM",
        duration: "4 years",
        fees: 134000,
        avgPackage: 350000,
        placementRate: 75,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "Master of Pharmacy (M.Pharm)",
        shortName: "MPHARM",
        duration: "2 years",
        fees: 80000,
        avgPackage: 480000,
        placementRate: 78,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "Smt. Kishoritai Bhoyar College of Pharmacy, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://pharmacy.careers360.com/colleges/list-of-pharmacy-colleges-in-nagpur, https://skb.edu.in",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 65,
      overallPlacementRate: 70
    },
    courses: [
      {
        name: "Bachelor of Pharmacy (B.Pharm)",
        shortName: "BPHARM",
        duration: "4 years",
        fees: 320000,
        avgPackage: 320000,
        placementRate: 70,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "Diploma in Pharmacy (D.Pharm)",
        shortName: "DPHARM",
        duration: "2 years",
        fees: 140000,
        avgPackage: 250000,
        placementRate: 65,
        growthRate: 0.08,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "Anuradha Pharmacy College, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://pharmacy.careers360.com/colleges/list-of-pharmacy-colleges-in-nagpur",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 55,
      overallPlacementRate: 68
    },
    courses: [
      {
        name: "Bachelor of Pharmacy (B.Pharm)",
        shortName: "BPHARM",
        duration: "4 years",
        fees: 280000,
        avgPackage: 310000,
        placementRate: 68,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "G.S. College of Commerce and Economics, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Government",
    source: "https://www.linkedin.com/pulse/best-mba-colleges-nagpur-fees-admission-courses-placements-atkuf",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 120,
      overallPlacementRate: 100
    },
    courses: [
      {
        name: "MBA (Master of Business Administration)",
        shortName: "MBA",
        duration: "2 years",
        fees: 180000,
        avgPackage: 625000,
        placementRate: 100,
        growthRate: 0.095,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Commerce"
      },
      {
        name: "M.Com (Master of Commerce)",
        shortName: "MCOM",
        duration: "2 years",
        fees: 45000,
        avgPackage: 380000,
        placementRate: 75,
        growthRate: 0.09,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Commerce"
      }
    ]
  },
  {
    name: "Shri Ramdeobaba College of Pharmacy, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://pharmacy.careers360.com/colleges/list-of-pharmacy-colleges-in-nagpur",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 72,
      overallPlacementRate: 78
    },
    courses: [
      {
        name: "Bachelor of Pharmacy (B.Pharm)",
        shortName: "BPHARM",
        duration: "4 years",
        fees: 360000,
        avgPackage: 380000,
        placementRate: 78,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "Priyadarshini J.L. College of Pharmacy, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://pharmacy.careers360.com/colleges/list-of-pharmacy-colleges-in-nagpur",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 60,
      overallPlacementRate: 72
    },
    courses: [
      {
        name: "Bachelor of Pharmacy (B.Pharm)",
        shortName: "BPHARM",
        duration: "4 years",
        fees: 340000,
        avgPackage: 340000,
        placementRate: 72,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "Diploma in Pharmacy (D.Pharm)",
        shortName: "DPHARM",
        duration: "2 years",
        fees: 150000,
        avgPackage: 260000,
        placementRate: 68,
        growthRate: 0.08,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "Laxminarayan Institute of Technology (LIT), Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Government",
    source: "https://collegedunia.com/engineering/nagpur-colleges",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 95,
      overallPlacementRate: 70
    },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 460000,
        avgPackage: 520000,
        placementRate: 75,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Information Technology",
        shortName: "BTECH IT",
        duration: "4 years",
        fees: 460000,
        avgPackage: 490000,
        placementRate: 70,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "Tulsiramji Gaikwad-Patil College of Engineering & Technology (TGPCET), Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://collegedunia.com/engineering/nagpur-colleges",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 290,
      overallPlacementRate: 68
    },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 412000,
        avgPackage: 440000,
        placementRate: 70,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Mechanical Engineering",
        shortName: "BTECH ME",
        duration: "4 years",
        fees: 412000,
        avgPackage: 380000,
        placementRate: 65,
        growthRate: 0.095,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "Wainganga College of Engineering and Management (WCEM), Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://collegedunia.com/engineering/nagpur-colleges",
    overallPlacementStats: {
      avgStudentsPlacedPerYear: 185,
      overallPlacementRate: 62
    },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 360000,
        avgPackage: 400000,
        placementRate: 65,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      },
      {
        name: "B.Tech in Electronics & Telecommunication Engineering",
        shortName: "BTECH ETC",
        duration: "4 years",
        fees: 360000,
        avgPackage: 370000,
        placementRate: 60,
        growthRate: 0.098,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science"
      }
    ]
  },
  {
    name: "Visvesvaraya National Institute of Technology, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Government",
    source:
      "https://vnit.ac.in/section/tnp/, https://www.shiksha.com/college/vnit-nagpur-visvesvaraya-national-institute-of-technology-24399/placement",
    overallPlacementStats: { avgStudentsPlacedPerYear: 723, overallPlacementRate: 92.5 },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 550000,
        avgPackage: 1192000,
        placementRate: 98.5,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science",
      },
      {
        name: "B.Tech in Mechanical Engineering",
        shortName: "BTECH ME",
        duration: "4 years",
        fees: 550000,
        avgPackage: 900000,
        placementRate: 92,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science",
      },
      {
        name: "M.Tech in Computer Science",
        shortName: "MTECH CS",
        duration: "2 years",
        fees: 140000,
        avgPackage: 798000,
        placementRate: 88,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science",
      },
    ],
  },
  {
    name: "Indian Institute of Information Technology, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Government",
    source:
      "https://www.iiitn.ac.in/placements/statistics, https://www.shiksha.com/college/iiit-nagpur-indian-institute-of-information-technology-53876/placement",
    overallPlacementStats: { avgStudentsPlacedPerYear: 188, overallPlacementRate: 90.82 },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 792000,
        avgPackage: 1325000,
        placementRate: 92,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science",
      },
      {
        name: "B.Tech in Electronics & Communication Engineering",
        shortName: "BTECH ECE",
        duration: "4 years",
        fees: 792000,
        avgPackage: 950000,
        placementRate: 88,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science",
      },
    ],
  },
  {
    name: "Yeshwantrao Chavan College of Engineering, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source:
      "https://ycce.edu/placement-details/, https://www.shiksha.com/college/yeshwantrao-chavan-college-of-engineering-nagar-yuwak-shikshan-sanstha-nagpur-11259/placement",
    overallPlacementStats: { avgStudentsPlacedPerYear: 1013, overallPlacementRate: 85 },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 700000,
        avgPackage: 650000,
        placementRate: 90,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science",
      },
      {
        name: "B.Tech in Information Technology",
        shortName: "BTECH IT",
        duration: "4 years",
        fees: 700000,
        avgPackage: 620000,
        placementRate: 88,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science",
      },
      {
        name: "B.Tech in Mechanical Engineering",
        shortName: "BTECH ME",
        duration: "4 years",
        fees: 700000,
        avgPackage: 520000,
        placementRate: 75,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science",
      },
    ],
  },
  {
    name: "G.H. Raisoni College of Engineering, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source:
      "https://ghrce.raisoni.net/training-placement, https://www.shiksha.com/college/g-h-raisoni-college-of-engineering-nagpur-47173/placement",
    overallPlacementStats: { avgStudentsPlacedPerYear: 900, overallPlacementRate: 85 },
    courses: [
      {
        name: "B.Tech in Computer Science Engineering",
        shortName: "BTECH CSE",
        duration: "4 years",
        fees: 681000,
        avgPackage: 560000,
        placementRate: 80,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science",
      },
      {
        name: "B.Tech in Mechanical Engineering",
        shortName: "BTECH ME",
        duration: "4 years",
        fees: 681000,
        avgPackage: 420000,
        placementRate: 75,
        growthRate: 0.102,
        discountRate: 0.08,
        careerYears: 30,
        stream: "Science",
      },
      {
        name: "MBA in Finance",
        shortName: "MBA FIN",
        duration: "2 years",
        fees: 274000,
        avgPackage: 520000,
        placementRate: 78,
        growthRate: 0.095,
        discountRate: 0.08,
        careerYears: 28,
        stream: "Commerce",
      },
    ],
  },
  {
    name: "AIIMS Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Government",
    source: "https://www.aiimsngp.edu.in/, https://collegedunia.com/mbbs/nagpur-colleges",
    overallPlacementStats: { avgStudentsPlacedPerYear: 175, overallPlacementRate: 95 },
    courses: [
      {
        name: "MBBS (Bachelor of Medicine)",
        shortName: "MBBS",
        duration: "5.5 years",
        fees: 5856,
        avgPackage: 1800000,
        placementRate: 98,
        growthRate: 0.09,
        discountRate: 0.08,
        careerYears: 35,
        stream: "Science",
      },
      {
        name: "M.D. (Doctor of Medicine)",
        shortName: "MD",
        duration: "3 years",
        fees: 50000,
        avgPackage: 2100000,
        placementRate: 92,
        growthRate: 0.09,
        discountRate: 0.08,
        careerYears: 32,
        stream: "Science",
      },
    ],
  },
  {
    name: "Government Medical College, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Government",
    source:
      "https://collegedunia.com/mbbs/nagpur-colleges, https://validcollege.com/college/government-medical-college-nagpur",
    overallPlacementStats: { avgStudentsPlacedPerYear: 250, overallPlacementRate: 93 },
    courses: [
      {
        name: "MBBS (Bachelor of Medicine)",
        shortName: "MBBS",
        duration: "5.5 years",
        fees: 447000,
        avgPackage: 1650000,
        placementRate: 95,
        growthRate: 0.09,
        discountRate: 0.08,
        careerYears: 35,
        stream: "Science",
      },
      {
        name: "B.Sc (Nursing)",
        shortName: "BSCN",
        duration: "4 years",
        fees: 35200,
        avgPackage: 450000,
        placementRate: 88,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 33,
        stream: "Science",
      },
    ],
  },
  {
    name: "Indira Gandhi Government Medical College & Hospital, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Government",
    source:
      "https://collegedunia.com/mbbs/nagpur-colleges, https://medicine.careers360.com/colleges/list-of-mbbs-colleges-in-nagpur",
    overallPlacementStats: { avgStudentsPlacedPerYear: 200, overallPlacementRate: 91 },
    courses: [
      {
        name: "MBBS (Bachelor of Medicine)",
        shortName: "MBBS",
        duration: "5.5 years",
        fees: 560000,
        avgPackage: 1550000,
        placementRate: 93,
        growthRate: 0.09,
        discountRate: 0.08,
        careerYears: 35,
        stream: "Science",
      },
    ],
  },
  {
    name: "Maharashtra National Law University (MNLU), Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Government",
    source:
      "https://www.careers360.com/university/maharashtra-national-law-university-nagpur/placement, https://collegedunia.com/llb/nagpur-colleges",
    overallPlacementStats: { avgStudentsPlacedPerYear: 106, overallPlacementRate: 88 },
    courses: [
      {
        name: "BA LLB (Bachelor of Arts + Laws)",
        shortName: "BA LLB",
        duration: "5 years",
        fees: 1129000,
        avgPackage: 700000,
        placementRate: 90,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 35,
        stream: "Arts",
      },
      {
        name: "BBA LLB (Bachelor of Business + Laws)",
        shortName: "BBA LLB",
        duration: "5 years",
        fees: 1129000,
        avgPackage: 750000,
        placementRate: 88,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 35,
        stream: "Commerce",
      },
      {
        name: "LLM (Master of Laws)",
        shortName: "LLM",
        duration: "2 years",
        fees: 420000,
        avgPackage: 550000,
        placementRate: 82,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 33,
        stream: "Arts",
      },
    ],
  },
  {
    name: "Dr. Babasaheb Ambedkar College of Law, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Government",
    source:
      "https://collegedunia.com/llb/nagpur-colleges, https://www.shiksha.com/college/dr-b-r-ambedkar-college-of-law-nagpur-70351/placement",
    overallPlacementStats: { avgStudentsPlacedPerYear: 85, overallPlacementRate: 70 },
    courses: [
      {
        name: "LLB (Bachelor of Laws)",
        shortName: "LLB",
        duration: "3 years",
        fees: 52500,
        avgPackage: 400000,
        placementRate: 72,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 35,
        stream: "Arts",
      },
    ],
  },
  {
    name: "GH Raisoni Law School, Nagpur",
    location: "Nagpur, Maharashtra",
    type: "Private",
    source: "https://collegedunia.com/llb/nagpur-colleges, https://applylynk.com/colleges/law-colleges-in-nagpur",
    overallPlacementStats: { avgStudentsPlacedPerYear: 65, overallPlacementRate: 68 },
    courses: [
      {
        name: "BA LLB (Bachelor of Arts + Laws)",
        shortName: "BA LLB",
        duration: "5 years",
        fees: 93000,
        avgPackage: 380000,
        placementRate: 70,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 35,
        stream: "Arts",
      },
      {
        name: "LLB (Bachelor of Laws)",
        shortName: "LLB",
        duration: "3 years",
        fees: 85000,
        avgPackage: 320000,
        placementRate: 65,
        growthRate: 0.085,
        discountRate: 0.08,
        careerYears: 35,
        stream: "Arts",
      },
    ],
  },
]

/* -----------------------
   STATIC DATA DEFINITIONS
   ----------------------- */
const STREAMS = [
  { id: "arts", label: "Arts" },
  { id: "science", label: "Science" },
  { id: "commerce", label: "Commerce" },
  // { id: "vocational", label: "Vocational" },
]

const COLLEGE_TYPES = [
  { id: "Government", label: "Government" },
  { id: "Private", label: "Private" },
]

const SKILLS = [
  { id: "communication", label: "Communication" },
  { id: "coding", label: "Coding" },
  { id: "management", label: "Management" },
  { id: "research", label: "Research" },
]

const UPSKILLS = [
  { id: "cert1", label: "Advanced Certification" },
  { id: "cert2", label: "Professional Course" },
]

const SCHOLARSHIPS = [
  { id: "merit", label: "Merit Scholarship" },
  { id: "need", label: "Need-based Scholarship" },
]

const TYPE_DEFAULTS = {
  top_tier_engineering: { timeToValue: 3, scholarshipOdds: 0.4 },
  top_tier_medical: { timeToValue: 6, scholarshipOdds: 0.3 },
  top_tier_law: { timeToValue: 6, scholarshipOdds: 0.3 },
  govt_regular: { timeToValue: 6, scholarshipOdds: 0.25 },
  private_regular: { timeToValue: 9, scholarshipOdds: 0.15 },
}

/* -----------------------
   HELPER FUNCTIONS
   ----------------------- */
function classifyInstitution(college) {
  if (!college) return "private_regular"
  const name = (college.name || "").toLowerCase()
  const type = (college.type || "").toLowerCase()

  if (name.includes("aiims")) return "top_tier_medical"
  if (name.includes("national law university")) return "top_tier_law"
  if (name.includes("iit") || name.includes("nit") || name.includes("iiit")) return "top_tier_engineering"
  if (type.includes("government")) return "govt_regular"
  return "private_regular"
}

function getTypeDefaults(college) {
  const key = classifyInstitution(college)
  return TYPE_DEFAULTS[key] || { timeToValue: 6, scholarshipOdds: 0.2 }
}

const getLabel = (item, lang = 'en') => {
  if (!item) return ""
  if (typeof item === 'string') return item
  if (item.label && typeof item.label === 'object') {
    return item.label[lang] || item.label.en || item.label.hi || Object.values(item.label)[0] || ""
  }
  return item.label || item.name || item.id || ""
}

const currency = (x) => `₹${Number(x || 0).toLocaleString("en-IN")}`

const getCoursesForStream = (streamId) => {
  const streamName =
    streamId === "arts"
      ? "Arts"
      : streamId === "science"
        ? "Science"
        : streamId === "commerce"
          ? "Commerce"
          : "Vocational"
  const coursesMap = new Map()

  INTEGRATED_COLLEGE_DATA.forEach((college) => {
    college.courses.forEach((course) => {
      if (course.stream === streamName && !coursesMap.has(course.shortName)) {
        coursesMap.set(course.shortName, {
          id: course.shortName,
          label: course.name,
          ...course,
        })
      }
    })
  })

  return Array.from(coursesMap.values())
}

const getCollegesForTypeAndCourse = (collegeType, courseId) => {
  return INTEGRATED_COLLEGE_DATA.filter((college) => {
    const matchesType = college.type === collegeType
    const hasCourse = !courseId || college.courses.some((c) => c.shortName === courseId)
    return matchesType && hasCourse
  }).map((college) => ({
    id: college.name,
    label: college.name,
    location: college.location,
    source: college.source,
    ...college,
  }))
}

const getCourseDataForCollege = (collegeName, courseId) => {
  const college = INTEGRATED_COLLEGE_DATA.find((c) => c.name === collegeName)
  if (!college) return null
  return college.courses.find((c) => c.shortName === courseId) || null
}

const getCollegeData = (collegeName) => {
  return INTEGRATED_COLLEGE_DATA.find((c) => c.name === collegeName) || null
}

const calculateMetrics = (courseData, scholarship = "", college = null) => {
  if (!courseData) return {
    npv: 0, roi: 0, rois: { annualized: 0, total: 0, paybackYears: 0 },
    startingSalary: 0, employmentProb: 0, timeToValue: 0, paybackYears: 0,
    totalCost: 0, totalFees: 0, careerYears: 0, scholarshipOdds: 0,
  }

  const fees = courseData.fees || 0
  const avgPackage = courseData.avgPackage || 0
  const placementRate = (courseData.placementRate || 0) / 100
  const growthRate = courseData.growthRate || 0.05
  const discountRate = courseData.discountRate || 0.08
  const careerYears = courseData.careerYears || 30

  const scholarshipDiscount = scholarship ? 0.2 : 0
  const adjustedFees = fees * (1 - scholarshipDiscount)

  // NPV
  let npv = -adjustedFees
  for (let t = 1; t <= careerYears; t++) {
    const expectedEarnings = avgPackage * Math.pow(1 + growthRate, t - 1) * placementRate
    npv += expectedEarnings / Math.pow(1 + discountRate, t)
  }

  // ROI
  const annualizedROI = adjustedFees > 0 
    ? (Math.pow(npv / adjustedFees, 1 / careerYears) - 1) * 100 
    : 0
  const totalROI = adjustedFees > 0 
    ? ((npv / adjustedFees) - 1) * 100 
    : 0

  // Payback period
  let cumulativeEarnings = 0
  let paybackYears = careerYears
  for (let t = 1; t <= careerYears; t++) {
    const expectedEarnings = avgPackage * Math.pow(1 + growthRate, t - 1) * placementRate
    const discountedEarnings = expectedEarnings / Math.pow(1 + discountRate, t)
    cumulativeEarnings += discountedEarnings
    if (cumulativeEarnings >= adjustedFees && paybackYears === careerYears) {
      paybackYears = t
      break
    }
  }

  const institutionClass = classifyInstitution(college)
  const { timeToValue: typeTimeToValue, scholarshipOdds: baseScholarshipOdds } 
    = TYPE_DEFAULTS[institutionClass]
  const timeToValue = Math.min(paybackYears, typeTimeToValue)

  return {
    npv: Math.round(npv),
    totalFees: Math.round(fees),
    totalCost: Math.round(adjustedFees),
    roi: Number.parseFloat(annualizedROI.toFixed(2)),
    rois: {
      annualized: Number.parseFloat(annualizedROI.toFixed(2)),
      total: Number.parseFloat(totalROI.toFixed(2)),
      paybackYears: paybackYears
    },
    startingSalary: Math.round(avgPackage * placementRate),
    employmentProb: Number.parseFloat((placementRate * 100).toFixed(2)),
    timeToValue: Number.parseFloat(timeToValue.toFixed(1)),
    paybackYears: paybackYears,
    careerYears: careerYears,
    scholarshipOdds: Number.parseFloat(baseScholarshipOdds.toFixed(1)),
  }
}

const generateNarrative = (scenario) => {
  if (!scenario.college) {
    return "Please select your career path first."
  }

  const streamLabel = getLabel(STREAMS.find((s) => s.id === scenario.stream))
  const courseData = getCourseDataForCollege(scenario.college, scenario.course)
  const courseName = courseData?.name || scenario.course

  return `You've selected ${streamLabel} stream with ${courseName} at ${scenario.college}. Your total investment will be around ${currency(scenario.totalFees || scenario.totalCost || 0)}${scenario.scholarship ? ` (${currency(scenario.totalCost)} after scholarship)` : ""}. Your expected return on investment is ${scenario.roi?.toFixed(1)}%. You have a ${((scenario.employmentProb || 0)).toFixed(0)}% employment probability with a starting salary of ${currency(scenario.startingSalary)}. On average, it takes about ${scenario.timeToValue || 6} years to reach value. This path offers strong career prospects with quality returns on your educational investment.`
}

const createEmptyScenario = (id, name) => ({
  id,
  name,
  stream: "",
  course: "",
  collegeType: "",
  college: "",
  skills: [],
  upskill: [],
  scholarship: "",
  npv: 0,
  roi: 0,
  startingSalary: 0,
  employmentProb: 0,
  timeToValue: 0,
  totalCost: 0,
  totalFees: 0,
  careerYears: 0,
  scholarshipOdds: 0,
  source: "",
})

/* -----------------------
   MAIN COMPONENT
   ----------------------- */
export default function SimulatorPage() {
  const [scenarios, setScenarios] = useState([createEmptyScenario("sc1", "Scenario 1")])
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0)
  const active = scenarios[activeScenarioIndex] || createEmptyScenario("sc0", "Scenario")

  const [stream, setStream] = useState("")
  const [course, setCourse] = useState("")
  const [collegeType, setCollegeType] = useState("")
  const [college, setCollege] = useState("")
  const [skills, setSkills] = useState([])
  const [upskill, setUpskill] = useState([])
  const [scholarship, setScholarship] = useState("")

  const [showFullChart, setShowFullChart] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareContent, setShareContent] = useState("")
  const [showSharePdfModal, setShowSharePdfModal] = useState(false)
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null)

  const [voiceConsent, setVoiceConsent] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcripts, setTranscripts] = useState([])
  const [dockExpanded, setDockExpanded] = useState(false)
  const recognitionRef = useRef(null)
  const synthRef = useRef(typeof window !== "undefined" && window.speechSynthesis ? window.speechSynthesis : null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const filteredCourses = useMemo(() => {
    if (!stream) return []
    return getCoursesForStream(stream)
  }, [stream])

  const filteredColleges = useMemo(() => {
    if (!collegeType) return []
    return getCollegesForTypeAndCourse(collegeType, course)
  }, [collegeType, course])

  const currentCollegeData = useMemo(() => {
    if (!college) return null
    return getCollegeData(college)
  }, [college])

  const currentMetrics = useMemo(() => {
    if (!college || !course) {
      return {
        npv: 0,
        roi: 0,
        startingSalary: 0,
        employmentProb: 0,
        timeToValue: 0,
        totalCost: 0,
        totalFees: 0,
        careerYears: 0,
        scholarshipOdds: 0,
      }
    }
    const courseData = getCourseDataForCollege(college, course)
    const collegeData = getCollegeData(college)
    return calculateMetrics(courseData, scholarship, collegeData)
  }, [college, course, scholarship])

  const isSelectionComplete = stream && course && collegeType && college

  const totalPoints = useMemo(
    () => scenarios.reduce((acc, s) => acc + Math.round((s.npv || 0) / 100000), 0),
    [scenarios],
  )

  // const badges = useMemo(() => {
  //   const out = []
  //   if (totalPoints >= 50) out.push("Career Pro")
  //   if (totalPoints >= 30) out.push("Explorer")
  //   if (totalPoints >= 10) out.push("Beginner")
  //   return out
  // }, [totalPoints])

  const saveActiveChanges = () => {
    const updated = [...scenarios]
    updated[activeScenarioIndex] = {
      ...active,
      stream,
      course,
      collegeType,
      college,
      skills,
      upskill,
      scholarship,
      ...currentMetrics,
    }
    setScenarios(updated)
  }

  const resetSelection = () => {
    setStream("")
    setCourse("")
    setCollegeType("")
    setCollege("")
    setSkills([])
    setUpskill([])
    setScholarship("")
  }

  const addScenario = () => {
    const newId = `sc${scenarios.length + 1}`
    const newScenario = createEmptyScenario(newId, `Scenario ${scenarios.length + 1}`)
    setScenarios([...scenarios, newScenario])
    setActiveScenarioIndex(scenarios.length)
  }

  const deleteScenario = (idx) => {
    if (scenarios.length === 1) return
    const updated = scenarios.filter((_, i) => i !== idx)
    setScenarios(updated)
    if (activeScenarioIndex >= updated.length) {
      setActiveScenarioIndex(Math.max(0, updated.length - 1))
    }
  }

  const toggleSkill = (skillId) => {
    setSkills((prev) => (prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]))
  }

  const toggleUpskill = (upskillId) => {
    setUpskill((prev) => (prev.includes(upskillId) ? prev.filter((id) => id !== upskillId) : [...prev, upskillId]))
  }

  const playTts = (text) => {
    if (!text || !synthRef.current) {
      alert("Speech not supported in your browser")
      return
    }

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-IN"
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1

    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
      alert("Speech failed. Try again.")
    }

    synthRef.current.speak(utterance)
  }

  const handlePauseTts = () => {
    if (!synthRef.current || !isSpeaking) return

    if (isPaused) {
      synthRef.current.resume()
      setIsPaused(false)
    } else {
      synthRef.current.pause()
      setIsPaused(true)
    }
  }

  const handleRestartTts = () => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
  }
 const handleExportSummary = async () => {
  if (!isSelectionComplete) {
    alert("Please complete your selection first!")
    return
  }

  try {
    await exportSummary({
      scenarios: scenarios.filter(s => s.college), // Only completed ones
      STREAMS,
      getLabel,
      currency,
      t: (key) => key,
    })
  } catch (err) {
    console.error("Export failed:", err)
    alert("Export failed. Please try again.")
  }
}

  const handleShareSummary = () => {
    if (!isSelectionComplete) return
    setShareContent(generateNarrative({ stream, course, collegeType, college, ...currentMetrics }))
    setShowShareModal(true)
  }

  const generateShareContent = () => {
    return generateNarrative({ stream, course, collegeType, college, ...currentMetrics })
  }

  const toggleListening = () => {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }

  useEffect(() => {
    if (!voiceConsent) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("")
      setTranscripts((prev) => [...prev, transcript])
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [voiceConsent])

  useEffect(() => {
    setStream(active?.stream || "")
    setCourse(active?.course || "")
    setCollegeType(active?.collegeType || "")
    setCollege(active?.college || "")
    setSkills(active?.skills || [])
    setUpskill(active?.upskill || [])
    setScholarship(active?.scholarship || "")
  }, [activeScenarioIndex, active])

  useEffect(() => {
    if (stream) {
      const courses = getCoursesForStream(stream)
      if (courses.length > 0 && !courses.find((c) => c.id === course)) {
        setCourse("")
      }
    } else {
      setCourse("")
    }
  }, [stream])

  useEffect(() => {
    if (collegeType && course) {
      const colleges = getCollegesForTypeAndCourse(collegeType, course)
      if (colleges.length > 0 && !colleges.find((c) => c.id === college)) {
        setCollege("")
      }
    } else {
      setCollege("")
    }
  }, [collegeType, course])

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 text-gray-900 font-sans">
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto px-6 py-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg leading-tight">
              Disha Lab
            </h1>
            <p className="mt-2 text-base md:text-lg opacity-95">
              Explore your career options with data-driven insights
            </p>
          </div>

          {/* Header Stats */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm opacity-80">Total Scenarios</div>
              <div className="text-2xl md:text-3xl font-extrabold">{scenarios.length}</div>
            </div>
            {/* <div className="bg-white bg-opacity-20 rounded-xl px-5 py-3 flex items-center gap-4">
              <Target className="w-7 h-7 text-white" aria-hidden="true" />
              <div>
                <div className="text-xs opacity-80">Points</div>
                <div className="font-semibold">{totalPoints}</div>
              </div>
            </div> */}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <main className="max-w-7xl mx-auto px-6 pb-40 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* LEFT SIDEBAR: Input Controls */}
        <aside className="md:col-span-4 bg-white rounded-3xl p-6 shadow-xl border border-indigo-100">
          <h2 className="text-lg font-semibold mb-4 text-indigo-700">Select Your Career Path</h2>

          <form className="space-y-4">
            {/* Stream Selection */}
            <div>
              <label htmlFor="stream-select" className="block text-sm text-indigo-700 mb-2 font-semibold">
                Stream
              </label>
              <select
                id="stream-select"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="w-full rounded-xl p-3 border border-indigo-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select Stream --</option>
                {STREAMS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {getLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            {/* Course Selection */}
            <div>
              <label htmlFor="course-select" className="block text-sm text-indigo-700 mb-2 font-semibold">
                Course
              </label>
              <select
                id="course-select"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                disabled={!stream}
                className="w-full rounded-xl p-3 border border-indigo-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Course --</option>
                {filteredCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getLabel(c)}
                  </option>
                ))}
              </select>
              {stream && filteredCourses.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">No courses available for this stream</p>
              )}
            </div>

            {/* College Type Selection */}
            <div>
              <label htmlFor="college-type-select" className="block text-sm text-indigo-700 mb-2 font-semibold">
                College Type
              </label>
              <select
                id="college-type-select"
                value={collegeType}
                onChange={(e) => setCollegeType(e.target.value)}
                disabled={!course}
                className="w-full rounded-xl p-3 border border-indigo-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Type --</option>
                {COLLEGE_TYPES.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {getLabel(ct)}
                  </option>
                ))}
              </select>
            </div>

            {/* College Selection */}
            <div>
              <label htmlFor="college-select" className="block text-sm text-indigo-700 mb-2 font-semibold">
                College
              </label>
              <select
                id="college-select"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                disabled={!collegeType}
                className="w-full rounded-xl p-3 border border-indigo-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Select College --</option>
                {filteredColleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getLabel(c)}
                  </option>
                ))}
              </select>
              {collegeType && filteredColleges.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">No colleges offer this course</p>
              )}
            </div>
          </form>

          <hr className="my-5 border-indigo-100" />

          {/* Skills Section */}
          {/* <fieldset>
            <legend className="text-sm font-semibold text-indigo-700 mb-3">Skills</legend>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setSkills([])}
                className="text-sm text-indigo-500 hover:underline"
                aria-label="Clear all selected skills"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleSkill(s.id)}
                  aria-pressed={skills.includes(s.id)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold border transition ${
                    skills.includes(s.id)
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "bg-white border-indigo-100 text-indigo-700"
                  }`}
                >
                  {getLabel(s)}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Upskill Section */}
          {/* <fieldset className="mt-4">
            <legend className="text-sm font-semibold text-indigo-700 mb-3">Upskill</legend>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setUpskill([])}
                className="text-sm text-indigo-500 hover:underline"
                aria-label="Clear all selected upskills"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {UPSKILLS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => toggleUpskill(u.id)}
                  aria-pressed={upskill.includes(u.id)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold border transition ${
                    upskill.includes(u.id)
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "bg-white border-indigo-100 text-indigo-700"
                  }`}
                >
                  {getLabel(u)}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Scholarship Section */}
          {/* <div className="mt-4">
            <label htmlFor="scholarship-select" className="block mb-2 font-semibold text-indigo-700">
              Scholarship
            </label>
            <select
              id="scholarship-select"
              value={scholarship}
              onChange={(e) => setScholarship(e.target.value)}
              className="w-full rounded-lg p-3 border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select --</option>
              {SCHOLARSHIPS.map((s) => (
                <option key={s.id} value={s.id}>
                  {getLabel(s)}
                </option>
              ))}
            </select>
          </div>  */}
           

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={saveActiveChanges}
              disabled={!isSelectionComplete}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl py-3 font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition"
              aria-label="Save current scenario"
            >
              Save Scenario
            </button>
            <button
              onClick={resetSelection}
              className="px-4 py-3 border border-indigo-100 rounded-2xl text-indigo-700 hover:bg-indigo-50 transition"
              aria-label="Reset all selections"
            >
              Reset
            </button>
          </div>

          <button
            onClick={addScenario}
            className="mt-3 w-full flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200 rounded-2xl py-3 text-indigo-600 hover:bg-indigo-50 transition"
            aria-label="Add a new scenario"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Add New Scenario
          </button>
        </aside>

        {/* CENTER: Summary Section */}
        <section className="md:col-span-5">
          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Career Summary</h2>
              {!isSelectionComplete && (
                <p className="text-sm text-orange-500" role="alert">
                  Complete your selection to see metrics
                </p>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* ROI Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" aria-hidden="true" />
                  <span className="text-sm font-semibold text-green-700">ROI</span>
                </div>
                <p className="text-2xl font-bold text-green-800">
                  {isSelectionComplete ? `${currentMetrics.roi?.toFixed(1)}%` : "-"}
                </p>
              </div>

              {/* NPV Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  <span className="text-sm font-semibold text-blue-700">NPV</span>
                </div>
                <p className="text-2xl font-bold text-blue-800">
                  {isSelectionComplete ? currency(currentMetrics.npv) : "-"}
                </p>
              </div>

              {/* Starting Salary Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" aria-hidden="true" />
                  <span className="text-sm font-semibold text-purple-700">Starting Salary</span>
                </div>
                <p className="text-2xl font-bold text-purple-800">
                  {isSelectionComplete ? currency(currentMetrics.startingSalary) : "-"}
                </p>
              </div>

              {/* Employment Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                  <span className="text-sm font-semibold text-indigo-700">Employment</span>
                </div>
                <p className="text-2xl font-bold text-indigo-800">
                  {isSelectionComplete ? `${((currentMetrics.employmentProb || 0)).toFixed(0)}%` : "-"}
                </p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="sr-only">Additional Statistics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-gray-500">Total Fees:</span>
                  <span className="ml-auto font-semibold">
                    {isSelectionComplete ? currency(currentMetrics.totalFees) : "-"}
                  </span>
                </div>
                {/* <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-gray-500">After Scholarship:</span>
                  <span className="ml-auto font-semibold">
                    {isSelectionComplete ? currency(currentMetrics.totalCost) : "-"}
                  </span>
                </div> */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-gray-500">Time to Value:</span>
                  <span className="ml-auto font-semibold">
                    {isSelectionComplete ? `${currentMetrics.timeToValue} Years` : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Career Years:</span>
                  <span className="ml-2 font-semibold">{isSelectionComplete ? currentMetrics.careerYears : "-"}</span>
                </div>
                {/* <div className="col-span-2">
                  <span className="text-gray-500">Scholarship Odds:</span>
                  <span className="ml-2 font-semibold">
                    {isSelectionComplete && scholarship ? `${(currentMetrics.scholarshipOdds * 100).toFixed(0)}%` : "-"}
                  </span>
                </div> */}
              </div>
            </div>

            {/* Data Source */}
            {isSelectionComplete && currentCollegeData?.source && (
              <div className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-100">
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-indigo-700 mb-1">Data Source</h3>
                    <p className="text-xs text-gray-600 mb-2">Verify placement data from official sources:</p>
                    <div className="flex flex-wrap gap-2">
                      {currentCollegeData.source.split(",").map((url, idx) => (
                        <a
                          key={idx}
                          href={url.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition truncate max-w-[200px]"
                          aria-label={`Open source link for ${new URL(url.trim()).hostname}`}
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                          <span className="truncate">{new URL(url.trim()).hostname}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Narration and Export Controls */}
            <div className="space-y-3">
              <button
                onClick={() => playTts(generateNarrative({ stream, course, collegeType, college, ...currentMetrics }))}
                disabled={!isSelectionComplete}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition"
                aria-label="Play narration of career summary"
              >
                <Volume2 className="w-4 h-4" aria-hidden="true" /> Play Narration
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handlePauseTts}
                  disabled={!isSpeaking}
                  className="flex-1 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-200 transition"
                  aria-label={isPaused ? "Resume narration" : "Pause narration"}
                >
                  <Pause className="w-4 h-4 inline mr-2" aria-hidden="true" /> {isPaused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={handleRestartTts}
                  disabled={!isSpeaking}
                  className="flex-1 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-200 transition"
                  aria-label="Restart narration"
                >
                  <RotateCcw className="w-4 h-4 inline mr-2" aria-hidden="true" /> Restart
                </button>
              </div>

              <button
  onClick={handleExportSummary}
  disabled={!isSelectionComplete}
  className="w-full flex items-center justify-center gap-2 border-2 border-indigo-600 text-indigo-600 py-3 rounded-lg font-semibold hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
>
  <Download className="w-6 h-6" />
  Export Full PDF Report
</button>

              <button
                onClick={handleShareSummary}
                disabled={!isSelectionComplete}
                className="w-full flex items-center justify-center gap-2 border-2 border-purple-600 text-purple-600 py-3 rounded-lg font-semibold hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Share career summary"
              >
                <Share2 className="w-4 h-4" aria-hidden="true" /> Share Summary
              </button>
            </div>
          </div>

          {/* FlowChart */}
          
        </section>

        {/* RIGHT SIDEBAR: Scenarios List */}
        <aside className="md:col-span-3">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-indigo-100">
            <h2 className="text-lg font-semibold mb-4 text-indigo-700">Saved Scenarios</h2>

            <nav className="space-y-3 max-h-[500px] overflow-y-auto">
              {scenarios.map((scenario, idx) => (
                <motion.button
                  key={scenario.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setActiveScenarioIndex(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 cursor-pointer transition ${
                    idx === activeScenarioIndex
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                  aria-current={idx === activeScenarioIndex ? "page" : undefined}
                  aria-label={`Scenario ${idx + 1}: ${scenario.name}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                      {scenario.college ? (
                        <div className="mt-1 text-xs text-gray-500">
                          <p>
                            {scenario.course} @ {scenario.college.substring(0, 25)}...
                          </p>
                          <p className="mt-1 text-indigo-600 font-medium">
                            ROI: {scenario.roi?.toFixed(1)}% | NPV: {currency(scenario.npv)}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-orange-500">Not configured</p>
                      )}
                    </div>
                    {scenarios.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteScenario(idx)
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition"
                        aria-label={`Delete scenario ${idx + 1}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </motion.button>
              ))}
            </nav>

            {/* Quick Share */}
            <button
              onClick={() => {
                if (isSelectionComplete) {
                  setShareContent(generateShareContent())
                  setShowShareModal(true)
                } else {
                  alert("Please complete selection first")
                }
              }}
              disabled={!isSelectionComplete}
              className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Share current scenario"
            >
              Share
            </button>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-indigo-100 mt-4">
            <div className="text-lg font-semibold mb-4 text-indigo-700">Explore Other Possible Careers</div>
            <ReactFlowProvider>
              <FlowChartEmbedded
                onExpand={() => setShowFullChart(true)}
                active={{ stream, course, collegeType, college, ...currentMetrics }}
              />
            </ReactFlowProvider>
          </div>
        </aside>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {/* Full Screen FlowChart Modal */}
        {showFullChart && (
          <FullScreenFlowChart
            onClose={() => setShowFullChart(false)}
            active={{ stream, course, collegeType, college, ...currentMetrics }}
            getLabel={getLabel}
            lang="en"
          />
        )}

        {/* Share Text Modal */}
        {showShareModal && (
          <Portal>
            <ShareModule
              summaryText={shareContent}
              summaryUrl={typeof window !== "undefined" ? window.location.href : ""}
              onClose={() => setShowShareModal(false)}
            />
          </Portal>
        )}

        {/* Share PDF Modal */}
        {showSharePdfModal && (
          <Portal>
            <SharePdfModule
              pdfBlob={generatedPdfBlob}
              fileName="career-summary.pdf"
              onClose={() => setShowSharePdfModal(false)}
            />
          </Portal>
        )}

        {/* Voice Dock */}
        {dockExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Voice Commands</h3>
              <button
                onClick={() => setDockExpanded(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
                aria-label="Close voice commands"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4">
              {!voiceConsent ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Enable voice commands?</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setVoiceConsent(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                      aria-label="Enable voice commands"
                    >
                      Enable
                    </button>
                    <button
                      onClick={() => setDockExpanded(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                      aria-label="Cancel voice commands"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={toggleListening}
                    className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                      listening
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    }`}
                    aria-label={listening ? "Stop listening" : "Start listening"}
                  >
                    <Mic className="w-5 h-5" aria-hidden="true" />
                    {listening ? "Stop Listening" : "Start Listening"}
                  </button>

                  <div className="h-24 overflow-auto bg-gray-50 rounded-lg p-2 text-xs border border-gray-200">
                    {transcripts.length === 0 ? (
                      <p className="text-gray-400 italic">Transcripts will appear here...</p>
                    ) : (
                      transcripts.map((tr, i) => (
                        <p key={i} className="mb-1 text-gray-700">
                          {tr}
                        </p>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setTranscripts([])}
                    className="w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                    aria-label="Clear voice transcripts"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
