import Image from "next/image";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getRandomInterviewCover } from "@/lib/utils";
import DisplayTechIcons from "@/components/DisplayTechIcons";

const FeedbackPage = async ({ params }: RouteParams) => {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [interview, feedback] = await Promise.all([
    getInterviewById(id),
    getFeedbackByInterviewId({
      interviewId: id,
      userId: user.id,
    })
  ]);

  if (!interview) redirect("/");
  if (!feedback) redirect(`/interview/${id}`);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-row gap-4 justify-between items-start mb-8">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h1 className="text-2xl font-bold capitalize">{interview.role} Interview Feedback</h1>
          </div>
          <DisplayTechIcons techStack={interview.techstack} />
        </div>
        <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit">
          {interview.type}
        </p>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Overall Score</h2>
            <p className="text-gray-600 dark:text-gray-300">Your performance evaluation</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {feedback.totalScore}/100
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Image src="/star.svg" alt="star" width={20} height={20} />
              <span className="text-sm text-gray-500">Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {feedback.categoryScores.map((category, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">{category.name}</h3>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {category.score}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${category.score}%` }}
              ></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {category.comment}
            </p>
          </div>
        ))}
      </div>

      {/* Strengths and Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Strengths */}
        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-6">
          <h3 className="font-semibold text-lg text-green-800 dark:text-green-200 mb-4">
            💪 Strengths
          </h3>
          {feedback.strengths && feedback.strengths.length > 0 ? (
            <ul className="space-y-2">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                  <span className="text-green-700 dark:text-green-300">{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-green-600 dark:text-green-400 italic">
              No specific strengths identified. This may indicate an issue with feedback generation.
            </p>
          )}
        </div>

        {/* Areas for Improvement */}
        <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-6">
          <h3 className="font-semibold text-lg text-orange-800 dark:text-orange-200 mb-4">
            🎯 Areas for Improvement
          </h3>
          {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 ? (
            <ul className="space-y-2">
              {feedback.areasForImprovement.map((area, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-600 dark:text-orange-400 mt-1">→</span>
                  <span className="text-orange-700 dark:text-orange-300">{area}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-orange-600 dark:text-orange-400 italic">
              No specific areas for improvement identified. This may indicate an issue with feedback generation.
            </p>
          )}
        </div>
      </div>

      {/* Final Assessment */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">📝 Final Assessment</h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {feedback.finalAssessment}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button asChild variant="outline">
          <Link href={`/interview/${id}`}>
            Retake Interview
          </Link>
        </Button>
        <Button asChild className="btn-primary">
          <Link href="/interview">
            New Interview
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default FeedbackPage;