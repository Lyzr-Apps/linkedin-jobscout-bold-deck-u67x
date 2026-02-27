'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { FiUpload, FiCheck, FiFile, FiX, FiSearch } from 'react-icons/fi'

interface InputSectionProps {
  linkedinUrl: string
  setLinkedinUrl: React.Dispatch<React.SetStateAction<string>>
  resumeText: string
  setResumeText: React.Dispatch<React.SetStateAction<string>>
  uploadedFile: File | null
  setUploadedFile: React.Dispatch<React.SetStateAction<File | null>>
  uploadedAssetIds: string[]
  setUploadedAssetIds: React.Dispatch<React.SetStateAction<string[]>>
  isUploading: boolean
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>
  onUploadFile: (file: File) => Promise<void>
  onStartSearch: () => void
  isSearching: boolean
}

export default function InputSection({
  linkedinUrl,
  setLinkedinUrl,
  resumeText,
  setResumeText,
  uploadedFile,
  setUploadedFile,
  uploadedAssetIds,
  setUploadedAssetIds,
  isUploading,
  setIsUploading,
  onUploadFile,
  onStartSearch,
  isSearching,
}: InputSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [urlError, setUrlError] = useState('')

  const isValidLinkedinUrl = (url: string) => {
    return url.includes('linkedin.com')
  }

  const handleUrlChange = (value: string) => {
    setLinkedinUrl(value)
    if (value && !isValidLinkedinUrl(value)) {
      setUrlError('Please enter a valid LinkedIn URL')
    } else {
      setUrlError('')
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) {
        const ext = file.name.toLowerCase()
        if (ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.doc') || ext.endsWith('.txt')) {
          setUploadedFile(file)
          onUploadFile(file)
        }
      }
    },
    [onUploadFile, setUploadedFile]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      onUploadFile(file)
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setUploadedAssetIds([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const hasResume = uploadedAssetIds.length > 0 || resumeText.trim().length > 0
  const hasUrl = linkedinUrl.trim().length > 0 && isValidLinkedinUrl(linkedinUrl)
  const canSearch = hasResume && hasUrl && !isSearching

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Onboarding Text */}
      <div className="text-center space-y-2 py-4">
        <h2 className="text-xl font-bold text-foreground">Find Your Perfect Job Match</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Upload your resume, paste a LinkedIn job search URL, and let our AI analyze how well each job matches your skills, experience, and preferences.
        </p>
        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-5 w-5 border border-border flex items-center justify-center text-[10px] font-bold">1</div>
            <span>Upload Resume</span>
          </div>
          <div className="h-px w-6 bg-border" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-5 w-5 border border-border flex items-center justify-center text-[10px] font-bold">2</div>
            <span>Add LinkedIn URL</span>
          </div>
          <div className="h-px w-6 bg-border" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-5 w-5 border border-border flex items-center justify-center text-[10px] font-bold">3</div>
            <span>Get Matches</span>
          </div>
        </div>
      </div>

      {/* Resume Upload */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Resume
          </Label>

          {/* Drag-drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border border-dashed border-border p-6 text-center cursor-pointer transition-colors',
              isDragOver && 'border-ring bg-accent/50',
              uploadedFile && !isUploading && 'border-emerald-500/50 bg-emerald-500/5'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-2 border-ring border-t-transparent animate-spin" />
                <p className="text-xs text-muted-foreground">Uploading...</p>
              </div>
            ) : uploadedFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <FiCheck className="h-5 w-5 text-emerald-400" />
                  <FiFile className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{uploadedFile.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      clearFile()
                    }}
                    className="p-0.5 hover:bg-destructive/20 transition-colors"
                  >
                    <FiX className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-[10px] text-emerald-400">File uploaded successfully</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FiUpload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop your resume here, or click to browse
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Supports PDF, DOCX, DOC, TXT
                </p>
              </div>
            )}
          </div>

          <Separator className="bg-border" />

          {/* Or paste resume text */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">
              Or paste your resume text
            </Label>
            <Textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content here..."
              className="min-h-[100px] text-sm bg-background border-border resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn URL Input */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            LinkedIn Job Search URL
          </Label>
          <div className="space-y-1">
            <Input
              value={linkedinUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://www.linkedin.com/jobs/search/?keywords=..."
              className="h-9 text-sm bg-background border-border"
            />
            {urlError && (
              <p className="text-[10px] text-red-400">{urlError}</p>
            )}
            <p className="text-[10px] text-muted-foreground">
              Go to LinkedIn Jobs, apply your filters, and copy the URL from your browser
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA Button */}
      <Button
        onClick={onStartSearch}
        disabled={!canSearch}
        className="w-full h-11 text-sm font-medium gap-2"
        size="lg"
      >
        {isSearching ? (
          <>
            <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <FiSearch className="h-4 w-4" />
            Find My Matches
          </>
        )}
      </Button>
    </div>
  )
}
