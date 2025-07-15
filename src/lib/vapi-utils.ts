import { vapi } from './vapi.sdk';

export interface VapiConnectionOptions {
  userName?: string;
  userId?: string;
}

export class VapiConnectionManager {
  private isConnecting = false;

  async startCall(options: VapiConnectionOptions): Promise<boolean> {
    if (this.isConnecting) {
      console.warn('Connection already in progress');
      return false;
    }

    this.isConnecting = true;

    try {
      // Request microphone permission
      await this.requestMicrophonePermission();

      // Start the VAPI call
      await this.attemptConnection(options);

      this.isConnecting = false;
      return true;
    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to start call:', error);
      throw error;
    }
  }

  private async requestMicrophonePermission(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      throw new Error('Microphone access is required for the interview. Please allow microphone access and try again.');
    }
  }

  private async attemptConnection(options: VapiConnectionOptions): Promise<void> {
    if (process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID) {
      await vapi.start(
        undefined, // assistant
        undefined, // assistantOverrides
        undefined, // squad
        process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID, // workflow
        { // workflowOverrides
          variableValues: {
            username: options.userName || 'User',
            userid: options.userId || 'anonymous',
          }
        }
      );
    } else {
      throw new Error('No VAPI Workflow ID configured');
    }
  }

  stopCall(): void {
    try {
      if (vapi) {
        vapi.stop();
      }
    } catch (error) {
      console.error('Error stopping VAPI call:', error);
    } finally {
      this.isConnecting = false;
    }
  }
}

export const vapiConnectionManager = new VapiConnectionManager();
