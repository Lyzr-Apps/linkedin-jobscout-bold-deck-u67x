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
import { FiRefreshCw, FiCheck } from 'react-icons/fi'
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
      job_title: 'Associate Software Engineer',
      company_name: 'Rockwell Automation',
      location: 'Pune, Maharashtra',
      match_score: 88,
      fit_category: 'Excellent Match',
      match_reasoning: 'Strong alignment with Python and software engineering fundamentals. Entry-level role (0-1 years) matches fresher profile. Company values strong CS fundamentals and problem-solving skills which align with your academic background.',
      skill_gaps: 'Industrial automation domain knowledge. C++ experience preferred for embedded components.',
      key_matches: 'Python, SQL, software engineering fundamentals, data structures, OOP, REST APIs, agile methodology',
      posting_url: 'https://in.linkedin.com/jobs/view/associate-software-engineer-at-rockwell-automation-4376000001',
      experience_level: 'Entry',
    },
    {
      job_title: 'Software Engineer I',
      company_name: 'Wipro',
      location: 'Pune, Maharashtra',
      match_score: 82,
      fit_category: 'Excellent Match',
      match_reasoning: 'SE-I role designed for freshers with 0-1 years experience. Python and SQL requirements directly match your skill set. Large-scale enterprise projects provide good learning exposure.',
      skill_gaps: 'Enterprise Java frameworks (Spring Boot). Specific domain knowledge depends on project allocation.',
      key_matches: 'Python, SQL, software engineering, problem-solving, data structures, algorithms, unit testing',
      posting_url: 'https://in.linkedin.com/jobs/view/software-engineer-i-at-wipro-4376000002',
      experience_level: 'Entry',
    },
    {
      job_title: 'Python Backend Developer - Junior',
      company_name: 'Teamnest Employee Services',
      location: 'Mumbai, Maharashtra',
      match_score: 85,
      fit_category: 'Excellent Match',
      match_reasoning: 'Python/Django full stack role at an HR tech startup. Direct match for Python backend skills. Startup environment provides broad exposure. Resume shows relevant Python project experience.',
      skill_gaps: 'Django framework specifics. HR tech domain understanding. Frontend React/Angular experience would be a plus.',
      key_matches: 'Python, Django, REST APIs, SQL, PostgreSQL, backend development, API design',
      posting_url: 'https://in.linkedin.com/jobs/view/python-django-developer-at-teamnest-4370640361',
      experience_level: 'Entry',
    },
    {
      job_title: 'Associate Software Engineer, Onboarding',
      company_name: 'FlexTrade Systems',
      location: 'Pune, Maharashtra',
      match_score: 74,
      fit_category: 'Good Match',
      match_reasoning: 'Associate-level role in fintech. Python and SQL skills align well. Onboarding team role provides structured learning. FlexTrade is a recognized name in financial technology.',
      skill_gaps: 'Financial markets domain knowledge. Java/Scala for some trading system components. Real-time data processing experience.',
      key_matches: 'Python, SQL, software engineering, problem-solving, testing, debugging, version control (Git)',
      posting_url: 'https://in.linkedin.com/jobs/view/associate-software-engineer-at-flextrade-4376000004',
      experience_level: 'Entry',
    },
    {
      job_title: 'Python ML Engineer',
      company_name: 'Infosys',
      location: 'Bengaluru, Karnataka',
      match_score: 79,
      fit_category: 'Good Match',
      match_reasoning: 'ML Engineer role using Python at a major IT services company. Your ML coursework and Python proficiency match the requirements. Infosys offers structured training programs for freshers.',
      skill_gaps: 'Production ML deployment experience (MLflow, Kubeflow). Deep learning frameworks at scale. Cloud ML services (AWS SageMaker, Azure ML).',
      key_matches: 'Python, machine learning fundamentals, scikit-learn, pandas, NumPy, SQL, data analysis',
      posting_url: 'https://in.linkedin.com/jobs/view/python-ml-engineer-at-infosys-4376000005',
      experience_level: 'Entry',
    },
    {
      job_title: 'Backend Developer',
      company_name: 'FactWise',
      location: 'Mumbai, Maharashtra',
      match_score: 77,
      fit_category: 'Good Match',
      match_reasoning: 'Backend role at a B2B procurement startup. Python and API development skills match. Startup environment with hands-on work from day one. Active hiring indicates immediate openings.',
      skill_gaps: 'B2B procurement domain. Microservices architecture experience. Docker/Kubernetes for deployment.',
      key_matches: 'Python, REST APIs, SQL, backend development, database design, Git, problem-solving',
      posting_url: 'https://in.linkedin.com/jobs/view/backend-developer-at-factwise-4372275660',
      experience_level: 'Entry',
    },
    {
      job_title: 'Software Developer',
      company_name: 'IBM',
      location: 'Pune, Maharashtra',
      match_score: 80,
      fit_category: 'Excellent Match',
      match_reasoning: 'Entry-level developer role at IBM. Strong alignment with Python and software engineering fundamentals. IBM provides excellent training infrastructure and career growth path for freshers.',
      skill_gaps: 'IBM Cloud platform specifics. Enterprise software development practices at scale. Java may be required for some teams.',
      key_matches: 'Python, SQL, software engineering, algorithms, cloud computing basics, agile, collaborative development',
      posting_url: 'https://in.linkedin.com/jobs/view/software-developer-at-ibm-pune-4376000007',
      experience_level: 'Entry',
    },
    {
      job_title: 'Python GenAI Developer',
      company_name: 'Infosys',
      location: 'Bengaluru, Karnataka',
      match_score: 72,
      fit_category: 'Good Match',
      match_reasoning: 'Generative AI developer position. Your Python skills and ML exposure are relevant. Cutting-edge domain with LLMs and prompt engineering. Infosys training bridges remaining gaps.',
      skill_gaps: 'LLM fine-tuning experience. Prompt engineering. RAG architectures. LangChain/LlamaIndex frameworks.',
      key_matches: 'Python, ML fundamentals, NLP basics, API development, data processing, analytical thinking',
      posting_url: 'https://in.linkedin.com/jobs/view/python-genai-developer-at-infosys-4376000008',
      experience_level: 'Entry',
    },
    {
      job_title: 'Associate System Engineer',
      company_name: 'IBM',
      location: 'Mumbai, Maharashtra',
      match_score: 71,
      fit_category: 'Good Match',
      match_reasoning: 'Systems engineering role blending software and infrastructure. Good fit for broad engineering fundamentals. IBM Mumbai location matches preference. Role involves scripting and automation.',
      skill_gaps: 'Systems administration. Linux server management. Networking fundamentals. Shell scripting.',
      key_matches: 'Python scripting, SQL, problem-solving, analytical skills, documentation, teamwork',
      posting_url: 'https://in.linkedin.com/jobs/view/associate-system-engineer-at-ibm-4352504741',
      experience_level: 'Entry',
    },
    {
      job_title: 'Full Stack Developer (React + FastAPI)',
      company_name: 'Volga Infotech',
      location: 'Mumbai, Maharashtra',
      match_score: 68,
      fit_category: 'Good Match',
      match_reasoning: 'Full stack role using Python FastAPI backend. Your Python backend skills match well. FastAPI is a modern Python framework that aligns with your Python proficiency. Mumbai location matches preference.',
      skill_gaps: 'React frontend proficiency. FastAPI framework specifics. Full stack deployment (Docker, CI/CD).',
      key_matches: 'Python, REST APIs, SQL, backend development, problem-solving, Git',
      posting_url: 'https://in.linkedin.com/jobs/view/full-stack-developer-at-volga-infotech-4375243833',
      experience_level: 'Entry',
    },
    {
      job_title: 'Trainee Engineer',
      company_name: 'Ascentt',
      location: 'Pune, Maharashtra',
      match_score: 65,
      fit_category: 'Good Match',
      match_reasoning: 'Trainee position specifically for fresh graduates. Low barrier to entry with on-the-job training. Pune location matches preference. Good starting point for building industry experience.',
      skill_gaps: 'Specific technology stack to be determined. Industry project experience. Client-facing communication skills.',
      key_matches: 'Programming fundamentals, Python, SQL, eagerness to learn, academic project experience',
      posting_url: 'https://in.linkedin.com/jobs/view/trainee-engineer-at-ascentt-4376000011',
      experience_level: 'Entry',
    },
    {
      job_title: 'Python Backend Engineer, Associate',
      company_name: 'BlackRock',
      location: 'Gurgaon, Haryana',
      match_score: 76,
      fit_category: 'Good Match',
      match_reasoning: 'Associate-level Python backend role at the world largest asset manager. Top global financial firm with excellent compensation. Python and SQL skills directly relevant. Strong brand value on resume.',
      skill_gaps: 'Financial services domain. Distributed systems. Advanced Python patterns. Cloud infrastructure (Azure).',
      key_matches: 'Python, SQL, backend development, REST APIs, data structures, algorithms, problem-solving',
      posting_url: 'https://in.linkedin.com/jobs/view/python-backend-engineer-associate-at-blackrock-4376000012',
      experience_level: 'Entry',
    },
  ],
  total_analyzed: 47,
  average_match_score: 76,
  analysis_summary: 'Out of **47 jobs** extracted from your LinkedIn search, **12 top matches** were identified and ranked against your resume.\n\n**Key findings:**\n- Your strongest matches are in **Python backend development** and **Associate Software Engineer** roles in Mumbai and Pune\n- **3 roles scored 80+** (Excellent Match): Rockwell Automation, Wipro SE-I, and Teamnest Python Developer\n- **ML/AI roles** at Infosys (Bengaluru) show good match on fundamentals but gaps in production ML deployment\n- **BlackRock** (Gurgaon) is a notable exception worth considering despite location -- top global firm with Python backend focus\n\n**Recommendations:**\n- Apply immediately to the top 3 Excellent Match roles in Pune/Mumbai\n- Upskill in Django/FastAPI frameworks to strengthen backend applications\n- Build a portfolio project demonstrating ML deployment to improve AI/ML role matches',
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
  const phase1Done = progress > 45
  const phase2Done = progress > 85

  return (
    <div className="max-w-lg mx-auto py-12 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="h-12 w-12 border-2 border-ring border-t-transparent animate-spin mx-auto" />
        <h3 className="text-base font-medium text-foreground">Analyzing Jobs Against Your Resume</h3>
        <p className="text-sm text-muted-foreground">{statusMessage}</p>
      </div>

      <Progress value={progress} className="h-1.5" />

      {/* Two-Phase Workflow */}
      <div className="space-y-4">
        {/* Phase 1: Job Extraction */}
        <Card className={cn('border-border bg-card transition-colors', !phase1Done && progress > 0 && 'border-ring/50')}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                'h-8 w-8 flex items-center justify-center border text-xs font-bold flex-shrink-0',
                phase1Done ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : progress > 0 ? 'bg-ring/20 text-ring border-ring/30 animate-pulse' : 'bg-muted text-muted-foreground border-border'
              )}>
                {phase1Done ? <FiCheck className="h-4 w-4" /> : '1'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={cn('text-sm font-medium', phase1Done ? 'text-emerald-400' : 'text-foreground')}>
                  Phase 1: Extract Job Listings
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Job Extractor Agent scrapes the LinkedIn URL and extracts structured data from each posting
                </p>
                {!phase1Done && progress > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {[
                      { label: 'Navigating LinkedIn search results...', t: 10 },
                      { label: 'Extracting job descriptions...', t: 25 },
                      { label: 'Parsing experience requirements...', t: 35 },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px]">
                        <div className={cn('h-1.5 w-1.5', progress > s.t ? 'bg-emerald-400' : progress > s.t - 10 ? 'bg-ring animate-pulse' : 'bg-muted')} />
                        <span className={cn(progress > s.t ? 'text-emerald-400' : 'text-muted-foreground')}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 2: Resume Matching */}
        <Card className={cn('border-border bg-card transition-colors', phase1Done && !phase2Done && 'border-ring/50')}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                'h-8 w-8 flex items-center justify-center border text-xs font-bold flex-shrink-0',
                phase2Done ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : phase1Done ? 'bg-ring/20 text-ring border-ring/30 animate-pulse' : 'bg-muted text-muted-foreground border-border'
              )}>
                {phase2Done ? <FiCheck className="h-4 w-4" /> : '2'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={cn('text-sm font-medium', phase2Done ? 'text-emerald-400' : phase1Done ? 'text-foreground' : 'text-muted-foreground')}>
                  Phase 2: Match Against Resume
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Resume Match Analyst scores each job description against your skills, experience, and preferences
                </p>
                {phase1Done && !phase2Done && (
                  <div className="mt-2 space-y-1.5">
                    {[
                      { label: 'Analyzing skill alignment...', t: 55 },
                      { label: 'Scoring experience match...', t: 65 },
                      { label: 'Identifying skill gaps...', t: 75 },
                      { label: 'Ranking by overall fit...', t: 82 },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px]">
                        <div className={cn('h-1.5 w-1.5', progress > s.t ? 'bg-emerald-400' : progress > s.t - 10 ? 'bg-ring animate-pulse' : 'bg-muted')} />
                        <span className={cn(progress > s.t ? 'text-emerald-400' : 'text-muted-foreground')}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Step */}
        <div className="flex items-center gap-2 px-4 text-xs">
          <div className={cn('h-2 w-2', phase2Done ? 'bg-emerald-400' : 'bg-muted')} />
          <span className={cn(phase2Done ? 'text-emerald-400 font-medium' : 'text-muted-foreground')}>
            Generating tabular comparison and ranked results...
          </span>
        </div>
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
