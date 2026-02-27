'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import {
  FiExternalLink,
  FiChevronDown,
  FiBriefcase,
  FiMapPin,
  FiFilter,
  FiStar,
  FiGrid,
  FiList,
  FiChevronUp,
  FiArrowUp,
  FiArrowDown,
  FiAlertTriangle,
  FiCheckCircle,
  FiTarget,
} from 'react-icons/fi'

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

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function getScoreBgColor(score: number) {
  if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (score >= 50) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

function getFitBgColor(category: string) {
  const cat = (category ?? '').toLowerCase()
  if (cat.includes('excellent')) return 'bg-emerald-500/15 text-emerald-400'
  if (cat.includes('good')) return 'bg-blue-500/15 text-blue-400'
  if (cat.includes('partial')) return 'bg-amber-500/15 text-amber-400'
  if (cat.includes('low')) return 'bg-red-500/15 text-red-400'
  return 'bg-muted text-muted-foreground'
}

function ScoreBadge({ score }: { score: number }) {
  const safeScore = typeof score === 'number' ? score : 0
  return (
    <div className={cn('flex items-center justify-center h-12 w-12 border text-sm font-bold flex-shrink-0', getScoreBgColor(safeScore))}>
      {safeScore}
    </div>
  )
}

function FitBadge({ category }: { category: string }) {
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border-none', getFitBgColor(category))}>
      {category || 'Unknown'}
    </Badge>
  )
}

function ScoreBar({ score }: { score: number }) {
  const safeScore = typeof score === 'number' ? Math.min(100, Math.max(0, score)) : 0
  let barColor = 'bg-red-400'
  if (safeScore >= 80) barColor = 'bg-emerald-400'
  else if (safeScore >= 50) barColor = 'bg-amber-400'
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-muted overflow-hidden">
        <div className={cn('h-full transition-all', barColor)} style={{ width: `${safeScore}%` }} />
      </div>
      <span className={cn('text-xs font-bold w-8 text-right', getScoreColor(safeScore))}>{safeScore}</span>
    </div>
  )
}

// ---- Card View ----
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

