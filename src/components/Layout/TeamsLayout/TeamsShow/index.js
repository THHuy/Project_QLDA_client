import classNames from "classnames/bind";
import styles from "./TeamsShow.module.scss";
import { useEffect, useState } from "react";
import { db } from "~/components/services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "~/components/hook/useAuth/useAuth";
import { getUserProduct } from "~/utils/productStorage";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
const cx = classNames.bind(styles);

function TeamsShow() {
  const { currentUser } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const productId = getUserProduct(currentUser.uid);
        if (!productId) return setTeams([]);
        // Lấy tất cả team thuộc product này
        const q = query(
          collection(db, "teams"),
          where("product_id", "==", productId)
        );
        const teamSnapshot = await getDocs(q);
        const teamList = await Promise.all(
          teamSnapshot.docs.map(async (teamDoc) => {
            const team = { id: teamDoc.id, ...teamDoc.data() };
            const memberQ = query(
              collection(db, "team_members"),
              where("team_id", "==", teamDoc.id)
            );
            const memberSnap = await getDocs(memberQ);
            const members = await Promise.all(
              memberSnap.docs.map(async (memDoc) => {
                const memData = memDoc.data();
                // Lấy thông tin user
                const userDoc = await getDoc(doc(db, "users", memData.user_id));
                const user = userDoc.exists() ? userDoc.data() : {};
                return {
                  id: memData.user_id,
                  name: user.displayName || "U",
                  photoURL: user.photoURL || null,
                };
              })
            );
            return {
              ...team,
              members,
            };
          })
        );
        setTeams(teamList);
      } catch (err) {
        setTeams([]);
      }
      setLoading(false);
    };
    fetchTeams();
  }, [currentUser]);

  return (
    <div className={cx("container")}>
      <h2>Teams</h2>
      {loading ? (
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      ) : (
        <div className={cx("teams-list")}>
          {teams.map((team) => (
            <div key={team.id} className={cx("team-card")}>
              <div className={cx("team-card-header")}>
                <div className={cx("team-icon")}>
                  <span role="img" aria-label="team">
                    👥
                  </span>
                </div>
                <div className={cx("team-avatars")}>
                  {team.members.slice(0, 2).map((m, idx) => (
                    <div key={m.id} className={cx("team-avatar")}>
                      {m.photoURL ? (
                        <img src={m.photoURL} alt={m.name} />
                      ) : (
                        m.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      )}
                    </div>
                  ))}
                  {team.members.length > 2 && (
                    <div className={cx("team-avatar-more")}>
                      +{team.members.length - 2}
                    </div>
                  )}
                </div>
              </div>
              <div className={cx("team-name")}>{team.team_name}</div>
              <div className={cx("team-members-count")}>
                {team.members.length} member{team.members.length > 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeamsShow;
