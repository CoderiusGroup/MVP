import { useNavigate } from "react-router-dom";

import { Esito } from "../components/Esito";
import { downloadSession } from "../services/SessionService";
import { useSessionStore } from "../store/SessionStore";

export function ResultPage() {
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);

  if (!session) {
    return (
      <div style={{ padding: "1rem" }}>
        <p role="alert">Nessuna sessione attiva.</p>
        <button type="button" onClick={() => navigate("/")}>
          Torna alla Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Valutazione completata</h1>
      <ul>
        {session.evaluations.map((evaluation) => (
          <li key={`${evaluation.assetId}-${evaluation.requirementId}`}>
            {evaluation.assetId} — {evaluation.requirementId}:{" "}
            {evaluation.outcome ? <Esito outcome={evaluation.outcome} /> : "—"}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => downloadSession(session)}>
        Salva sessione
      </button>
      <button type="button" onClick={() => navigate("/session/modify")}>
        Modifica sessione
      </button>
      <button type="button" onClick={() => navigate("/")}>
        Torna alla Home
      </button>
    </div>
  );
}
