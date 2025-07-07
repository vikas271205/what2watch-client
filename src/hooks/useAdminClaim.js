import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function useAdminClaim() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingClaims, setLoadingClaims] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const tokenResult = await user.getIdTokenResult(true); // force refresh
        console.log("🔐 Claims:", tokenResult.claims); // ✅ ADD THIS
        setIsAdmin(tokenResult.claims.isAdmin === true); // ✅ matches your actual claim

      } else {
        setIsAdmin(false);
      }
      setLoadingClaims(false);
    });

    return () => unsub();
  }, []);

  return { isAdmin, loadingClaims };
}
