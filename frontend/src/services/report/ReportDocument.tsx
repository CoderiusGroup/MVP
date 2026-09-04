import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { STATUS_LABELS, type DisplayStatus } from "../../domain/rules/sessionRules";
import { STATUS_COLORS } from "../../theme/statusColors";
import type { ReportData } from "../reportData";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 40,
    paddingHorizontal: 44,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2328",
    lineHeight: 1.4,
  },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  subtitle: { fontSize: 10, color: "#57606a", marginBottom: 16 },
  headerRow: { flexDirection: "row", marginBottom: 2 },
  headerLabel: { width: 110, color: "#57606a" },
  headerValue: { flex: 1 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 20,
    marginBottom: 8,
    borderBottom: "1pt solid #d0d7de",
    paddingBottom: 3,
  },
  badge: {
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    fontSize: 9,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #d0d7de",
    paddingVertical: 4,
  },
  tableHead: {
    flexDirection: "row",
    borderBottom: "1pt solid #57606a",
    paddingVertical: 4,
    fontFamily: "Helvetica-Bold",
  },
  colReq: { width: 90 },
  colName: { flex: 1, paddingRight: 6 },
  colStatus: { width: 90 },
  assetBlock: { marginTop: 14 },
  assetHeading: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  assetMeta: { color: "#57606a", marginBottom: 4 },
  requirementBlock: { marginTop: 8, paddingLeft: 8 },
  requirementHeading: { flexDirection: "row", alignItems: "center" },
  requirementTitle: { fontFamily: "Helvetica-Bold", marginRight: 6 },
  pathStep: { flexDirection: "row", paddingVertical: 1, paddingLeft: 8 },
  pathIndex: { width: 16, color: "#57606a" },
  pathText: { flex: 1, paddingRight: 6 },
  pathAnswer: { width: 34, fontFamily: "Helvetica-Bold" },
  note: { color: "#57606a", fontStyle: "italic", paddingLeft: 8 },
});

function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <Text style={[styles.badge, { backgroundColor: STATUS_COLORS[status] }]}>
      {STATUS_LABELS[status]}
    </Text>
  );
}

export function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document title={`Report di conformità EN 18031 — ${data.device.name}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Report di conformità EN 18031</Text>
        <Text style={styles.subtitle}>
          Generato il {new Date(data.generatedAt).toLocaleString("it-IT")}
        </Text>

        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Sessione del</Text>
          <Text style={styles.headerValue}>
            {new Date(data.sessionSavedAt).toLocaleString("it-IT")}
          </Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Dispositivo</Text>
          <Text style={styles.headerValue}>{data.device.name}</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Sistema operativo</Text>
          <Text style={styles.headerValue}>{data.device.operatingSystem}</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Descrizione</Text>
          <Text style={styles.headerValue}>{data.device.description}</Text>
        </View>
        <View style={[styles.headerRow, { marginTop: 6, alignItems: "center" }]}>
          <Text style={styles.headerLabel}>Esito complessivo</Text>
          <View style={styles.headerValue}>
            <StatusBadge status={data.device.status} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Riepilogo per requisito</Text>
        <View style={styles.tableHead}>
          <Text style={styles.colReq}>Requisito</Text>
          <Text style={styles.colName}>Nome</Text>
          <Text style={styles.colStatus}>Esito aggregato</Text>
        </View>
        {data.requirementSummary.map((requirement) => (
          <View key={requirement.requirementId} style={styles.tableRow} wrap={false}>
            <Text style={styles.colReq}>{requirement.requirementId}</Text>
            <Text style={styles.colName}>{requirement.requirementName}</Text>
            <View style={styles.colStatus}>
              <StatusBadge status={requirement.status} />
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Dettaglio per asset</Text>
        {data.assets.map((asset) => (
          <View key={asset.assetId} style={styles.assetBlock} wrap={false}>
            <View style={styles.requirementHeading}>
              <Text style={styles.assetHeading}>{asset.name} </Text>
              <StatusBadge status={asset.status} />
            </View>
            <Text style={styles.assetMeta}>Tipo: {asset.type}</Text>

            {asset.requirements.length === 0 ? (
              <Text style={styles.note}>Nessun requisito applicabile.</Text>
            ) : (
              asset.requirements.map((requirement) => (
                <View key={requirement.requirementId} style={styles.requirementBlock} wrap={false}>
                  <View style={styles.requirementHeading}>
                    <Text style={styles.requirementTitle}>
                      {requirement.requirementId} — {requirement.requirementName}{" "}
                    </Text>
                    <StatusBadge status={requirement.pairStatus} />
                  </View>
                  {!requirement.pathAvailable ? (
                    <Text style={styles.note}>Percorso logico non disponibile.</Text>
                  ) : requirement.path.length === 0 ? (
                    <Text style={styles.note}>Nessuna domanda registrata.</Text>
                  ) : (
                    requirement.path.map((step, index) => (
                      <View key={`${step.nodeId}-${index}`} style={styles.pathStep}>
                        <Text style={styles.pathIndex}>{index + 1}.</Text>
                        <Text style={styles.pathText}>{step.text}</Text>
                        <Text style={styles.pathAnswer}>
                          {step.answer === "yes" ? "Sì" : "No"}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              ))
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
}
