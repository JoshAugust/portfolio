import { Contact, FeedItem, UserProfile } from '../types';

// Storage keys
const STORAGE_KEYS = {
    PROFILE: 'messaiah_profile',
    CONTACTS: 'messaiah_contacts',
    FEED_ITEMS: 'messaiah_feed_items',
};

// ========== PROFILE ==========

export const saveUserProfile = async (userId: string, profile: UserProfile): Promise<void> => {
    console.log('[LocalStorage] Saving profile');
    const key = `${STORAGE_KEYS.PROFILE}_${userId}`;
    localStorage.setItem(key, JSON.stringify(profile));
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    console.log('[LocalStorage] Loading profile');
    const key = `${STORAGE_KEYS.PROFILE}_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};

// ========== CONTACTS ==========

export const saveContacts = async (userId: string, contacts: Contact[]): Promise<void> => {
    console.log('[LocalStorage] Saving contacts:', contacts.length);
    const key = `${STORAGE_KEYS.CONTACTS}_${userId}`;
    localStorage.setItem(key, JSON.stringify(contacts));
};

export const getContacts = async (userId: string): Promise<Contact[]> => {
    console.log('[LocalStorage] Loading contacts');
    const key = `${STORAGE_KEYS.CONTACTS}_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

// ========== FEED ITEMS ==========

export const saveFeedItems = async (userId: string, feedItems: FeedItem[]): Promise<void> => {
    console.log('[LocalStorage] Saving feed items:', feedItems.length);
    const key = `${STORAGE_KEYS.FEED_ITEMS}_${userId}`;
    localStorage.setItem(key, JSON.stringify(feedItems));
};

export const getFeedItems = async (userId: string): Promise<FeedItem[]> => {
    console.log('[LocalStorage] Loading feed items');
    const key = `${STORAGE_KEYS.FEED_ITEMS}_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

// ========== RESET ==========

export const resetUserData = async (userId: string): Promise<void> => {
    console.log('[LocalStorage] Resetting all data for user:', userId);

    const profileKey = `${STORAGE_KEYS.PROFILE}_${userId}`;
    const contactsKey = `${STORAGE_KEYS.CONTACTS}_${userId}`;
    const feedKey = `${STORAGE_KEYS.FEED_ITEMS}_${userId}`;

    localStorage.removeItem(profileKey);
    localStorage.removeItem(contactsKey);
    localStorage.removeItem(feedKey);

    console.log('[LocalStorage] Reset complete');
};
