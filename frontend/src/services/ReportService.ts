import { pdf } from "@react-pdf/renderer";

import type { Session } from "../domain/entities/Session";
import { downloadBlob } from "./downloadFile";
import { buildReportData } from "./reportData";
import { ReportDocument } from "./report/ReportDocument";

export async function exportReportPdf(session: Session): Promise<void> {
  const data = await buildReportData(session);
  const blob = await pdf(ReportDocument({ data })).toBlob();
  downloadBlob(blob, `report-${session.id}.pdf`);
}
