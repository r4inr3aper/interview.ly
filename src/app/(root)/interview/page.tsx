import Agent from '@/components/Agent'
import React from 'react'
import { getCurrentUser } from '@/lib/actions/auth.action'


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
      <div className="mb-2">
        <h2 className="text-2xl font-bold mb-2">Interview Generation</h2>
        <p className="text-gray-600">
          Generate a personalized technical interview tailored to your experience level and skills.
        </p>
      </div>
      
      <Agent userName={user.name || 'User'} userId={user.id} type="generate" />
      
    </>
  )
}

export default page