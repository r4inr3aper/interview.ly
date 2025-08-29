import React from 'react'
import {Button} from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import InterviewCard from "@/components/InterviewCard";
import { getCurrentUser } from '@/lib/actions/auth.action';
import { getInterviewsByUserId, getLatestInterviews } from '@/lib/actions/auth.action';
import { getFeedbackByInterviewId } from '@/lib/actions/general.action';
import { redirect } from 'next/navigation';

const Page = async () => {
    const user = await getCurrentUser();
    
    // Redirect to sign-in if not authenticated
    if (!user) {
        redirect('/sign-in');
    }

    // Fetch user interviews and latest interviews
    const [userInterviews, latestInterviews] = await Promise.all([
        await getInterviewsByUserId(user.id),
        await getLatestInterviews({ userId: user.id })
    ]);
    
    // Fetch feedback for user interviews
    const userInterviewsWithFeedback = await Promise.all(
        (userInterviews || []).map(async (interview) => {
            const feedback = await getFeedbackByInterviewId({
                interviewId: interview.id,
                userId: user.id,
            });
            return { ...interview, feedback };
        })
    );
    
    // Fetch feedback for latest interviews
    const latestInterviewsWithFeedback = await Promise.all(
        (latestInterviews || []).map(async (interview) => {
            const feedback = await getFeedbackByInterviewId({
                interviewId: interview.id,
                userId: user.id,
            });
            return { ...interview, feedback };
        })
    );
    
    const hasPastInterviews = (userInterviewsWithFeedback?.length ?? 0) > 0;
    const hasUpcomingInterviews = (latestInterviewsWithFeedback?.length ?? 0) > 0;

    return (
        <>
            <section className="card-cta">
                <div className="flex flex-col gap-6 max-w-lg">
                    <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
                    <p className="text-lg">
                        Practice on real interview questions & get instant feedback
                    </p>
                    
                    <Button asChild className="btn-primary max-sm:w-full">
                <Link href="/interview">Start an Interview</Link>
                    </Button>
                </div>

                <Image src="/robot.png" alt="robo-dude" width={400} height={400} className="max-sm:hidden" />
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <h2>Your Interviews</h2>

                <div className="interviews-section">
                    {hasPastInterviews ? (
                        userInterviewsWithFeedback?.map((interview) => (
                            <InterviewCard {...interview} key={interview.id}/>
                        ))) : (
                            <p>You haven&apos;t taken any interviews yet</p>
                    )}
                </div>
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <h2>Take an Interview</h2>

                <div className="interviews-section">
                    {hasUpcomingInterviews ? (
                        latestInterviewsWithFeedback?.map((interview) => (
                            <InterviewCard {...interview} key={interview.id}/>
                        ))) : (
                        <p>There are no new interviews available</p>
                    )}
                </div>
            </section>
        </>
    )
}
export default Page