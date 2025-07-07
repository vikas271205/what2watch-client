import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import useAdminClaim from "../hooks/useAdminClaim";

const AdminRoute = ({ children }) => {
  const [user, loadingAuth] = useAuthState(auth);
  const { isAdmin, loadingClaims } = useAdminClaim();

  if (loadingAuth || loadingClaims) return <div className="p-4">🔐 Checking permissions...</div>;

  if (!user || !isAdmin) {
    return (
      <div className="p-4 text-red-500 text-xl font-semibold">
        ❌ Access Denied. Admins only.
      </div>
    );
  }

  return children;
};

export default AdminRoute;
