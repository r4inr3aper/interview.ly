'use server'
import { db, auth } from '@/firebase/admin';
import { cookies } from 'next/headers';

const ONE_WEEK = 60 * 60 * 24 * 7;
export async function signUp(params: SignUpParams){
    const { uid, name, email } = params;

    try {
        const userRecord = await db.collection('users').doc(uid).get();
        if(userRecord.exists) {
            return {
                success: false,
                message: 'User already exists.'
            };
        }
        await db.collection('users').doc(uid).set({
            name,
            email
        });
        return {
            success: true,
            message: 'User created successfully.'
        };
    } catch (e: unknown) {
        console.log(e);
        if(e && typeof e === 'object' && 'code' in e && e.code === 'auth/email-already-exists'){
            return{
                success: false,
                message: 'This email is already in use.'
            }
        }
        return{
            success: false,
            message: 'Something went wrong.'
        }
    }
}

export async function signIn(params: SignInParams) {
    const { email, idToken } = params;

    try {
        const userRecord = await auth.getUserByEmail(email);
        if (!userRecord) {
            return {
                success: false,
                message: 'User not found.',
            };
        }

        await setSessionCookie(idToken);
        
    } catch (error: unknown) {
        console.error(error);
        if (error && typeof error === 'object' && 'code' in error) {
            if (error.code === 'auth/wrong-password') {
                return {
                    success: false,
                    message: 'Incorrect password.',
                };
            }
            if (error.code === 'auth/user-not-found') {
                return {
                    success: false,
                    message: 'User not found.',
                };
            }
        }
        return {
            success: false,
            message: 'Something went wrong.',
        };
    }
}

export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();

    const sessionCookie = await auth.createSessionCookie(token, {
        expiresIn: ONE_WEEK * 1000,
    });

    cookieStore.set('session', sessionCookie, {
        maxAge: ONE_WEEK,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
    });
}

export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
        return null;
    }
    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        const userRecord = await db.collection('users').doc(decodedClaims.uid).get();
        if (!userRecord.exists) {
            return null;
        }
        return {
            ...userRecord.data(),
            id: userRecord.id
        } as User;
    } catch (error) {
        console.error('Error verifying session cookie:', error);
        return null;

    }
}

export async function isAuthenticated() {
    const user = await getCurrentUser();
    return !!user;
}

export async function signOutServer() {
    try {
        const cookieStore = await cookies();
        
        // Clear the session cookie
        cookieStore.delete('session');
        
        return {
            success: true,
            message: 'Signed out successfully.'
        };
    } catch (error) {
        console.error('Error during server sign out:', error);
        return {
            success: false,
            message: 'Failed to sign out.'
        };
    }
}

export async function getInterviewsByUserId(userId: string): Promise<Interview[]> {
    if (!userId) {
        return [];
    }
    
    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[]> {
    const { userId, limit = 20 } = params;

    if (!userId) {
        return [];
    }

    const interviews = await db
        .collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}