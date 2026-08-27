import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, set, serverTimestamp, off, onDisconnect, increment, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const isFirebaseConfigured: boolean = Object.values(firebaseConfig).every(v => v !== '');

let app: ReturnType<typeof initializeApp> | null = null;
let database: ReturnType<typeof getDatabase> | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
}

export { database, ref, push, onValue, set, serverTimestamp, off, onDisconnect, increment };

export interface ChatMessage {
  id?: string;
  username: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RadioMetadata {
  title: string;
  artist: string;
  coverUrl?: string;
  showName?: string;
  hostName?: string;
  isLive: boolean;
  listenerCount: number;
  updatedAt: number;
}

export interface RadioSession {
  id: string;
  showId: string;
  showName: string;
  hostName?: string;
  coverUrl?: string;
  audioUrl: string;
  startedAt: number;
  duration: number;
  replayEnabled: boolean;
  isActive: boolean;
}

export interface RecentlyPlayedTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  audioUrl: string;
  duration: number;
  playedAt: number;
  showId: string;
}

export function subscribeToChat(callback: (messages: ChatMessage[]) => void): () => void {
  if (!database) {
    callback([{
      id: 'welcome',
      username: 'System',
      message: 'Welcome to Group Therapy Radio! Chat will be available once Firebase is configured.',
      timestamp: Date.now(),
      isSystem: true
    }]);
    return () => {};
  }

  const chatRef = ref(database, 'radio/chat');
  const unsubscribe = onValue(chatRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const messages = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        ...value
      }));
      messages.sort((a, b) => a.timestamp - b.timestamp);
      const recentMessages = messages.slice(-100);
      callback(recentMessages);
    } else {
      callback([{
        id: 'welcome',
        username: 'System',
        message: 'Welcome to Group Therapy Radio chat!',
        timestamp: Date.now(),
        isSystem: true
      }]);
    }
  });

  return () => off(chatRef);
}

export async function sendChatMessage(username: string, message: string): Promise<void> {
  if (!database) {
    console.warn('Firebase not configured, message not sent');
    return;
  }

  const chatRef = ref(database, 'radio/chat');
  await push(chatRef, {
    username,
    message,
    timestamp: Date.now(),
    isSystem: false
  });
}

export function subscribeToRadioMetadata(callback: (metadata: RadioMetadata) => void): () => void {
  if (!database) {
    callback({
      title: 'Group Therapy Radio',
      artist: 'Live Stream',
      isLive: true,
      listenerCount: 127,
      updatedAt: Date.now()
    });
    return () => {};
  }

  const metadataRef = ref(database, 'radio/metadata');
  const unsubscribe = onValue(metadataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    } else {
      callback({
        title: 'Group Therapy Radio',
        artist: 'Live Stream',
        isLive: true,
        listenerCount: 127,
        updatedAt: Date.now()
      });
    }
  });

  return () => off(metadataRef);
}

export async function updateRadioMetadata(metadata: Partial<RadioMetadata>): Promise<void> {
  if (!database) {
    console.warn('Firebase not configured');
    return;
  }

  const metadataRef = ref(database, 'radio/metadata');
  await set(metadataRef, {
    ...metadata,
    updatedAt: Date.now()
  });
}

export function trackListener(): () => void {
  if (!database) return () => {};

  const listenersRef = ref(database, 'radio/listeners');
  const myListenerRef = push(listenersRef);
  
  set(myListenerRef, {
    joinedAt: Date.now(),
    active: true
  });

  onDisconnect(myListenerRef).remove();

  return () => {
    set(myListenerRef, null);
  };
}

export function subscribeToListenerCount(callback: (count: number) => void): () => void {
  if (!database) {
    callback(0);
    return () => {};
  }

  const listenersRef = ref(database, 'radio/listeners');
  const unsubscribe = onValue(listenersRef, (snapshot) => {
    const data = snapshot.val();
    const count = data ? Object.keys(data).length : 0;
    callback(count);
  });

  return () => off(listenersRef);
}

export const isFirebaseReady = () => !!database;
export const isFirebaseConnected = () => isFirebaseConfigured && !!database;
export { isFirebaseConfigured };

export async function calculateServerTimeOffset(): Promise<number> {
  if (!database) {
    return 0;
  }

  try {
    const offsetRef = ref(database, '.info/serverTimeOffset');
    const snapshot = await get(offsetRef);
    const offset = snapshot.val() || 0;
    return offset;
  } catch (error) {
    console.warn('Failed to calculate server time offset:', error);
    return 0;
  }
}

