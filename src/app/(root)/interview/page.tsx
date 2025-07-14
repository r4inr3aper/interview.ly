import Agent from '@/components/Agent'
import React from 'react'

const page = () => {
  return (
    <>
      <h2>Interview Generation</h2>
      <Agent userName="you" userId="user1" type="generate" />
    </>
  )
}

export default page