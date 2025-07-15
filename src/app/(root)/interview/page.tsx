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
      <h2>Interview Generation</h2>
      <Agent userName={user.name || 'User'} userId={user.id} type="generate" />
    </>
  )
}

export default page