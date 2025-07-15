"use client";
import Image from "next/image";
import {cn} from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { vapiConnectionManager } from "@/lib/vapi-utils";
import { useRouter } from "next/navigation";
import { useEffect, useState} from "react";

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
}

interface SavedMessage {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

const Agent = ({ userName, userId }: Omit<AgentProps, 'type'>) => {
    const router = useRouter();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [callEndReason, setCallEndReason] = useState<string>('');

useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
        const onCallEnd = (reason?: unknown) => {
            console.log('Call ended', reason ? `with reason: ${JSON.stringify(reason)}` : '');

            // Always set status to finished regardless of reason
            setCallStatus(CallStatus.FINISHED);

            // If there's a reason that includes ejection, log it but don't treat as error
            if (reason) {
                const reasonStr = typeof reason === 'string' ? reason : JSON.stringify(reason);
                if (reasonStr.includes('ejection') || reasonStr.includes('Meeting has ended')) {
                    console.log('Call ended normally with ejection reason - this is expected behavior');
                    setCallEndReason('The interview has ended. Thank you for participating!');
                } else {
                    setCallEndReason(reasonStr);
                }
            } else {
                setCallEndReason('The interview has ended. Thank you for participating!');
            }
        };

        const onMessage = (message: unknown) => {
            console.log('Received message:', message);

            // Handle meeting ejection messages
            if (message && typeof message === 'object' && 'type' in message) {
                if (message.type === 'error' && 'error' in message) {
                    const errorMsg = message.error as string;
                    if (errorMsg.includes('ejection') || errorMsg.includes('Meeting has ended')) {
                        console.log('Meeting ejection message received - ending call gracefully');
                        setCallStatus(CallStatus.FINISHED);
                        setCallEndReason('The interview has ended. Thank you for participating!');
                        return;
                    }
                }

                // Handle call-end messages
                if (message.type === 'call-end') {
                    console.log('Call-end message received');
                    setCallStatus(CallStatus.FINISHED);
                    setCallEndReason('The interview has ended. Thank you for participating!');
                    return;
                }

                // Handle transcript messages
                if (message.type === 'transcript' && 'transcriptType' in message &&
                   message.transcriptType === 'final' && 'role' in message && 'transcript' in message) {
                    const newMessage = {
                        role: message.role as 'user' | 'system' | 'assistant',
                        content: message.transcript as string
                    }

                    setMessages((prev) => [...prev, newMessage]);
                }
            }
        }

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);

        const onError = (error: unknown) => {
            console.log('VAPI Error received:', error);

            // Handle the case where error might be undefined or not a proper Error object
            if (!error) {
                console.log('Received undefined error, likely call ended normally');
                setCallStatus(CallStatus.FINISHED);
                return;
            }

            // Convert error to string for checking
            const errorString = typeof error === 'string' ? error :
                               (error instanceof Error ? error.message : null) ||
                               (error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : null) ||
                               JSON.stringify(error) ||
                               String(error);

            console.log('Error string:', errorString);

            // Handle specific ejection errors
            if (errorString.includes('ejection') ||
                errorString.includes('Meeting has ended') ||
                errorString.includes('Meeting ended due to ejection')) {
                console.log('Meeting ejection detected - ending call gracefully');
                setCallStatus(CallStatus.FINISHED);
                setCallEndReason('The interview has ended. Thank you for participating!');
                return;
            }

            // Handle other errors
            console.error('Unexpected VAPI error:', errorString);
        };

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('error', onError);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
            vapi.off('error', onError)
        }
    }, [])

    useEffect(() => {
        // Add a delay before redirecting to allow user to see what happened
        if(callStatus === CallStatus.FINISHED) {
            console.log('Call finished, redirecting to home in 3 seconds...');
            const timer = setTimeout(() => {
                console.log('Redirecting to home page');
                router.push('/');
            }, 3000); // 3 second delay to give user time to understand what happened

            return () => clearTimeout(timer);
        }
    }, [callStatus, router]);

    const handleCall = async () => {
        try {
            console.log('Starting call with:', { userName, userId, workflowId: process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID });
            setCallStatus(CallStatus.CONNECTING);

            // Start the VAPI call
            await vapiConnectionManager.startCall({
                userName: userName || 'User',
                userId: userId || 'anonymous'
            });

            console.log('Call start request sent successfully');
        } catch (error) {
            console.error('Error starting call:', error);

            // Convert error to string for checking
            const errorString = typeof error === 'string' ? error :
                               (error instanceof Error ? error.message : null) ||
                               (error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : null) ||
                               JSON.stringify(error) ||
                               String(error);

            // Handle ejection errors
            if (errorString.includes('ejection') || errorString.includes('Meeting has ended')) {
                console.log('Meeting ejection during call start - ending gracefully');
                setCallStatus(CallStatus.FINISHED);
                setCallEndReason('The interview has ended. Thank you for participating!');
                return;
            }

            // Handle permission errors
            if (errorString.includes('permission') || errorString.includes('microphone')) {
                alert('Microphone access is required. Please check your browser permissions and try again.');
                setCallStatus(CallStatus.INACTIVE);
                return;
            }

            // Handle other errors
            alert(`Failed to start call: ${errorString}`);
            setCallStatus(CallStatus.INACTIVE);
        }
    }

    const handleDisconnect = async () => {
        try {
            setCallStatus(CallStatus.FINISHED);
            vapiConnectionManager.stopCall();
        } catch (error) {
            console.error('Error disconnecting call:', error);
            setCallStatus(CallStatus.FINISHED);
        }
    }

    const latestMessage = messages[messages.length - 1]?.content;

    return (
        <>
        <div className="call-view">
            <div className="card-interviewer">
                <div className="avatar">
                    <Image src="/ai-avatar.png" alt="vapi" width={65} height={54} className="object-cover" />
                    {isSpeaking && <span className="animate-speak" />}
                </div>
                <h3>AI Interviewer</h3>
            </div>

            <div className="card-border">
                <div className="card-content">
                    <Image src="/xENfQsk9_400x400.jpg" alt="user avatar" width={540} height={540} className="rounded-full object-cover size-[120px]" />
                    <h3>{userName}</h3>
                </div>
            </div>
        </div>
            {callStatus === CallStatus.FINISHED && callEndReason && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p className={cn('transition-opacity duration-500 opacity-0', 'animate-fadeIn opacity-100 text-center font-medium')}>
                            {callEndReason}
                        </p>
                    </div>
                </div>
            )}

            {messages.length > 0 && callStatus !== CallStatus.FINISHED && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p key={latestMessage} className={cn('transition-opacity duration-500 opacity-0', 'animate-fadeIn opacity-100')}>
                            {latestMessage}
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full flex justify-center">
                {callStatus !== CallStatus.ACTIVE ? (
                    <button className="relative btn-call" onClick={handleCall}>
                        <span className={cn('absolute animate-ping rounded-full opacity-75', callStatus !== CallStatus.CONNECTING && 'hidden')}
                             />

                            <span>
                                {callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED ? 'Call' : '. . . '}
                            </span>
                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={handleDisconnect}>
                        End
                    </button>
                )}
            </div>
        </>
    )
}
export default Agent