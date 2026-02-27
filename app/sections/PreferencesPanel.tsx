'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { FiX, FiChevronDown, FiMapPin, FiStar, FiPlus } from 'react-icons/fi'

interface PreferencesPanelProps {
  locations: string[]
  setLocations: React.Dispatch<React.SetStateAction<string[]>>
  experienceLevel: string
  setExperienceLevel: React.Dispatch<React.SetStateAction<string>>
  mustHaveKeywords: string[]
  setMustHaveKeywords: React.Dispatch<React.SetStateAction<string[]>>
  niceToHaveKeywords: string[]
  setNiceToHaveKeywords: React.Dispatch<React.SetStateAction<string[]>>
  companySizes: string[]
  setCompanySizes: React.Dispatch<React.SetStateAction<string[]>>
  industries: string[]
  setIndustries: React.Dispatch<React.SetStateAction<string[]>>
  isResultsMode: boolean
}

function TagInput({
  tags,
  setTags,
  placeholder,
  icon,
}: {
  tags: string[]
  setTags: React.Dispatch<React.SetStateAction<string[]>>
  placeholder: string
  icon?: React.ReactNode
}) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      if (!tags.includes(inputValue.trim())) {
        setTags((prev) => [...prev, inputValue.trim()])
      }
      setInputValue('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-8 text-sm bg-background border-border"
        />
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs px-2 py-0.5 gap-1 cursor-pointer hover:bg-destructive/20 transition-colors"
              onClick={() => removeTag(tag)}
            >
              {tag}
              <FiX className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PreferencesPanel({
  locations,
  setLocations,
  experienceLevel,
  setExperienceLevel,
  mustHaveKeywords,
  setMustHaveKeywords,
  niceToHaveKeywords,
  setNiceToHaveKeywords,
  companySizes,
  setCompanySizes,
  industries,
  setIndustries,
  isResultsMode,
}: PreferencesPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  const experienceLevels = ['Entry', 'Mid', 'Senior', 'Lead']
  const companySizeOptions = ['Startup', 'Small', 'Medium', 'Enterprise']

  const hasPreferences =
    locations.length > 0 ||
    experienceLevel !== '' ||
    mustHaveKeywords.length > 0 ||
    niceToHaveKeywords.length > 0 ||
    companySizes.length > 0 ||
    industries.length > 0

  if (isResultsMode && !isOpen) {
    return (
      <div className="w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="w-full justify-between text-muted-foreground text-xs"
        >
          <span>Preferences</span>
          <FiChevronDown className="h-3 w-3" />
        </Button>
        {hasPreferences && (
          <div className="px-2 py-1 flex flex-wrap gap-1">
            {experienceLevel && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {experienceLevel}
              </Badge>
            )}
            {locations.slice(0, 2).map((loc) => (
              <Badge key={loc} variant="outline" className="text-[10px] px-1.5 py-0">
                {loc}
              </Badge>
            ))}
            {locations.length > 2 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{locations.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="border-border bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Search Preferences</CardTitle>
              <FiChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* Location Preferences */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Locations
              </Label>
              <TagInput
                tags={locations}
                setTags={setLocations}
                placeholder="Add location..."
                icon={<FiMapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
              />
            </div>

            <Separator className="bg-border" />

            {/* Experience Level */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Experience Level
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {experienceLevels.map((level) => (
                  <Button
                    key={level}
                    variant={experienceLevel === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setExperienceLevel(experienceLevel === level ? '' : level)
                    }
                    className="h-7 text-xs"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Company Size */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Company Size
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {companySizeOptions.map((size) => (
                  <Badge
                    key={size}
                    variant={companySizes.includes(size) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs px-2 py-0.5 transition-colors"
                    onClick={() =>
                      setCompanySizes((prev) =>
                        prev.includes(size)
                          ? prev.filter((s) => s !== size)
                          : [...prev, size]
                      )
                    }
                  >
                    {size}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Industries */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Industries
              </Label>
              <TagInput
                tags={industries}
                setTags={setIndustries}
                placeholder="Add industry..."
              />
            </div>

            <Separator className="bg-border" />

            {/* Must-Have Keywords */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Must-Have Keywords
              </Label>
              <TagInput
                tags={mustHaveKeywords}
                setTags={setMustHaveKeywords}
                placeholder="Add keyword..."
                icon={<FiStar className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
              />
            </div>

            <Separator className="bg-border" />

            {/* Nice-to-Have Keywords */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Nice-to-Have Keywords
              </Label>
              <TagInput
                tags={niceToHaveKeywords}
                setTags={setNiceToHaveKeywords}
                placeholder="Add keyword..."
                icon={<FiPlus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
