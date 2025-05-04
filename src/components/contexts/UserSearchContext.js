import React, { createContext, useState, useContext, useCallback } from "react";
import { collection, query, where, getDocs, or } from "firebase/firestore";
import { db } from "../services/firebase";
import { AuthContext } from "./AuthContext";

// Tạo context cho tìm kiếm người dùng
export const UserSearchContext = createContext();

export function UserSearchProvider({ children }) {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { currentUser } = useContext(AuthContext);

  // Hàm tìm kiếm người dùng theo tên hoặc email
  const searchUsers = useCallback(
    async (searchTerm) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return [];
      }

      setIsSearching(true);
      try {
        const usersRef = collection(db, "users");

        // Tạo truy vấn tìm kiếm theo tên hoặc email
        const q = query(
          usersRef,
          or(
            where("displayName", ">=", searchTerm),
            where("displayName", "<=", searchTerm + "\uf8ff"),
            where("email", ">=", searchTerm),
            where("email", "<=", searchTerm + "\uf8ff")
          )
        );

        const querySnapshot = await getDocs(q);
        const results = [];

        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          // Không hiển thị người dùng hiện tại trong kết quả tìm kiếm
          if (currentUser && userData.uid !== currentUser.uid) {
            results.push({ id: doc.id, ...userData });
          }
        });

        setSearchResults(results);
        return results;
      } catch (error) {
        console.error("Lỗi khi tìm kiếm người dùng:", error);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [currentUser]
  );

  // Hàm thêm người dùng vào danh sách đã chọn
  const addSelectedUser = useCallback((user) => {
    setSelectedUsers((prevUsers) => {
      // Kiểm tra xem người dùng đã được chọn chưa
      if (!prevUsers.some((u) => u.uid === user.uid)) {
        return [...prevUsers, user];
      }
      return prevUsers;
    });
  }, []);

  // Hàm xóa người dùng khỏi danh sách đã chọn
  const removeSelectedUser = useCallback((userId) => {
    setSelectedUsers((prevUsers) =>
      prevUsers.filter((user) => user.uid !== userId)
    );
  }, []);

  // Hàm xóa tất cả người dùng đã chọn
  const clearSelectedUsers = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  // Tìm kiếm người dùng theo danh sách uid
  const getUsersByIds = useCallback(async (userIds) => {
    if (!userIds || userIds.length === 0) return [];

    try {
      const usersRef = collection(db, "users");
      const batches = [];

      // Firebase có giới hạn tối đa 10 giá trị cho mệnh đề "in"
      // nên chúng ta chia nhỏ danh sách nếu cần
      for (let i = 0; i < userIds.length; i += 10) {
        const batchIds = userIds.slice(i, i + 10);
        const q = query(usersRef, where("uid", "in", batchIds));
        batches.push(getDocs(q));
      }

      const results = await Promise.all(batches);
      const users = [];

      results.forEach((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() });
        });
      });

      return users;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng theo ID:", error);
      return [];
    }
  }, []);

  const value = {
    searchResults,
    isSearching,
    selectedUsers,
    searchUsers,
    addSelectedUser,
    removeSelectedUser,
    clearSelectedUsers,
    getUsersByIds,
  };

  return (
    <UserSearchContext.Provider value={value}>
      {children}
    </UserSearchContext.Provider>
  );
}

// Hook để sử dụng UserSearchContext
export const useUserSearch = () => useContext(UserSearchContext);