export function subscribeToServerTimeOffset(callback: (offset: number) => void): () => void {
  if (!database) {
    callback(0);
    return () => {};
  }

  const offsetRef = ref(database, '.info/serverTimeOffset');
  const unsubscribe = onValue(offsetRef, (snapshot) => {
    const offset = snapshot.val() || 0;
    callback(offset);
  });

  return () => off(offsetRef);
}

export function subscribeToCurrentSession(callback: (session: RadioSession | null) => void): () => void {
  if (!database) {
    callback(null);
    return () => {};
  }

  const sessionRef = ref(database, 'radio/currentSession');
  
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data && data.isActive) {
      callback(data);
    } else {
      callback(null);
    }
  });

  return () => off(sessionRef);
}

export async function startRadioSession(params: {
  showId: string;
  showName: string;
  hostName?: string;
  coverUrl?: string;
  audioUrl: string;
  duration: number;
  replayEnabled?: boolean;
}): Promise<string> {
  if (!database) {
    return '';
  }

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sessionRef = ref(database, 'radio/currentSession');
  
  const session: RadioSession = {
    id: sessionId,
    showId: params.showId,
    showName: params.showName,
    hostName: params.hostName,
    coverUrl: params.coverUrl,
    audioUrl: params.audioUrl,
    startedAt: Date.now(),
    duration: params.duration,
    replayEnabled: params.replayEnabled ?? false,
    isActive: true,
  };

  await set(sessionRef, session);

  const chatRef = ref(database, 'radio/chat');
  await set(chatRef, null);

  await push(chatRef, {
    username: 'System',
    message: `🎵 Now playing: ${params.showName}${params.hostName ? ` with ${params.hostName}` : ''}`,
    timestamp: Date.now(),
    isSystem: true
  });

  return sessionId;
}

export async function updateSessionReplayEnabled(replayEnabled: boolean): Promise<void> {
  if (!database) {
    return;
  }

  const sessionRef = ref(database, 'radio/currentSession');
  const snapshot = await get(sessionRef);
  const session = snapshot.val();
  
  if (session) {
    await set(sessionRef, {
      ...session,
      replayEnabled,
    });
  }
}

export async function restartSession(): Promise<void> {
  if (!database) {
    return;
  }

  const sessionRef = ref(database, 'radio/currentSession');
  const snapshot = await get(sessionRef);
  const session = snapshot.val();
  
  if (session) {
    await set(sessionRef, {
      ...session,
      startedAt: Date.now(),
    });

    const chatRef = ref(database, 'radio/chat');
    await push(chatRef, {
      username: 'System',
      message: `🔄 Show restarted: ${session.showName}`,
      timestamp: Date.now(),
      isSystem: true
    });
  }
}

export async function endRadioSession(): Promise<void> {
  if (!database) {
    return;
  }

  const sessionRef = ref(database, 'radio/currentSession');
  const snapshot = await get(sessionRef);
  const session = snapshot.val();
  
  if (session) {
    await set(sessionRef, {
      ...session,
      isActive: false,
    });

    const chatRef = ref(database, 'radio/chat');
    await push(chatRef, {
      username: 'System',
      message: `📻 Show ended: ${session.showName}`,
      timestamp: Date.now(),
      isSystem: true
    });
  }
}

export function subscribeToRecentlyPlayed(callback: (tracks: RecentlyPlayedTrack[]) => void): () => void {
  if (!database) {
    callback([]);
    return () => {};
  }

  const recentRef = ref(database, 'radio/recentlyPlayed');
  const unsubscribe = onValue(recentRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const tracks = Object.entries(data)
        .map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }))
        .sort((a, b) => b.playedAt - a.playedAt)
        .slice(0, 10);
      callback(tracks);
    } else {
      callback([]);
    }
  });

  return () => off(recentRef);
}

export async function addToRecentlyPlayed(track: Omit<RecentlyPlayedTrack, 'id'>): Promise<void> {
  if (!database) {
    return;
  }

  const recentRef = ref(database, 'radio/recentlyPlayed');
  await push(recentRef, track);

  const snapshot = await get(recentRef);
  const data = snapshot.val();
  if (data) {
    const entries = Object.entries(data);
    if (entries.length > 20) {
      const sorted = entries.sort((a: any, b: any) => b[1].playedAt - a[1].playedAt);
      const toDelete = sorted.slice(20);
      for (const [key] of toDelete) {
        const deleteRef = ref(database, `radio/recentlyPlayed/${key}`);
        await set(deleteRef, null);
      }
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function showNotification(title: string, body: string, icon?: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  if (document.hasFocus()) {
    return;
  }

  new Notification(title, {
    body,
    icon: icon || '/favicon.ico',
    tag: 'radio-chat',
    silent: false
  });
}
