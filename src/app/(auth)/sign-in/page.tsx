import React from 'react'
import AuthForm from '../../../components/AuthForm'
import { getCurrentUser } from '@/lib/actions/auth.action'
import { redirect } from 'next/navigation'

const page = async () => {
  const user = await getCurrentUser();
  
  // Redirect authenticated users to home page
  if (user) {
    redirect('/');
  }

  return (
        <AuthForm type="sign-in"/>
  )
}

export default page