import { db } from '../config/firebase';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    getDocs,
    writeBatch,
    deleteDoc,
    query
} from 'firebase/firestore';
import { Contact, UserProfile, FeedItem } from '../types';

/**
 * Firestore Service
 * Handles all database operations for user data persistence
 */

// ========== USER PROFILE ==========

export const saveUserProfile = async (userId: string, profile: UserProfile): Promise<void> => {
    if (!db) throw new Error('Firestore not initialized');

    const userDocRef = doc(db, 'users', userId, 'data', 'profile');
    await setDoc(userDocRef, profile);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!db) throw new Error('Firestore not initialized');

    const userDocRef = doc(db, 'users', userId, 'data', 'profile');
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }
    return null;
};

// ========== CONTACTS ==========

export const saveContacts = async (userId: string, contacts: Contact[]): Promise<void> => {
    if (!db) throw new Error('Firestore not initialized');

    const batch = writeBatch(db);
    const contactsCollectionRef = collection(db, 'users', userId, 'contacts');

    // Delete existing contacts first (batch delete + add)
    const existingContactsQuery = query(contactsCollectionRef);
    const existingContactsSnap = await getDocs(existingContactsQuery);
    existingContactsSnap.forEach((doc) => {
        batch.delete(doc.ref);
    });

    // Add new contacts
    contacts.forEach((contact) => {
        const contactDocRef = doc(contactsCollectionRef, contact.id);
        batch.set(contactDocRef, contact);
    });

    await batch.commit();
};

export const getContacts = async (userId: string): Promise<Contact[]> => {
    if (!db) throw new Error('Firestore not initialized');

    const contactsCollectionRef = collection(db, 'users', userId, 'contacts');
    const querySnapshot = await getDocs(contactsCollectionRef);

    const contacts: Contact[] = [];
    querySnapshot.forEach((doc) => {
        contacts.push(doc.data() as Contact);
    });

    return contacts;
};

// ========== FEED ITEMS ==========

export const saveFeedItems = async (userId: string, feedItems: FeedItem[]): Promise<void> => {
    if (!db) throw new Error('Firestore not initialized');

    const batch = writeBatch(db);
    const feedCollectionRef = collection(db, 'users', userId, 'feedItems');

    // Delete existing feed items
    const existingFeedQuery = query(feedCollectionRef);
    const existingFeedSnap = await getDocs(existingFeedQuery);
    existingFeedSnap.forEach((doc) => {
        batch.delete(doc.ref);
    });

    // Add new feed items
    feedItems.forEach((item) => {
        const feedDocRef = doc(feedCollectionRef, item.id);
        batch.set(feedDocRef, item);
    });

    await batch.commit();
};

export const getFeedItems = async (userId: string): Promise<FeedItem[]> => {
    if (!db) throw new Error('Firestore not initialized');

    const feedCollectionRef = collection(db, 'users', userId, 'feedItems');
    const querySnapshot = await getDocs(feedCollectionRef);

    const feedItems: FeedItem[] = [];
    querySnapshot.forEach((doc) => {
        feedItems.push(doc.data() as FeedItem);
    });

    return feedItems;
};

// ========== RESET ALL DATA ==========

export const resetUserData = async (userId: string): Promise<void> => {
    if (!db) throw new Error('Firestore not initialized');

    console.log('[Firestore] Starting data deletion for user:', userId);

    // Helper to delete collections in batches (Firestore limit is 500 operations per batch)
    const deleteInBatches = async (collectionRef: any) => {
        const snapshot = await getDocs(collectionRef);
        if (snapshot.empty) {
            console.log('[Firestore] Collection empty, skipping');
            return;
        }

        const batches: any[] = [];
        let currentBatch = writeBatch(db);
        let operationCount = 0;

        snapshot.docs.forEach((docRef: any) => {
            currentBatch.delete(docRef.ref);
            operationCount++;

            // Firestore batch limit
            if (operationCount === 500) {
                batches.push(currentBatch);
                currentBatch = writeBatch(db);
                operationCount = 0;
            }
        });

        // Add remaining operations
        if (operationCount > 0) {
            batches.push(currentBatch);
        }

        // Commit all batches sequentially
        console.log(`[Firestore] Committing ${batches.length} batch(es)`);
        for (const batch of batches) {
            await batch.commit();
        }
    };

    try {
        // Delete profile
        console.log('[Firestore] Deleting profile');
        const profileDocRef = doc(db, 'users', userId, 'data', 'profile');
        await deleteDoc(profileDocRef).catch(() => console.log('[Firestore] No profile to delete'));

        // Delete contacts in batches
        console.log('[Firestore] Deleting contacts');
        const contactsCollectionRef = collection(db, 'users', userId, 'contacts');
        await deleteInBatches(contactsCollectionRef);

        // Delete feed items in batches
        console.log('[Firestore] Deleting feed items');
        const feedCollectionRef = collection(db, 'users', userId, 'feedItems');
        await deleteInBatches(feedCollectionRef);

        console.log('[Firestore] Data deletion complete');
    } catch (error) {
        console.error('[Firestore] Error during data deletion:', error);
        throw error;
    }
};
