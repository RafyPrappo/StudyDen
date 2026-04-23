import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Container from "../components/ui/Container";
import { leaderboardApi } from "../services/points";
import { Link } from "react-router-dom";

const BADGE_ICONS = {
  Explorer: "🌍",
  Critic: "📝",
  Organizer: "🎯",
  Guardian: "🛡️",
  "Perfect Host": "⭐",
  Dedicated: "🔥"
};

const BADGE_COLORS = {
  Explorer: "bg-blue-50 text-blue-700 border-blue-200",
  Critic: "bg-purple-50 text-purple-700 border-purple-200",
  Organizer: "bg-green-50 text-green-700 border-green-200",
  Guardian: "bg-amber-50 text-amber-700 border-amber-200",
  "Perfect Host": "bg-yellow-50 text-yellow-700 border-yellow-200",
  Dedicated: "bg-red-50 text-red-700 border-red-200"
};

const USERS_PER_PAGE = 10;

export default function Leaderboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeaderboard();
    if (user) {
      fetchUserRank();
    }
  }, [page, user]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError("");
<<<<<<< Updated upstream
      const data = await leaderboardApi.getLeaderboard(page, 10);
      
      const filteredUsers = data.users?.filter(u => u.role !== "admin") || [];
=======
      const data = await leaderboardApi.getLeaderboard(page, USERS_PER_PAGE);

      const filteredUsers = (data.users || []).filter(u => u.role !== "admin");
>>>>>>> Stashed changes
      setUsers(filteredUsers);
      setTotalPages(data.pagination?.pages || 1);
      setTotalUsers(data.pagination?.total || 0);
    } catch (err) {
      setError("Failed to load leaderboard. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    try {
      const data = await leaderboardApi.getMyRank();
      setUserRank(data);
    } catch (err) {
      console.error("Failed to fetch user rank:", err);
    }
  };

  const goToMyPage = () => {
    if (!userRank?.rank) return;
    const myPage = Math.ceil(userRank.rank / USERS_PER_PAGE);
    setPage(myPage);
  };

  if (loading && users.length === 0) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-600 mt-1">
          Top {totalUsers} students in the StudyDen community
        </p>
      </div>

<<<<<<< Updated upstream
=======
      {/* Your Ranking Card with "Show Me in the List" button */}
>>>>>>> Stashed changes
      {user && userRank && user.role !== "admin" && (
        <Card className="mb-6 p-4 bg-blue-50/50 border border-blue-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
<<<<<<< Updated upstream
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden">
                {user.profilePhoto ? (
                  <img 
                    src={`http://localhost:5000${user.profilePhoto}`} 
                    alt={user.name}
                    className="w-full h-full object-cover"
=======
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                #{userRank.rank}
              </div>
              <div className="flex items-center gap-3">
                {userRank.profilePhoto && (
                  <img
                    src={`${API_BASE}${userRank.profilePhoto}`}
                    alt={userRank.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => { e.target.style.display = "none"; }}
>>>>>>> Stashed changes
                  />
                ) : (
                  <span>#{userRank.rank}</span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Your Ranking</p>
                <p className="text-xl font-semibold text-gray-900">
                  {user.name} • {userRank.points} points
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {userRank.badges?.map(badge => (
                  <span key={badge} className="text-2xl" title={badge}>
                    {BADGE_ICONS[badge]}
                  </span>
                ))}
              </div>
              <button
                onClick={goToMyPage}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Show Me in the List
              </button>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Badges</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((userItem) => (
                <tr
                  key={userItem.id}
                  className={`hover:bg-gray-50 transition ${
                    user?.id === userItem.id ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-700">#{userItem.rank}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/profile/${userItem.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 overflow-hidden flex-shrink-0">
                        {userItem.profilePhoto ? (
<<<<<<< Updated upstream
                          <img 
                            src={`http://localhost:5000${userItem.profilePhoto}`} 
=======
                          <img
                            src={`${API_BASE}${userItem.profilePhoto}`}
>>>>>>> Stashed changes
                            alt={userItem.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-medium text-sm">
                            {userItem.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{userItem.name}</p>
                        <p className="text-sm text-gray-500">{userItem.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 justify-center flex-wrap">
                      {userItem.badges?.length > 0 ? (
                        userItem.badges.map(badge => (
                          <span
                            key={badge}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${BADGE_COLORS[badge] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                          >
                            {BADGE_ICONS[badge]} {badge}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="font-medium text-gray-900">{userItem.points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded-md text-sm ${
                page === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded-md text-sm ${
                page === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </Card>

      {/* Badge Legend */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl mb-2">🌍</div>
          <h3 className="font-semibold text-gray-900">Explorer</h3>
          <p className="text-xs text-gray-500">200 pts</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl mb-2">📝</div>
          <h3 className="font-semibold text-gray-900">Critic</h3>
          <p className="text-xs text-gray-500">150 pts</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-semibold text-gray-900">Organizer</h3>
          <p className="text-xs text-gray-500">300 pts</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl mb-2">🛡️</div>
          <h3 className="font-semibold text-gray-900">Guardian</h3>
          <p className="text-xs text-gray-500">100 pts</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl mb-2">⭐</div>
          <h3 className="font-semibold text-gray-900">Perfect Host</h3>
          <p className="text-xs text-gray-500">500 pts</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl mb-2">🔥</div>
          <h3 className="font-semibold text-gray-900">Dedicated</h3>
          <p className="text-xs text-gray-500">3 ditched</p>
        </Card>
      </div>
    </Container>
  );
}