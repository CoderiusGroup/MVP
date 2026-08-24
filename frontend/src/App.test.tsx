import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("shows HomePage on the default route", () => {
    render(<App />);

    expect(screen.getByText("Gestione Valutazione Dispositivi")).toBeInTheDocument();
  });
});