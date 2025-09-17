import React from 'react'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewsByUserId, getLatestInterviews } from "@/lib/actions/auth.action";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";
import { redirect } from "next/navigation";

const DashboardPage = async () => {
	const user = await getCurrentUser();
	if (!user) {
		redirect('/sign-in');
	}

	const [userInterviews, latestInterviews] = await Promise.all([
		getInterviewsByUserId(user.id),
		getLatestInterviews({ userId: user.id }),
	]);

	const userInterviewsWithFeedback: InterviewCardProps[] = await Promise.all(
		(userInterviews || []).map(async (interview) => {
			const feedback = await getFeedbackByInterviewId({
				interviewId: interview.id,
				userId: user.id,
			});
			return { ...interview, feedback };
		})
	);

	const latestInterviewsWithFeedback: InterviewCardProps[] = await Promise.all(
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
				<div className="flex flex-col gap-3 max-w-xl max-sm:text-center">
					<h2>Kick off your next mock interview</h2>
					<p className="text-light-100">Choose your role and start practicing with instant feedback.</p>
				</div>
				<Button asChild className="btn-primary max-sm:w-full">
					<Link href="/interview">Start an Interview</Link>
				</Button>
			</section>

			<section className="flex flex-col gap-6 mt-8">
				<h2>Your Interviews</h2>
				<div className="interviews-section">
					{hasPastInterviews ? (
						userInterviewsWithFeedback?.map((interview) => (
							<InterviewCard {...interview} key={interview.id} />
						))
					) : (
						<p>You haven&apos;t taken any interviews yet</p>
					)}
				</div>
			</section>

			<section className="flex flex-col gap-6 mt-8">
				<h2>Take an Interview</h2>
				<div className="interviews-section">
					{hasUpcomingInterviews ? (
						latestInterviewsWithFeedback?.map((interview) => (
							<InterviewCard {...interview} key={interview.id} />
						))
					) : (
						<p>There are no new interviews available</p>
					)}
				</div>
			</section>
		</>
	)
}

export default DashboardPage


