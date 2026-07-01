'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In development, we want to see this clearly.
      // In production, we might want to log this or show a more generic message.
      console.error('Firebase Permission Error:', error.context);
      
      if (process.env.NODE_ENV === 'development') toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: `You don't have permission to ${error.context.operation} this data.`,
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
