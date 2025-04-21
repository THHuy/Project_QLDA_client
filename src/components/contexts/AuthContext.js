import React, { createContext, useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, githubProvider } from "../services/firebase";
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const googleProvider = new GoogleAuthProvider();

  // Hàm đăng nhập bằng Google
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Lưu thông tin người dùng vào Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          provider: "google",
          lastLogin: new Date().toISOString(),
        },
        { merge: true }
      );

      return user;
    } catch (error) {
      console.error("Đăng nhập Google thất bại:", error);
      throw error;
    }
  };
  // Hàm đăng nhập bằng GitHub
  const loginWithGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;

      // GitHub có thể không cung cấp email trong một số trường hợp
      const email = user.email || `${user.uid}@github.user`;

      // Lưu thông tin người dùng vào Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          displayName:
            user.displayName || user.reloadUserInfo.screenName || "GitHub User",
          email: email,
          photoURL: user.photoURL,
          provider: "github",
          githubUsername: user.reloadUserInfo.screenName || "",
          lastLogin: new Date().toISOString(),
        },
        { merge: true }
      );

      return user;
    } catch (error) {
      console.error("Đăng nhập GitHub thất bại:", error);
      throw error;
    }
  };

  // Hàm đăng xuất
  const logout = () => {
    return signOut(auth);
  };

  // Lấy thông tin người dùng từ Firestore
  const getUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Không thể lấy thông tin người dùng:", error);
      return null;
    }
  };

  // Theo dõi trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        setCurrentUser({ ...user, profile });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loginWithGoogle,
    loginWithGithub,
    logout,
    getUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
