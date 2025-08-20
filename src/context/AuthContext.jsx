import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData({ id: userDoc.id, ...userDoc.data() });
        } else {
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Atualizar a data do último login
    const userDocRef = doc(db, 'users', result.user.uid);
    await updateDoc(userDocRef, {
      lastLogin: serverTimestamp(),
    });
    return result;
  };

  const register = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Criar documento do usuário no Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      email: result.user.email,
      role: 'viewer', // Usuários novos começam como 'viewer'
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      displayName: result.user.email.split('@')[0]
    });
    
    return result;
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    user: currentUser, // Alias para compatibilidade
    userData,
    loading,
    login,
    register,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    user: currentUser, // Alias para compatibilidade
    userData,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
