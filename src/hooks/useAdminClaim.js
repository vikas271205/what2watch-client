import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function useAdminClaim() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingClaims, setLoadingClaims] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
  const tokenResult = await user.getIdTokenResult(true);
  setIsAdmin(tokenResult.claims.isAdmin === true);
} catch (error) {
  setIsAdmin(false);
}
      } else {
        setIsAdmin(false);
      }
      setLoadingClaims(false);
    });

    return () => unsub();
  }, []);

  return { isAdmin, loadingClaims };
}
