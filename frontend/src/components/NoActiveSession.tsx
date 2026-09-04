import { useNavigate } from "react-router-dom";

export function NoActiveSession() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <p role="alert" className="empty-state">
        Nessuna sessione attiva.
      </p>
      <button type="button" className="btn" onClick={() => navigate("/")}>
        Torna alla Home
      </button>
    </div>
  );
}
