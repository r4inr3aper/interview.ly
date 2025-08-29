"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "../../../constants";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate comprehensively and provide detailed, actionable feedback.
        
        Interview Transcript:
        ${formattedTranscript}

        EVALUATION REQUIREMENTS:
        
        1. CATEGORY SCORES (0-100): Score the candidate in these exact categories:
        - **Communication Skills**: Clarity of speech, articulation, ability to express ideas coherently
        - **Technical Knowledge**: Depth of understanding, accuracy of technical explanations
        - **Problem Solving**: Logical thinking, approach to challenges, analytical skills
        - **Cultural Fit**: Professional demeanor, enthusiasm, alignment with workplace values
        - **Confidence and Clarity**: Self-assurance, clear responses, engagement level
        
        2. STRENGTHS: Identify 3-5 specific positive aspects the candidate demonstrated. Include:
        - Specific examples from their responses
        - Technical skills they showcased well
        - Communication strengths observed
        - Problem-solving approaches that worked
        - Professional qualities displayed
        
        3. AREAS FOR IMPROVEMENT: Identify 3-5 specific areas where the candidate can improve. Include:
        - Specific gaps in knowledge or skills
        - Communication issues that need attention
        - Technical concepts that need strengthening
        - Interview skills that can be enhanced
        - Concrete suggestions for improvement
        
        4. FINAL ASSESSMENT: Provide a comprehensive 2-3 sentence summary that:
        - Gives an overall impression of the candidate
        - Highlights their main strengths
        - Mentions key areas for development
        - Provides encouragement and next steps
        
        5. TOTAL SCORE: Calculate as the average of all category scores
        
        Be specific, constructive, and balanced in your feedback. Use concrete examples from the transcript where possible.
        `,
      system:
        "You are a professional interviewer with expertise in technical recruitment. Provide detailed, actionable feedback that helps candidates improve while recognizing their strengths.",
    });

    type GeneratedFeedback = {
      totalScore: number;
      categoryScores: Array<{
        name: string;
        score: number;
        comment: string;
      }>;
      strengths: string[];
      areasForImprovement: string[];
      finalAssessment: string;
    };

    const generatedFeedback = object as GeneratedFeedback;
    
    // Validate the generated feedback
    if (!generatedFeedback.strengths || generatedFeedback.strengths.length === 0) {
      console.warn('No strengths generated, adding fallback');
      generatedFeedback.strengths = ['Participated in the interview process', 'Showed willingness to engage'];
    }
    
    if (!generatedFeedback.areasForImprovement || generatedFeedback.areasForImprovement.length === 0) {
      console.warn('No areas for improvement generated, adding fallback');
      generatedFeedback.areasForImprovement = ['Continue practicing interview skills', 'Review technical concepts'];
    }
    
    if (!generatedFeedback.finalAssessment) {
      console.warn('No final assessment generated, adding fallback');
      generatedFeedback.finalAssessment = 'Thank you for participating in this interview. Continue practicing to improve your interview skills.';
    }

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: generatedFeedback.totalScore || 50,
      categoryScores: generatedFeedback.categoryScores || [],
      strengths: generatedFeedback.strengths,
      areasForImprovement: generatedFeedback.areasForImprovement,
      finalAssessment: generatedFeedback.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    // Debug logging to verify feedback generation
    console.log('Generated feedback:', {
      totalScore: feedback.totalScore,
      categoryScoresCount: feedback.categoryScores?.length || 0,
      strengthsCount: feedback.strengths?.length || 0,
      areasForImprovementCount: feedback.areasForImprovement?.length || 0,
      hasFinalAssessment: !!feedback.finalAssessment,
      strengths: feedback.strengths,
      areasForImprovement: feedback.areasForImprovement
    });

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}