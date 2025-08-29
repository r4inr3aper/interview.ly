import Vapi from "@vapi-ai/web";

interface VapiError {
  type?: string;
  error?: {
    status?: number;
  };
  message?: string;
}

// Validate environment variables immediately
if (typeof window !== 'undefined') {
  const requiredVars = {
    NEXT_PUBLIC_VAPI_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
    NEXT_PUBLIC_VAPI_WORKFLOW_ID: process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID
  };

  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('❌ Missing VAPI environment variables:', missing);
    console.error('Please restart your development server after adding these to .env.local');
  } else {
    console.log('✅ All VAPI environment variables found');
  }
}

// Create VAPI instance with proper error handling
class VapiManager {
  private instance: Vapi | null = null;
  private isInitialized = false;

  private getInstance(): Vapi {
    if (!this.instance && !this.isInitialized) {
      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
      
      if (!publicKey) {
        throw new Error('VAPI_NOT_CONFIGURED: Please add NEXT_PUBLIC_VAPI_PUBLIC_KEY to your .env.local file and restart the server');
      }

      try {
        this.instance = new Vapi(publicKey);
        this.isInitialized = true;
        console.log('✅ VAPI initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize VAPI:', error);
        throw new Error(`VAPI_INIT_FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (!this.instance) {
      throw new Error('VAPI_INSTANCE_NULL: Failed to create VAPI instance');
    }

    return this.instance;
  }

  async start(
    assistant?: string | object,
    assistantOverrides?: object,
    squad?: string,
    workflow?: string,
    workflowOverrides?: object
  ) {
    try {
      const instance = this.getInstance();
      
      // Log the call parameters for debugging
      if (workflow) {
        console.log('VAPI attempting to start workflow:', {
          workflowId: workflow.substring(0, 8) + '...',
          hasOverrides: !!workflowOverrides,
          variableValues: workflowOverrides && 'variableValues' in workflowOverrides 
            ? Object.keys((workflowOverrides as { variableValues?: Record<string, unknown> }).variableValues || {}) 
            : 'none'
        });
      } else {
        console.log('VAPI attempting to start assistant:', {
          type: typeof assistant === 'string' ? 'assistant_id' : 'assistant_config',
          hasOverrides: !!assistantOverrides
        });
      }
      
      const result = await instance.start(assistant, assistantOverrides, squad, workflow, workflowOverrides);
      console.log('VAPI start successful');
      return result;
    } catch (error) {
      console.error('❌ VAPI start error details:', {
        error,
        message: error instanceof Error ? error.message : 'No message',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack',
        isEmptyObject: typeof error === 'object' && error !== null && Object.keys(error).length === 0
      });
      
      // Handle VAPI specific errors
      if (error && typeof error === 'object') {
        const vapiError = error as VapiError;
        
        if (vapiError.type === 'start-method-error') {
          // Extract more details from the Response object
          if (vapiError.error?.status === 400) {
            console.error('❌ VAPI 400 Bad Request - Workflow configuration issue');
            throw new Error('VAPI_WORKFLOW_ERROR: The interview generation workflow is not properly configured. Please contact support.');
          }
          
          throw new Error(`VAPI_START_ERROR: ${vapiError.message || 'Failed to start VAPI call'}`);
        }
      }
      
      // Handle empty error objects
      if (typeof error === 'object' && error !== null && Object.keys(error).length === 0) {
        throw new Error('VAPI_EMPTY_ERROR: Unknown VAPI error occurred. Please check your workflow configuration.');
      }
      
      throw error;
    }
  }

  stop() {
    try {
      if (this.instance) {
        this.instance.stop();
      }
    } catch (error) {
      console.error('❌ VAPI stop error:', error);
    }
  }

  on(event: string, callback: (...args: unknown[]) => void) {
    try {
      const instance = this.getInstance();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (instance as any).on(event, callback);
    } catch (error) {
      console.error('❌ VAPI event listener error:', error);
      throw error;
    }
  }

  off(event: string, callback: (...args: unknown[]) => void) {
    try {
      if (this.instance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.instance as any).off(event, callback);
      }
    } catch (error) {
      console.error('❌ VAPI event removal error:', error);
    }
  }
}

export const vapi = new VapiManager();