// ---- Table Row Expanded Detail ----
function TableRowDetail({ job }: { job: JobMatch }) {
  return (
    <tr className="bg-popover">
      <td colSpan={7} className="p-0">
        <div className="px-4 py-3 space-y-3 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <FiTarget className="h-3 w-3 text-blue-400" />
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Match Reasoning</Label>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{job?.match_reasoning || 'No reasoning provided'}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="h-3 w-3 text-emerald-400" />
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Key Matches</Label>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{job?.key_matches || 'None listed'}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <FiAlertTriangle className="h-3 w-3 text-amber-400" />
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Skill Gaps</Label>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{job?.skill_gaps || 'No gaps identified'}</p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ---- Table View ----
type TableSortKey = 'score' | 'job_title' | 'company_name' | 'location' | 'fit_category' | 'experience_level'

function ComparisonTable({ matches }: { matches: JobMatch[] }) {
  const [sortKey, setSortKey] = useState<TableSortKey>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const handleSort = (key: TableSortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'score' ? 'desc' : 'asc')
    }
  }

  const sortedMatches = useMemo(() => {
    const arr = [...matches]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'score':
          cmp = (a?.match_score ?? 0) - (b?.match_score ?? 0)
          break
        case 'job_title':
          cmp = (a?.job_title ?? '').localeCompare(b?.job_title ?? '')
          break
        case 'company_name':
          cmp = (a?.company_name ?? '').localeCompare(b?.company_name ?? '')
          break
        case 'location':
          cmp = (a?.location ?? '').localeCompare(b?.location ?? '')
          break
        case 'fit_category':
          cmp = (a?.fit_category ?? '').localeCompare(b?.fit_category ?? '')
          break
        case 'experience_level':
          cmp = (a?.experience_level ?? '').localeCompare(b?.experience_level ?? '')
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [matches, sortKey, sortDir])

  const SortHeader = ({ label, colKey }: { label: string; colKey: TableSortKey }) => (
    <th
      className="text-left px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none whitespace-nowrap"
      onClick={() => handleSort(colKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === colKey ? (
          sortDir === 'asc' ? (
            <FiArrowUp className="h-3 w-3 text-ring" />
          ) : (
            <FiArrowDown className="h-3 w-3 text-ring" />
          )
        ) : (
          <FiChevronDown className="h-2.5 w-2.5 opacity-30" />
        )}
      </div>
    </th>
  )

  return (
    <div className="border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-card border-b border-border">
          <tr>
            <th className="w-8 px-2 py-2.5" />
            <SortHeader label="Score" colKey="score" />
            <SortHeader label="Job Title" colKey="job_title" />
            <SortHeader label="Company" colKey="company_name" />
            <SortHeader label="Location" colKey="location" />
            <SortHeader label="Fit" colKey="fit_category" />
            <SortHeader label="Level" colKey="experience_level" />
          </tr>
        </thead>
        <tbody>
          {sortedMatches.map((job, idx) => {
            const isExp = expandedRow === idx
            return (
              <React.Fragment key={`${job?.company_name ?? ''}-${job?.job_title ?? ''}-${idx}`}>
                <tr
                  className={cn(
                    'border-b border-border/50 cursor-pointer transition-colors',
                    isExp ? 'bg-popover' : 'hover:bg-accent/30'
                  )}
                  onClick={() => setExpandedRow(isExp ? null : idx)}
                >
                  <td className="px-2 py-2.5">
                    <FiChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-muted-foreground transition-transform',
                        isExp && 'rotate-180'
                      )}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="w-24">
                      <ScoreBar score={job?.match_score ?? 0} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
                        {job?.job_title ?? 'Untitled'}
                      </span>
                      {job?.posting_url && (
                        <a
                          href={job.posting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 text-blue-400 hover:text-blue-300"
                        >
                          <FiExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-muted-foreground truncate block max-w-[140px]">
                      {job?.company_name ?? '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-muted-foreground truncate block max-w-[140px]">
                      {job?.location ?? '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] px-1.5 py-0 border-none whitespace-nowrap', getFitBgColor(job?.fit_category ?? ''))}
                    >
                      {job?.fit_category || '-'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">{job?.experience_level || '-'}</span>
                  </td>
                </tr>
                {isExp && <TableRowDetail job={job} />}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---- Main ResultsView ----
export default function ResultsView({
  rankedMatches,
  totalAnalyzed,
  averageMatchScore,
  analysisSummary,
}: ResultsViewProps) {
  const [sortBy, setSortBy] = useState<'score' | 'company' | 'location'>('score')
  const [scoreThreshold, setScoreThreshold] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const safeMatches = Array.isArray(rankedMatches) ? rankedMatches : []

  const filteredMatches = useMemo(() => {
    let matches = safeMatches.filter(
      (m) => (typeof m?.match_score === 'number' ? m.match_score : 0) >= scoreThreshold
    )
    if (sortBy === 'score') {
      matches = [...matches].sort((a, b) => (b?.match_score ?? 0) - (a?.match_score ?? 0))
    } else if (sortBy === 'company') {
      matches = [...matches].sort((a, b) => (a?.company_name ?? '').localeCompare(b?.company_name ?? ''))
    } else if (sortBy === 'location') {
      matches = [...matches].sort((a, b) => (a?.location ?? '').localeCompare(b?.location ?? ''))
    }
    return matches
  }, [safeMatches, sortBy, scoreThreshold])

  const safeAvg = typeof averageMatchScore === 'number' ? averageMatchScore : 0

  // Score distribution counts
  const excellentCount = safeMatches.filter((m) => (m?.match_score ?? 0) >= 80).length
  const goodCount = safeMatches.filter((m) => (m?.match_score ?? 0) >= 50 && (m?.match_score ?? 0) < 80).length
  const lowCount = safeMatches.filter((m) => (m?.match_score ?? 0) < 50).length

  return (
    <div className="space-y-4">
      {/* Phase Indicators */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 bg-emerald-400" />
          <span className="text-emerald-400 font-medium">Phase 1: Jobs Extracted</span>
        </div>
        <div className="h-px w-4 bg-emerald-400" />
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 bg-emerald-400" />
          <span className="text-emerald-400 font-medium">Phase 2: Resume Matched</span>
        </div>
        <div className="h-px w-4 bg-emerald-400" />
        <div className="flex items-center gap-1.5">
          <FiCheckCircle className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400 font-medium">Complete</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{totalAnalyzed ?? 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Jobs Analyzed</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <p className={cn('text-2xl font-bold', getScoreColor(safeAvg))}>{Math.round(safeAvg)}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Match</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{excellentCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Excellent (80+)</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{goodCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Good (50-79)</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{filteredMatches.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Showing</p>
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

      {/* Toolbar: View Toggle + Sort + Filter */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border border-border">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-7 text-xs gap-1 px-2.5"
            >
              <FiGrid className="h-3 w-3" />
              Table
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-7 text-xs gap-1 px-2.5"
            >
              <FiList className="h-3 w-3" />
              Cards
            </Button>
          </div>

          {/* Sort (only in card view) */}
          {viewMode === 'cards' && (
            <div className="flex items-center gap-1.5 ml-2">
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
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="h-7 text-xs gap-1"
        >
          <FiFilter className="h-3 w-3" />
          Filter {scoreThreshold > 0 && `(${scoreThreshold}%+)`}
        </Button>
      </div>

      {/* Filter Slider */}
      {showFilters && (
        <Card className="border-border bg-card">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Minimum Score: {scoreThreshold}%
              </Label>
              {scoreThreshold > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setScoreThreshold(0)} className="h-6 text-[10px] px-2">
                  Reset
                </Button>
              )}
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

      {/* Results Display */}
      {filteredMatches.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <FiStar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No matches found above the {scoreThreshold}% threshold. Try lowering the filter.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <ComparisonTable matches={filteredMatches} />
      ) : (
        <div className="space-y-2">
          {filteredMatches.map((job, idx) => (
            <JobCard key={`${job?.company_name ?? ''}-${job?.job_title ?? ''}-${idx}`} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
