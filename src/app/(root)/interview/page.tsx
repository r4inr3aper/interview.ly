import Agent from '@/components/Agent'
import React from 'react'
import { getCurrentUser } from '@/lib/actions/auth.action'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const page = async () => {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <h2>Interview Generation</h2>
        <p>Please log in to start an interview.</p>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Interview Generation</h2>
        <p className="text-gray-600 mb-4">
          Generate a personalized technical interview tailored to your experience level and skills.
        </p>
      </div>
      
      <Agent userName={user.name || 'User'} userId={user.id} type="generate" />
      
      {/* Fallback options */}
      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Alternative Options</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          If the interview generation is not available, you can browse our pre-designed interviews:
        </p>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/">
              Browse Available Interviews
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              View Your Progress
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}

export default page