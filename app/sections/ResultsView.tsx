'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { FiExternalLink, FiChevronDown, FiBriefcase, FiMapPin, FiFilter, FiStar } from 'react-icons/fi'

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

interface ResultsViewProps {
  rankedMatches: JobMatch[]
  totalAnalyzed: number
  averageMatchScore: number
  analysisSummary: string
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-2 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-2 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-3 mb-1">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm text-muted-foreground">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm text-muted-foreground">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm text-muted-foreground">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function ScoreBadge({ score }: { score: number }) {
  const safeScore = typeof score === 'number' ? score : 0
  let colorClasses = 'bg-red-500/20 text-red-400 border-red-500/30'
  if (safeScore >= 80) {
    colorClasses = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  } else if (safeScore >= 50) {
    colorClasses = 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }

  return (
    <div className={cn('flex items-center justify-center h-12 w-12 border text-sm font-bold flex-shrink-0', colorClasses)}>
      {safeScore}
    </div>
  )
}

function FitBadge({ category }: { category: string }) {
  const cat = (category ?? '').toLowerCase()
  let colorClasses = 'bg-muted text-muted-foreground'
  if (cat.includes('excellent')) {
    colorClasses = 'bg-emerald-500/15 text-emerald-400'
  } else if (cat.includes('good')) {
    colorClasses = 'bg-blue-500/15 text-blue-400'
  } else if (cat.includes('partial')) {
    colorClasses = 'bg-amber-500/15 text-amber-400'
  } else if (cat.includes('low')) {
    colorClasses = 'bg-red-500/15 text-red-400'
  }
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border-none', colorClasses)}>
      {category || 'Unknown'}
    </Badge>
  )
}

function JobCard({ job }: { job: JobMatch }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-border bg-card hover:border-ring/50 transition-colors">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer">
            <div className="flex gap-3">
              <ScoreBadge score={job?.match_score ?? 0} />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {job?.job_title ?? 'Untitled Position'}
                  </h3>
                  <FiChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform mt-0.5',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FiBriefcase className="h-3 w-3" />
                    {job?.company_name ?? 'Unknown Company'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiMapPin className="h-3 w-3" />
                    {job?.location ?? 'Unknown Location'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FitBadge category={job?.fit_category ?? ''} />
                  {job?.experience_level && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {job.experience_level}
                    </Badge>
                  )}
                </div>
                {/* Truncated match reasoning */}
                {job?.key_matches && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {job.key_matches}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            <Separator className="bg-border" />

            {job?.match_reasoning && (
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Match Analysis
                </Label>
                {renderMarkdown(job.match_reasoning)}
              </div>
            )}

            {job?.key_matches && (
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Key Matches
                </Label>
                {renderMarkdown(job.key_matches)}
              </div>
            )}

            {job?.skill_gaps && (
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Skill Gaps
                </Label>
                {renderMarkdown(job.skill_gaps)}
              </div>
            )}

            {job?.posting_url && (
              <a
                href={job.posting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-2"
              >
                <FiExternalLink className="h-3 w-3" />
                View on LinkedIn
              </a>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default function ResultsView({
  rankedMatches,
  totalAnalyzed,
  averageMatchScore,
  analysisSummary,
}: ResultsViewProps) {
  const [sortBy, setSortBy] = useState<'score' | 'company' | 'location'>('score')
  const [scoreThreshold, setScoreThreshold] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const safeMatches = Array.isArray(rankedMatches) ? rankedMatches : []

  const filteredMatches = useMemo(() => {
    let matches = safeMatches.filter(
      (m) => (typeof m?.match_score === 'number' ? m.match_score : 0) >= scoreThreshold
    )

    if (sortBy === 'score') {
      matches = [...matches].sort(
        (a, b) => (b?.match_score ?? 0) - (a?.match_score ?? 0)
      )
    } else if (sortBy === 'company') {
      matches = [...matches].sort((a, b) =>
        (a?.company_name ?? '').localeCompare(b?.company_name ?? '')
      )
    } else if (sortBy === 'location') {
      matches = [...matches].sort((a, b) =>
        (a?.location ?? '').localeCompare(b?.location ?? '')
      )
    }

    return matches
  }, [safeMatches, sortBy, scoreThreshold])

  const safeAvg = typeof averageMatchScore === 'number' ? averageMatchScore : 0

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{totalAnalyzed ?? 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Jobs Analyzed
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <p className={cn('text-2xl font-bold', safeAvg >= 70 ? 'text-emerald-400' : safeAvg >= 50 ? 'text-amber-400' : 'text-red-400')}>
              {Math.round(safeAvg)}%
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Avg Match
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{filteredMatches.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Showing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Summary */}
      {analysisSummary && (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Analysis Summary
            </Label>
            <div className="mt-1.5">{renderMarkdown(analysisSummary)}</div>
          </CardContent>
        </Card>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant={sortBy === 'score' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('score')}
            className="h-7 text-xs"
          >
            Score
          </Button>
          <Button
            variant={sortBy === 'company' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('company')}
            className="h-7 text-xs"
          >
            Company
          </Button>
          <Button
            variant={sortBy === 'location' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('location')}
            className="h-7 text-xs"
          >
            Location
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="h-7 text-xs gap-1"
        >
          <FiFilter className="h-3 w-3" />
          Filter
        </Button>
      </div>

      {showFilters && (
        <Card className="border-border bg-card">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Minimum Score: {scoreThreshold}%
              </Label>
            </div>
            <Slider
              value={[scoreThreshold]}
              onValueChange={(val) => setScoreThreshold(val[0] ?? 0)}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}

      {/* Job Cards */}
      <div className="space-y-2">
        {filteredMatches.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <FiStar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No matches found above the {scoreThreshold}% threshold. Try lowering the filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMatches.map((job, idx) => (
            <JobCard key={`${job?.company_name ?? ''}-${job?.job_title ?? ''}-${idx}`} job={job} />
          ))
        )}
      </div>
    </div>
  )
}
