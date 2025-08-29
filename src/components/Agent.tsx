"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "../../constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface VapiError {
  type?: string;
  error?: {
    status?: number;
  };
  message?: string;
  code?: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Agent initialized:', { type, userName, userId });
    
    // Debug environment variables for generate type
    if (type === 'generate') {
      console.log('Environment variables for generation:', {
        hasPublicKey: !!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
        hasWorkflowId: !!process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID,
        publicKeyPrefix: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.substring(0, 8),
        workflowIdPrefix: process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID?.substring(0, 8)
      });
    }

    const onCallStart = () => {
      console.log('Call started');
      setCallStatus(CallStatus.ACTIVE);
      setError(null);
    };

    const onCallEnd = () => {
      console.log('Call ended');
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (...args: unknown[]) => {
      const message = args[0] as Message;
      if (message && message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { 
          role: message.role as "user" | "system" | "assistant", 
          content: message.transcript 
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onError = (...args: unknown[]) => {
      const error = args[0];
      console.error("VAPI Error:", error);
      
      let errorMessage = 'Call failed. Please try again.';
      
      if (error && typeof error === 'object') {
        const vapiError = error as VapiError;
        
        // Handle VAPI specific error types
        if (vapiError.type === 'start-method-error') {
          if (vapiError.error?.status === 400) {
            errorMessage = 'Interview generation is currently unavailable. The workflow configuration may need to be updated.';
          } else {
            errorMessage = 'Failed to start interview generation. Please contact support.';
          }
        } else if (vapiError.message) {
          errorMessage = vapiError.message;
        } else if (vapiError.code) {
          errorMessage = `Error ${vapiError.code}: ${vapiError.message || 'Unknown error'}`;
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      setCallStatus(CallStatus.INACTIVE);
    };

    // Add event listeners
    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      // Clean up event listeners
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, [userName, userId, interviewId, type, questions]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1].content;
      setLastMessage(lastMsg);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("Starting feedback generation for", messages.length, "messages");
      console.log("Message sample:", messages.slice(0, 2));

      if (!interviewId || !userId) {
        console.error('Missing required IDs for feedback generation:', { interviewId, userId });
        router.push("/");
        return;
      }

      try {
        console.log('Calling createFeedback with:', {
          interviewId,
          userId,
          transcriptLength: messages.length,
          feedbackId
        });
        
        const { success, feedbackId: id } = await createFeedback({
          interviewId,
          userId,
          transcript: messages,
          feedbackId,
        });

        if (success && id) {
          console.log('Feedback generated successfully with ID:', id);
          router.push(`/interview/${interviewId}/feedback`);
        } else {
          console.error("Error saving feedback - success:", success, "id:", id);
          setError('Failed to generate feedback');
          setTimeout(() => router.push("/"), 2000);
        }
      } catch (error) {
        console.error('Feedback generation error:', error);
        setError('Failed to generate feedback');
        setTimeout(() => router.push("/"), 2000);
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      console.log('Call finished, processing results...');
      if (type === "generate") {
        // For generate type, just redirect to home after a brief delay
        setTimeout(() => router.push("/"), 1000);
      } else if (messages.length > 0) {
        // For interview type, generate feedback
        handleGenerateFeedback(messages);
      } else {
        console.log('No messages to process, redirecting home');
        setTimeout(() => router.push("/"), 1000);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    console.log('Starting call with type:', type);
    
    setCallStatus(CallStatus.CONNECTING);
    setError(null);

    try {
      if (type === "generate") {
        const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
        const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
        
        if (!publicKey) {
          throw new Error('VAPI Public Key not configured. Please add NEXT_PUBLIC_VAPI_PUBLIC_KEY to .env.local and restart the server.');
        }
        
        if (!workflowId) {
          throw new Error('VAPI Workflow ID not configured. Please add NEXT_PUBLIC_VAPI_WORKFLOW_ID to .env.local and restart the server.');
        }
        
        console.log('Starting interview generation workflow:', {
          workflowId: workflowId.substring(0, 8) + '...',
          username: userName,
          userid: userId || 'anonymous'
        });
        
        await vapi.start(
          undefined, // assistant
          undefined, // assistantOverrides
          undefined, // squad
          workflowId, // workflow
          { // workflowOverrides
            variableValues: {
              username: userName,
              userid: userId || '',
            },
          }
        );
      } else {
        let formattedQuestions = "";
        if (questions && questions.length > 0) {
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        } else {
          formattedQuestions = "- Tell me about yourself\n- What are your strengths and weaknesses?\n- Why do you want this position?";
        }

        console.log('Starting interview call...');
        await vapi.start(
          interviewer, // assistant
          { // assistantOverrides
            variableValues: {
              questions: formattedQuestions,
            },
          }
        );
      }
    } catch (error) {
      console.error('Error starting call:', error);
      
      let errorMessage = 'Failed to start call';
      if (error instanceof Error) {
        if (error.message.includes('VAPI_NOT_CONFIGURED')) {
          errorMessage = 'VAPI not configured. Please check your environment variables and restart the server.';
        } else if (error.message.includes('VAPI_INIT_FAILED')) {
          errorMessage = 'VAPI initialization failed. Please check your API key.';
        } else if (error.message.includes('VAPI_WORKFLOW_ERROR')) {
          errorMessage = 'Interview generation is temporarily unavailable. The service is being updated.';
        } else if (error.message.includes('VAPI_START_ERROR')) {
          errorMessage = 'Unable to start interview generation. Please try again in a few moments.';
        } else if (error.message.includes('VAPI_EMPTY_ERROR')) {
          errorMessage = 'Interview generation service is currently unavailable. Please try again later.';
        } else if (error.message.includes('Workflow ID not configured')) {
          errorMessage = 'Interview generation is not configured. Please contact support.';
        } else if (error.message.includes('Public Key not configured')) {
          errorMessage = 'VAPI service is not configured. Please contact support.';
        } else {
          errorMessage = error.message || 'Unknown error occurred';
        }
      } else {
        // Handle empty error objects
        errorMessage = 'Unable to start interview generation. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    console.log('Disconnecting call');
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/xENfQsk9_400x400.jpg"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button 
            className="relative btn-call" 
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>

      {callStatus === CallStatus.FINISHED && messages.length > 0 && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <p>Interview completed! Processing feedback...</p>
        </div>
      )}
    </>
  );
};

export default Agent;