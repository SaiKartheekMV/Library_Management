'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page
    router.push('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <BookOpen className="h-16 w-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Library Management System
        </h1>
        <p className="text-gray-600 mb-4">Redirecting to login...</p>
        <Loader2 className="h-6 w-6 animate-spin text-primary-600 mx-auto" />
      </div>
    </div>
  )
}
