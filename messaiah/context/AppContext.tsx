import React, { createContext, useContext, useState, PropsWithChildren, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { subscribeToAuthChanges, signOut } from '../services/authService';
import { Contact, UserProfile, FeedItem, FeedItemType, ChatMessage, AngelState, WeightedNode } from '../types';
import { useDiscoveryEngine } from '../hooks/useDiscoveryEngine';
import {
  getUserProfile,
  saveUserProfile,
  getContacts,
  saveContacts,
  getFeedItems,
  saveFeedItems,
  resetUserData
} from '../services/localStorageService';
import { hasApiKey, testApiKey } from '../services/geminiService';

interface AppContextType {
  // Global Data
  currentUser: FirebaseUser | null; // Auth User
  user: UserProfile | null;         // App Profile
  setUser: (user: UserProfile) => void;
  logout: () => void;
  resetAllData: () => Promise<void>;
  // ... existing props
  contacts: Contact[];
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  feedItems: FeedItem[];
  updateFeedItem: (id: string, updates: Partial<FeedItem>) => void;
  completeFeedItem: (id: string) => void;
  chatHistory: ChatMessage[];
  addChatMessage: (text: string, role: 'user' | 'model') => void;

  // UI State
  isLoading: boolean;
  isLoadingData: boolean;
  activeContext: string;
  setActiveContext: (ctx: string) => void;
  startOnboarding: (user: UserProfile, initialContacts: Contact[]) => Promise<void>;

  // Engine / Angels
  angels: {
    strategy: AngelState;
    network: AngelState;
    events: AngelState;
  };
  triggerAngels: () => void;
  setAngelsPaused: (paused: boolean) => void;
  isPaused: boolean;
  isAngelWorking: boolean;
  processingContactId: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // --- Data State ---
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: "I'm mess.ai.ah. Ready to save your social capital. How can I serve you?", timestamp: Date.now() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeContext, setActiveContext] = useState<string>("Dashboard");
  const [apiKeyValid, setApiKeyValid] = useState(false);

  // --- Data Helpers ---
  const setUser = useCallback((u: UserProfile | null) => setUserState(u), []);

  // --- Auth & Firestore Persistence Effect ---
  React.useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (u) => {
      setCurrentUser(u);
      if (!u) {
        // Logout / Cleanup
        setUserState(null);
        setContacts([]);
        setFeedItems([]);
        localStorage.removeItem('GEMINI_API_KEY');
      } else {
        // Load Data from Firestore with timeout
        setIsLoadingData(true);
        try {
          const loadData = async () => {
            const [profile, contactsList, feedList] = await Promise.all([
              getUserProfile(u.uid),
              getContacts(u.uid),
              getFeedItems(u.uid)
            ]);
            return { profile, contactsList, feedList };
          };

          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Data load timeout')), 5000)
          );

          const { profile, contactsList, feedList } = await Promise.race([
            loadData(),
            timeout
          ]);

          if (profile) {
            setUserState(profile);
          }
          if (contactsList.length > 0) {
            setContacts(contactsList);
          }
          if (feedList.length > 0) {
            setFeedItems(feedList);
          }
        } catch (e) {
          console.error("Failed to load user data from Firestore:", e);
          // On timeout or error, just continue - user will see onboarding
        } finally {
          setIsLoadingData(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore Auto-Save (Debounced) ---
  // Save Contacts when they change
  React.useEffect(() => {
    if (currentUser && contacts.length > 0) {
      const timer = setTimeout(() => {
        saveContacts(currentUser.uid, contacts).catch(e =>
          console.error("Failed to save contacts", e)
        );
      }, 1000); // Debounce saves by 1 second
      return () => clearTimeout(timer);
    }
  }, [contacts, currentUser]);

  // Save Feed when it changes
  React.useEffect(() => {
    if (currentUser && feedItems.length > 0) {
      const timer = setTimeout(() => {
        saveFeedItems(currentUser.uid, feedItems).catch(e =>
          console.error("Failed to save feed items", e)
        );
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [feedItems, currentUser]);

  // Save User Profile when it changes
  React.useEffect(() => {
    if (currentUser && user) {
      const timer = setTimeout(() => {
        saveUserProfile(currentUser.uid, user).catch(e =>
          console.error("Failed to save user profile", e)
        );
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, currentUser]);

  const logout = useCallback(() => {
    signOut();
    // State clearing handled by auth subscription
  }, []);





  // ... (keep addContact, updateContact, etc.)

  const addContact = useCallback((c: Contact) => {
    const newContact = { ...c, id: c.id || `c-${Date.now()}-${Math.random()}` };
    setContacts(prev => [newContact, ...prev]);
  }, []);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const updateFeedItem = useCallback((id: string, updates: Partial<FeedItem>) => {
    setFeedItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const completeFeedItem = useCallback((id: string) => {
    setFeedItems(prev => prev.map(item => item.id === id ? { ...item, isCompleted: true } : item));
  }, []);

  const addChatMessage = useCallback((text: string, role: 'user' | 'model') => {
    setChatHistory(prev => [...prev, { id: Date.now().toString(), role, text, timestamp: Date.now() }]);
  }, []);

  // --- Engine Integration ---
  const engine = useDiscoveryEngine({
    user,
    contacts,
    setContacts,
    feedItems,
    setFeedItems,
    updateContact
  });

  const resetAllData = useCallback(async () => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    console.log('[Reset] Starting comprehensive database reset');
    setIsLoading(true);

    try {
      // Step 1: Force stop all angels
      console.log('[Reset] Step 1: Stopping all angel operations');
      engine.setPaused(true);

      // Step 2: Wait for any pending operations to complete
      console.log('[Reset] Step 2: Waiting for operations to settle');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Clear Firestore data with timeout
      console.log('[Reset] Step 3: Clearing Firestore database');
      try {
        const firestoreDelete = resetUserData(currentUser.uid);
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 8000)
        );
        await Promise.race([firestoreDelete, timeout]);
        console.log('[Reset] Firestore cleared successfully');
      } catch (err) {
        console.warn('[Reset] Firestore failed/timeout, continuing with local reset:', err);
      }

      // Step 4: Clear React state
      console.log('[Reset] Step 4: Clearing React state');
      setUserState(null);
      setContacts([]);
      setFeedItems([]);
      setChatHistory([{
        id: 'init',
        role: 'model',
        text: "I'm mess.ai.ah. Ready to save your social capital. How can I serve you?",
        timestamp: Date.now()
      }]);

      // Step 5: Clear localStorage except API key
      console.log('[Reset] Step 5: Clearing localStorage (preserving API key)');
      const apiKey = localStorage.getItem('GEMINI_API_KEY');
      localStorage.clear();
      if (apiKey) {
        localStorage.setItem('GEMINI_API_KEY', apiKey);
      }

      // Step 6: Sign out (treats reset like deleting account)
      console.log('[Reset] Step 6: Signing out user');
      console.log('[Reset] ✅ Reset completed - user will be logged out');

      // Sign out - this will trigger auth cleanup and redirect to login
      // User can then log back in and will start fresh with onboarding
      setTimeout(() => {
        signOut();
      }, 500);

    } catch (e) {
      console.error('[Reset] FAILED:', e);
      setIsLoading(false);
      throw e;
    }
  }, [currentUser, engine, setChatHistory]);  // Auto-start Engine on Hydration
  React.useEffect(() => {
    const canStart = user && contacts.length > 0 && !engine.isRunning && !engine.isPaused && apiKeyValid;

    if (canStart) {
      console.log("[AppContext] Conditions met for auto-start. Triggering...");
      // Trigger immediately, the engine handles its own state checks
      engine.trigger();
    }
  }, [user, contacts.length, engine.isRunning, engine.isPaused, engine.trigger, apiKeyValid]); // dependencies require engine.trigger to be stable (it is)

  // Auto-pause when window loses focus or is closed (save tokens!)
  React.useEffect(() => {
    const handleBlur = () => {
      if (engine.isRunning && !engine.isPaused) {
        console.log("[AppContext] Window blur detected - pausing angels to save tokens");
        engine.setPaused(true);
      }
    };

    const handleBeforeUnload = () => {
      if (engine.isRunning && !engine.isPaused) {
        engine.setPaused(true);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [engine.isRunning, engine.isPaused, engine.setPaused]);

  // Validate API key on session start
  React.useEffect(() => {
    const validateOnStart = async () => {
      if (hasApiKey()) {
        console.log("[AppContext] Testing stored API key...");
        const isValid = await testApiKey();
        setApiKeyValid(isValid);
        if (!isValid) {
          console.warn("[AppContext] Stored API key is invalid - pausing angels");
          engine.setPaused(true);
        } else {
          console.log("[AppContext] API key validated successfully");
        }
      } else {
        console.warn("[AppContext] No API key found - angels blocked");
        setApiKeyValid(false);
        engine.setPaused(true);
      }
    };

    validateOnStart();
  }, [currentUser, engine.setPaused]); // Run once on auth change

  // --- Orchestration ---
  const startOnboarding = async (profile: UserProfile, initialContacts: Contact[]) => {
    if (!currentUser) return;

    setIsLoading(true);
    setUser(profile);

    try {
      // Wrap Firestore operations in timeout
      const saveData = async () => {
        await saveUserProfile(currentUser.uid, profile);
        setContacts(initialContacts);
        await saveContacts(currentUser.uid, initialContacts);

        const initialFeed: FeedItem[] = [
          {
            id: 'welcome-1',
            type: FeedItemType.SPONSOR_POTENTIAL,
            title: 'mess.ai.ah Initialized',
            description: `Imported ${initialContacts.length} souls. I am now scanning for leverage.`,
            actionLabel: 'View Network',
            isCompleted: false,
          }
        ];
        setFeedItems(initialFeed);
        await saveFeedItems(currentUser.uid, initialFeed);
      };

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Onboarding save timeout')), 8000)
      );

      await Promise.race([saveData(), timeout]);

      // Auto-start engine after successful save
      setTimeout(() => {
        engine.trigger();
      }, 2000);

    } catch (e) {
      console.error("Onboarding save failed:", e);
      // Don't throw - let user proceed even if Firestore fails
      // Data is already in local state
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, logout, resetAllData,
      user, setUser,
      contacts, addContact, updateContact,
      feedItems, completeFeedItem, updateFeedItem,
      chatHistory, addChatMessage,
      isLoading, isLoadingData,
      activeContext, setActiveContext,
      startOnboarding,

      // Engine Exports
      angels: engine.angels,
      triggerAngels: engine.trigger,
      setAngelsPaused: engine.setPaused,
      isPaused: engine.isPaused,
      isAngelWorking: engine.isRunning,
      processingContactId: engine.processingContactId
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}