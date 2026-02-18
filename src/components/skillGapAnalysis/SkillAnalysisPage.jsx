import { useState, useRef } from 'react'
import {
  Upload,
  Target,
  TrendingUp,
  Loader,
  FileUp,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  Zap
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export default function SkillAnalysisPage() {
  const [file, setFile] = useState(null)
  const [careerRole, setCareerRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const inputRef = useRef(null)

  const handleAnalyze = async () => {
    if (!file || !careerRole.trim()) {
      setError('Please upload a resume and enter a career role')
      return
    }

    setLoading(true)
    setError('')
    setResults(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('career', careerRole)

      const response = await fetch('http://127.0.0.1:8080/api/analyze', {
        method: 'POST',
        body: formData,
      })


      if (!response.ok) {
        throw new Error('Failed to analyze resume')
      }

      const apiResponse = await response.json()
      console.log(apiResponse);

      /**
       * 🔥 ADAPTER LAYER
       * Converts NEW backend response → OLD UI schema
       * UI remains 100% unchanged
       */
      const adaptedResults = {
        matched_skills: apiResponse.data.major_strengths || [],
        missing_skills: apiResponse.data.major_skill_gaps || [],
        required_skills: [
          ...(apiResponse.data.major_strengths || []),
          ...(apiResponse.data.major_skill_gaps || []),
        ],
        improvement_roadmap: Object.values(
          apiResponse.data.structured_roadmap || {}
        ).flat(),
        match_percentage: apiResponse.data.technical_match_percentage ?? 0,
        explicit_skills: apiResponse.data.major_strengths || [],
        inferred_skills: [],
      }

      setResults(adaptedResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (file) => {
    if (file.type === 'application/pdf') {
      setFile(file)
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const matchPercentage =
    typeof results?.match_percentage === 'string'
      ? parseInt(results.match_percentage)
      : results?.match_percentage

  const getMatchColor = (percentage) => {
    if (percentage >= 75) return 'from-green-500 to-green-600'
    if (percentage >= 50) return 'from-yellow-500 to-yellow-600'
    return 'from-red-500 to-red-600'
  }

  const getMatchStatus = (percentage) => {
    if (percentage >= 75) return { text: 'Excellent Match', color: 'text-green-700' }
    if (percentage >= 50) return { text: 'Good Match', color: 'text-yellow-700' }
    return { text: 'Needs Work', color: 'text-red-700' }
  }

  const handleReset = () => setResults(null)

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Skill Gap Analyzer
              </h1>
              <p className="text-slate-500 mt-1">
                Identify the skills you need to reach your career goals
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {!results ? (
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-3">
              <Card className="border-2 border-blue-100 bg-white shadow-lg p-8">
                <div className="space-y-6">
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleInputChange}
                    className="hidden"
                  />

                  {!file ? (
                    <button
                      onClick={() => inputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={cn(
                        'w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                        'border-blue-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                      )}
                    >
                      <FileUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <p className="font-semibold text-slate-900 mb-1">
                        Drag & drop your PDF here
                      </p>
                      <p className="text-sm text-slate-500">
                        or click to select a file
                      </p>
                    </button>
                  ) : (
                    <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6 flex gap-3">
                      <CheckCircle className="text-green-600" />
                      <div>
                        <p className="font-semibold">{file.name}</p>
                        <p className="text-sm text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      <Target className="inline w-4 h-4 mr-2 text-blue-600" />
                      Target Career Role
                    </label>
                    <Input
                      value={careerRole}
                      onChange={(e) => setCareerRole(e.target.value)}
                      placeholder="e.g. Data Scientist"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full h-12"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin mr-2" /> Analyzing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2" /> Analyze Skills
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <Button variant="outline" onClick={handleReset}>
              <ArrowLeft className="mr-2" /> Analyze Another Resume
            </Button>

            {/* Match Score */}
            <Card className="border-2 border-blue-100 p-8 shadow-lg">
              <div className="flex items-center gap-4">
                <span
                  className={`text-5xl font-bold bg-gradient-to-r ${getMatchColor(
                    matchPercentage
                  )} bg-clip-text text-transparent`}
                >
                  {matchPercentage}%
                </span>
                <span
                  className={`text-lg font-semibold ${
                    getMatchStatus(matchPercentage).color
                  }`}
                >
                  {getMatchStatus(matchPercentage).text}
                </span>
              </div>
              <Progress value={matchPercentage} className="mt-4" />
            </Card>

            {/* Skills */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="border-2 border-green-100 bg-green-50 p-6">
                <h3 className="font-bold mb-3">
                  Matched Skills ({results.matched_skills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.matched_skills.map((s, i) => (
                    <Badge key={i} className="bg-green-600 text-white">
                      {s}
                    </Badge>
                  ))}
                </div>
              </Card>

              <Card className="border-2 border-red-100 bg-red-50 p-6">
                <h3 className="font-bold mb-3">
                  Missing Skills ({results.missing_skills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.missing_skills.map((s, i) => (
                    <Badge key={i} className="bg-red-200 text-red-800">
                      {s}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>

            {/* Roadmap */}
            <Card className="border-2 border-purple-100 p-6 shadow-lg">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Zap className="text-purple-600" /> Improvement Roadmap
              </h3>
              <ol className="space-y-3">
                {results.improvement_roadmap.map((item, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="font-bold">{idx + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
