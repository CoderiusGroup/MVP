import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useSessionStore } from "../store/SessionStore";

type Props = {
  children: ReactElement;
};

export function RequireSession({ children }: Props) {
  const session = useSessionStore((state) => state.session);

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children;
}
