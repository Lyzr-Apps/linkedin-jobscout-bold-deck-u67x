'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { FiRefreshCw } from 'react-icons/fi'
import { BiTargetLock } from 'react-icons/bi'

import PreferencesPanel from './sections/PreferencesPanel'
import InputSection from './sections/InputSection'
import ResultsView from './sections/ResultsView'
import ChatPanel from './sections/ChatPanel'

// --- Constants ---
const AGENT_ID = '69a1a2e794f34c9b935dc48b'
const AGENT_NAME = 'Job Match Coordinator'
const SUB_AGENTS = [
  { id: '69a1a2d663cead3f400eb169', name: 'Job Extractor Agent', purpose: 'Scrapes and extracts job listings from LinkedIn' },
  { id: '69a1a2d6ceaca7d828c03804', name: 'Resume Match Analyst', purpose: 'Scores resume against each job listing' },
]

// --- Types ---
interface JobMatch {
  job_title: string
  company_name: string
  location: string
  match_score: number
  fit_category: string
  match_reasoning: string
  skill_gaps: string
  key_matches: string
  posting_url: string
  experience_level: string
}

interface ManagerResponse {
  ranked_matches: JobMatch[]
  total_analyzed: number
  average_match_score: number
  analysis_summary: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// --- Sample Data ---
const SAMPLE_DATA: ManagerResponse = {
  ranked_matches: [
    {
      job_title: 'Senior Frontend Engineer',
      company_name: 'TechCorp Inc.',
      location: 'San Francisco, CA (Remote)',
      match_score: 92,
      fit_category: 'Excellent Match',
      match_reasoning: 'Strong alignment with React/TypeScript expertise. 5+ years experience matches requirement. Previous startup experience valued by the team.',
      skill_gaps: 'GraphQL experience preferred but not required. Familiarity with their proprietary design system would need onboarding.',
      key_matches: 'React, TypeScript, Next.js, CI/CD pipelines, team leadership experience, agile methodology',
      posting_url: 'https://linkedin.com/jobs/view/123456',
      experience_level: 'Senior',
    },
    {
      job_title: 'Full Stack Developer',
      company_name: 'DataFlow Systems',
      location: 'New York, NY',
      match_score: 78,
      fit_category: 'Good Match',
      match_reasoning: 'Solid match on frontend skills. Backend Node.js experience aligns well. Missing some specific cloud infrastructure experience they prefer.',
      skill_gaps: 'AWS Lambda and DynamoDB expertise. Experience with microservices architecture at scale.',
      key_matches: 'JavaScript, Node.js, React, REST APIs, PostgreSQL, Docker',
      posting_url: 'https://linkedin.com/jobs/view/789012',
      experience_level: 'Mid-Senior',
    },
    {
      job_title: 'UI/UX Engineer',
      company_name: 'DesignFirst Agency',
      location: 'Austin, TX (Hybrid)',
      match_score: 65,
      fit_category: 'Partial Match',
      match_reasoning: 'Frontend skills are relevant but this role leans heavily into design systems and Figma-to-code workflows. Less emphasis on application architecture.',
      skill_gaps: 'Figma proficiency, design token management, accessibility auditing, animation libraries (Framer Motion).',
      key_matches: 'CSS, responsive design, component libraries, React, attention to detail',
      posting_url: 'https://linkedin.com/jobs/view/345678',
      experience_level: 'Mid',
    },
    {
      job_title: 'Backend Engineer',
      company_name: 'CloudScale Labs',
      location: 'Seattle, WA',
      match_score: 41,
      fit_category: 'Low Match',
      match_reasoning: 'This role is primarily backend-focused with Go and Kubernetes. While general engineering skills transfer, the core technical stack does not align well.',
      skill_gaps: 'Go programming, Kubernetes orchestration, distributed systems, gRPC, message queues (Kafka).',
      key_matches: 'General software engineering practices, API design, testing methodologies',
      posting_url: 'https://linkedin.com/jobs/view/901234',
      experience_level: 'Senior',
    },
    {
      job_title: 'React Native Developer',
      company_name: 'MobileFirst Co.',
      location: 'Remote (US)',
      match_score: 73,
      fit_category: 'Good Match',
      match_reasoning: 'React experience transfers well to React Native. Mobile development patterns differ but fundamentals are strong.',
      skill_gaps: 'React Native specific APIs, mobile deployment pipelines (App Store, Play Store), native module bridging.',
      key_matches: 'React, JavaScript, TypeScript, component architecture, state management, REST APIs',
      posting_url: 'https://linkedin.com/jobs/view/567890',
      experience_level: 'Mid',
    },
  ],
  total_analyzed: 24,
  average_match_score: 69,
  analysis_summary: 'Out of 24 jobs analyzed from your LinkedIn search, **5 top matches** were identified. Your strongest area is frontend development with React and TypeScript. Consider upskilling in cloud infrastructure (AWS/GCP) and backend technologies to increase your match rate for full-stack positions. The highest-scoring opportunity is at **TechCorp Inc.** with a 92% match.',
}

// --- ErrorBoundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Loading State Component ---
function LoadingState({ progress, statusMessage }: { progress: number; statusMessage: string }) {
  return (
    <div className="max-w-md mx-auto py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 border-2 border-ring border-t-transparent animate-spin mx-auto" />
        <h3 className="text-base font-medium text-foreground">Analyzing Jobs</h3>
        <p className="text-sm text-muted-foreground">{statusMessage}</p>
      </div>
      <Progress value={progress} className="h-1.5" />
      <div className="space-y-3">
        {[
          { label: 'Extracting jobs from LinkedIn...', threshold: 30 },
          { label: 'Analyzing matches against your resume...', threshold: 60 },
          { label: 'Ranking results...', threshold: 90 },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div
              className={cn(
                'h-2 w-2 flex-shrink-0 transition-colors',
                progress > step.threshold
                  ? 'bg-emerald-400'
                  : progress > i * 30
                  ? 'bg-ring animate-pulse'
                  : 'bg-muted'
              )}
            />
            <span
              className={cn(
                'text-muted-foreground',
                progress > step.threshold && 'text-emerald-400'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Main Page ---
export default function Page() {
  // Session
  const [sessionId, setSessionId] = useState('')
  useEffect(() => {
    setSessionId(crypto.randomUUID())
  }, [])

  // App state
  const [appMode, setAppMode] = useState<'input' | 'loading' | 'results'>('input')
  const [showSampleData, setShowSampleData] = useState(false)

  // Preferences state
  const [locations, setLocations] = useState<string[]>([])
  const [experienceLevel, setExperienceLevel] = useState('')
  const [mustHaveKeywords, setMustHaveKeywords] = useState<string[]>([])
  const [niceToHaveKeywords, setNiceToHaveKeywords] = useState<string[]>([])
  const [companySizes, setCompanySizes] = useState<string[]>([])
  const [industries, setIndustries] = useState<string[]>([])

  // Input state
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Results state
  const [results, setResults] = useState<ManagerResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Loading state
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStatus, setLoadingStatus] = useState('')

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatSending, setIsChatSending] = useState(false)

  // Agent status
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // File upload handler
  const handleUploadFile = useCallback(async (file: File) => {
    setIsUploading(true)
    try {
      const uploadResult = await uploadFiles(file)
      if (uploadResult.success && Array.isArray(uploadResult.asset_ids)) {
        setUploadedAssetIds(uploadResult.asset_ids)
      } else {
        setErrorMsg(uploadResult?.error ?? 'Upload failed')
      }
    } catch {
      setErrorMsg('Failed to upload file')
    }
    setIsUploading(false)
  }, [])

  // Loading animation
  useEffect(() => {
    if (appMode !== 'loading') return
    let progressVal = 0
    const statuses = [
      'Extracting jobs from LinkedIn...',
      'Parsing job descriptions...',
      'Analyzing matches against your resume...',
      'Scoring skill alignment...',
      'Ranking results by relevance...',
    ]
    setLoadingProgress(0)
    setLoadingStatus(statuses[0])
    const interval = setInterval(() => {
      progressVal += Math.random() * 8 + 2
      if (progressVal > 95) progressVal = 95
      setLoadingProgress(progressVal)
      const statusIdx = Math.min(
        Math.floor(progressVal / 20),
        statuses.length - 1
      )
      setLoadingStatus(statuses[statusIdx])
    }, 800)
    return () => clearInterval(interval)
  }, [appMode])

  // Search handler
  const handleStartSearch = useCallback(async () => {
    setErrorMsg('')
    setAppMode('loading')
    setActiveAgentId(AGENT_ID)

    const prefParts: string[] = []
    if (locations.length > 0) prefParts.push(`Locations: ${locations.join(', ')}`)
    if (experienceLevel) prefParts.push(`Experience: ${experienceLevel}`)
    if (companySizes.length > 0) prefParts.push(`Company sizes: ${companySizes.join(', ')}`)
    if (industries.length > 0) prefParts.push(`Industries: ${industries.join(', ')}`)
    if (mustHaveKeywords.length > 0) prefParts.push(`Must-have keywords: ${mustHaveKeywords.join(', ')}`)
    if (niceToHaveKeywords.length > 0) prefParts.push(`Nice-to-have keywords: ${niceToHaveKeywords.join(', ')}`)

    const message = [
      `LinkedIn URL: ${linkedinUrl}`,
      resumeText ? `\nResume Content: ${resumeText}` : '',
      prefParts.length > 0 ? `\nPreferences:\n- ${prefParts.join('\n- ')}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      const result = await callAIAgent(message, AGENT_ID, {
        session_id: sessionId,
        assets: uploadedAssetIds.length > 0 ? uploadedAssetIds : undefined,
      })

      setActiveAgentId(null)

      if (result.success) {
        const rawResult = result?.response?.result
        const parsed = parseLLMJson(rawResult)

        const managerResponse: ManagerResponse = {
          ranked_matches: Array.isArray(parsed?.ranked_matches) ? parsed.ranked_matches : [],
          total_analyzed: typeof parsed?.total_analyzed === 'number' ? parsed.total_analyzed : 0,
          average_match_score: typeof parsed?.average_match_score === 'number' ? parsed.average_match_score : 0,
          analysis_summary: parsed?.analysis_summary ?? '',
        }

        setResults(managerResponse)
        setLoadingProgress(100)
        setAppMode('results')
        setChatOpen(true)
      } else {
        setErrorMsg(result?.error ?? 'Analysis failed. Please try again.')
        setAppMode('input')
      }
    } catch {
      setActiveAgentId(null)
      setErrorMsg('An unexpected error occurred. Please try again.')
      setAppMode('input')
    }
  }, [linkedinUrl, resumeText, uploadedAssetIds, locations, experienceLevel, companySizes, industries, mustHaveKeywords, niceToHaveKeywords, sessionId])

  // Chat message handler
  const handleSendChatMessage = useCallback(
    async (message: string) => {
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      setChatMessages((prev) => [...prev, { role: 'user', content: message, timestamp: timeStr }])
      setIsChatSending(true)
      setActiveAgentId(AGENT_ID)

      try {
        const result = await callAIAgent(message, AGENT_ID, {
          session_id: sessionId,
        })

        setActiveAgentId(null)

        if (result.success) {
          const rawResult = result?.response?.result
          const parsed = parseLLMJson(rawResult)

          let responseText = ''
          if (typeof parsed === 'string') {
            responseText = parsed
          } else if (parsed?.analysis_summary) {
            responseText = parsed.analysis_summary
            if (Array.isArray(parsed?.ranked_matches) && parsed.ranked_matches.length > 0) {
              setResults({
                ranked_matches: parsed.ranked_matches,
                total_analyzed: typeof parsed?.total_analyzed === 'number' ? parsed.total_analyzed : results?.total_analyzed ?? 0,
                average_match_score: typeof parsed?.average_match_score === 'number' ? parsed.average_match_score : results?.average_match_score ?? 0,
                analysis_summary: parsed.analysis_summary ?? results?.analysis_summary ?? '',
              })
            }
          } else if (parsed?.text) {
            responseText = parsed.text
          } else if (parsed?.message) {
            responseText = parsed.message
          } else if (result?.response?.message) {
            responseText = result.response.message
          } else {
            responseText = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult ?? '')
          }

          const replyTime = new Date()
          const replyTimeStr = `${replyTime.getHours().toString().padStart(2, '0')}:${replyTime.getMinutes().toString().padStart(2, '0')}`
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', content: responseText, timestamp: replyTimeStr },
          ])
        } else {
          const replyTime = new Date()
          const replyTimeStr = `${replyTime.getHours().toString().padStart(2, '0')}:${replyTime.getMinutes().toString().padStart(2, '0')}`
          setChatMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: result?.error ?? 'Sorry, I encountered an error. Please try again.',
              timestamp: replyTimeStr,
            },
          ])
        }
      } catch {
        setActiveAgentId(null)
        const replyTime = new Date()
        const replyTimeStr = `${replyTime.getHours().toString().padStart(2, '0')}:${replyTime.getMinutes().toString().padStart(2, '0')}`
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Network error. Please try again.', timestamp: replyTimeStr },
        ])
      }
      setIsChatSending(false)
    },
    [sessionId, results]
  )

  // Reset handler
  const handleNewSearch = () => {
    setAppMode('input')
    setResults(null)
    setLinkedinUrl('')
    setResumeText('')
    setUploadedFile(null)
    setUploadedAssetIds([])
    setChatMessages([])
    setChatOpen(false)
    setErrorMsg('')
    setShowSampleData(false)
    setSessionId(crypto.randomUUID())
  }

  // Display data: either real results or sample data
  const displayData: ManagerResponse | null = showSampleData ? SAMPLE_DATA : results

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 h-12">
            <div className="flex items-center gap-2.5">
              <BiTargetLock className="h-5 w-5 text-ring" />
              <h1 className="text-sm font-bold tracking-tight">LinkedIn Job Match Optimizer</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="sample-toggle" className="text-[10px] text-muted-foreground">
                  Sample Data
                </Label>
                <Switch
                  id="sample-toggle"
                  checked={showSampleData}
                  onCheckedChange={(checked) => {
                    setShowSampleData(checked)
                    if (checked && appMode === 'input') {
                      setAppMode('results')
                    }
                    if (!checked && !results) {
                      setAppMode('input')
                    }
                  }}
                />
              </div>
              {(appMode === 'results' || showSampleData) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewSearch}
                  className="h-7 text-xs gap-1"
                >
                  <FiRefreshCw className="h-3 w-3" />
                  New Search
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Preferences */}
          <aside className="w-64 flex-shrink-0 border-r border-border overflow-y-auto p-3 hidden md:block">
            <PreferencesPanel
              locations={locations}
              setLocations={setLocations}
              experienceLevel={experienceLevel}
              setExperienceLevel={setExperienceLevel}
              mustHaveKeywords={mustHaveKeywords}
              setMustHaveKeywords={setMustHaveKeywords}
              niceToHaveKeywords={niceToHaveKeywords}
              setNiceToHaveKeywords={setNiceToHaveKeywords}
              companySizes={companySizes}
              setCompanySizes={setCompanySizes}
              industries={industries}
              setIndustries={setIndustries}
              isResultsMode={appMode === 'results' || showSampleData}
            />

            {/* Agent Info */}
            <div className="mt-4">
              <Card className="border-border bg-card">
                <CardContent className="p-3 space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Powered by
                  </Label>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-1.5 w-1.5 flex-shrink-0',
                          activeAgentId === AGENT_ID
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-muted-foreground/40'
                        )}
                      />
                      <span className="text-[10px] text-foreground font-medium truncate">
                        {AGENT_NAME}
                      </span>
                    </div>
                    {SUB_AGENTS.map((sa) => (
                      <div key={sa.id} className="flex items-start gap-2 pl-2">
                        <div
                          className={cn(
                            'h-1.5 w-1.5 mt-1 flex-shrink-0',
                            activeAgentId === sa.id
                              ? 'bg-emerald-400 animate-pulse'
                              : 'bg-muted-foreground/20'
                          )}
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground truncate">{sa.name}</p>
                          <p className="text-[9px] text-muted-foreground/60 truncate">{sa.purpose}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Center Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                {errorMsg}
                <button
                  onClick={() => setErrorMsg('')}
                  className="ml-2 text-red-300 hover:text-red-200 underline text-xs"
                >
                  Dismiss
                </button>
              </div>
            )}

            {appMode === 'input' && !showSampleData && (
              <InputSection
                linkedinUrl={linkedinUrl}
                setLinkedinUrl={setLinkedinUrl}
                resumeText={resumeText}
                setResumeText={setResumeText}
                uploadedFile={uploadedFile}
                setUploadedFile={setUploadedFile}
                uploadedAssetIds={uploadedAssetIds}
                setUploadedAssetIds={setUploadedAssetIds}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
                onUploadFile={handleUploadFile}
                onStartSearch={handleStartSearch}
                isSearching={false}
              />
            )}

            {appMode === 'loading' && (
              <LoadingState progress={loadingProgress} statusMessage={loadingStatus} />
            )}

            {(appMode === 'results' || showSampleData) && displayData && (
              <ResultsView
                rankedMatches={displayData.ranked_matches}
                totalAnalyzed={displayData.total_analyzed}
                averageMatchScore={displayData.average_match_score}
                analysisSummary={displayData.analysis_summary}
              />
            )}
          </main>

          {/* Right Panel - Chat (desktop) */}
          {(appMode === 'results' || showSampleData) && (
            <aside className="w-80 flex-shrink-0 border-l border-border hidden lg:flex flex-col">
              <ChatPanel
                isOpen={chatOpen}
                setIsOpen={setChatOpen}
                messages={chatMessages}
                onSendMessage={handleSendChatMessage}
                isSending={isChatSending}
                isResultsMode={appMode === 'results' && !showSampleData}
              />
            </aside>
          )}
        </div>

        {/* Mobile Chat Toggle */}
        {(appMode === 'results' || showSampleData) && (
          <div className="lg:hidden">
            <ChatPanel
              isOpen={chatOpen}
              setIsOpen={setChatOpen}
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              isSending={isChatSending}
              isResultsMode={appMode === 'results' && !showSampleData}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
