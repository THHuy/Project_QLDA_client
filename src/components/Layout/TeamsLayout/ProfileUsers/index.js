import { useAuth } from "~/components/hook/useAuth/useAuth";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "~/components/services/firebase";
import classNames from "classnames/bind";
import styles from "./ProfileUsers.module.scss";

const cx = classNames.bind(styles);

function ProfileUsers() {
  const { currentUser } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);

  const productId = localStorage.getItem(`selectedProduct-${currentUser.uid}`);
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!productId) return;

      try {
        const q = query(
          collection(db, "product_members"),
          where("product_id", "==", productId)
        );
        const snapshot = await getDocs(q);
        const userDataPromises = snapshot.docs.map(async (docSnap) => {
          const { user_id, role_in_product, status } = docSnap.data();
          // Truy vấn tài liệu trong bộ sưu tập users bằng user_id
          const userRef = doc(db, "users", user_id);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.exists() ? userDoc.data() : {};
          return {
            id: user_id,
            role: role_in_product,
            name: userData.displayName || "Người dùng",
            photoURL: userData.photoURL || null, // Lấy photoURL từ users
            email: userData.email || null,
            status: status || "Active",
          };
        });
        const results = await Promise.all(userDataPromises);
        setTeamMembers(results.filter((member) => member.status === "Active"));
      } catch (error) {
        console.error("Error fetching product members:", error);
      }
    };

    fetchTeamMembers();
  }, [productId]);

  return (
    <div className={cx("container-fluid")}>
      <div className={cx("team-list")}>
        {teamMembers.map((member) => (
          <div key={member.id} className={cx("users-profile")}>
            {member.photoURL ? (
              <img
                src={member.photoURL}
                alt="Avatar"
                className={cx("avatar-profile")}
              />
            ) : (
              <div className={cx("avatar-placeholder")}>
                {member.name[0] || "U"}
              </div>
            )}
            <h3>{member.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfileUsers;
