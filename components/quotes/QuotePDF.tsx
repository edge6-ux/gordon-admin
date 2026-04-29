"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Quote } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding:         40,
    fontFamily:      "Helvetica",
    fontSize:        10,
    color:           "#1A1A1A",
    backgroundColor: "#FFFFFF",
  },
  goldBar: {
    height:          3,
    backgroundColor: "#C8922A",
    marginBottom:    20,
  },
  header: {
    flexDirection:     "row",
    justifyContent:    "space-between",
    alignItems:        "flex-start",
    marginBottom:      20,
    paddingBottom:     16,
    borderBottomWidth: 2,
    borderBottomColor: "#1C3A2B",
  },
  companyName: {
    fontSize:   18,
    fontFamily: "Helvetica-Bold",
    color:      "#1C3A2B",
  },
  companyInfo: {
    fontSize:   9,
    color:      "#4A4A4A",
    marginTop:  3,
    lineHeight: 1.5,
  },
  contractTitle: {
    fontSize:   14,
    fontFamily: "Helvetica-Bold",
    color:      "#1A1A1A",
    textAlign:  "right",
  },
  sectionTitle: {
    fontSize:          9,
    fontFamily:        "Helvetica-Bold",
    color:             "#888780",
    textTransform:     "uppercase",
    letterSpacing:     0.8,
    marginBottom:      6,
    paddingBottom:     4,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom:  4,
  },
  col: { flex: 1 },
  label: {
    fontSize:     8,
    color:        "#888780",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color:    "#1A1A1A",
  },
  checkboxRow: {
    flexDirection: "row",
    flexWrap:      "wrap",
  },
  checkbox: {
    flexDirection: "row",
    alignItems:    "center",
    marginRight:   12,
    marginBottom:  4,
  },
  checkboxBox: {
    width:        10,
    height:       10,
    borderWidth:  1,
    borderColor:  "#D3D1C7",
    borderRadius: 2,
    marginRight:  4,
  },
  checkboxChecked: {
    width:           10,
    height:          10,
    backgroundColor: "#1C3A2B",
    borderRadius:    2,
    marginRight:     4,
  },
  checkboxLabel: {
    fontSize: 9,
    color:    "#4A4A4A",
  },
  descriptionBox: {
    borderWidth:     1,
    borderColor:     "#E5E7EB",
    borderRadius:    4,
    padding:         10,
    minHeight:       80,
    backgroundColor: "#F9F9F8",
  },
  descriptionText: {
    fontSize:   10,
    color:      "#1A1A1A",
    lineHeight: 1.6,
  },
  equipmentGrid: {
    flexDirection: "row",
    flexWrap:      "wrap",
  },
  equipmentItem: {
    flexDirection: "row",
    alignItems:    "center",
    width:         "33%",
    marginBottom:  4,
  },
  costTable: {
    borderWidth:  1,
    borderColor:  "#E5E7EB",
    borderRadius: 4,
    overflow:     "hidden",
  },
  costRow: {
    flexDirection:     "row",
    justifyContent:    "space-between",
    paddingVertical:   6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  costRowTotal: {
    flexDirection:     "row",
    justifyContent:    "space-between",
    paddingVertical:   8,
    paddingHorizontal: 10,
    backgroundColor:   "#1C3A2B",
  },
  costLabel: {
    fontSize: 10,
    color:    "#4A4A4A",
  },
  costValue: {
    fontSize:   10,
    color:      "#1A1A1A",
    fontFamily: "Helvetica-Bold",
  },
  costLabelTotal: {
    fontSize:   11,
    color:      "#FFFFFF",
    fontFamily: "Helvetica-Bold",
  },
  costValueTotal: {
    fontSize:   11,
    color:      "#C8922A",
    fontFamily: "Helvetica-Bold",
  },
  signatureSection: {
    marginTop:    16,
    padding:      12,
    borderWidth:  1,
    borderColor:  "#E5E7EB",
    borderRadius: 4,
  },
  legalText: {
    fontSize:   8,
    color:      "#888780",
    lineHeight: 1.5,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
    marginTop:         40,
    marginBottom:      4,
  },
  footer: {
    position:       "absolute",
    bottom:         30,
    left:           40,
    right:          40,
    flexDirection:  "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop:     8,
  },
  footerText: {
    fontSize: 8,
    color:    "#888780",
  },
});

const EQUIPMENT_LIST = [
  "Chipper", "Loader", "Mini Loader", "Climber",
  "Grapple", "Alturnamats", "Pole Pruner", "Pole Saw",
  "Ladder", "Hedge Trimmers", "Cones", "Lift",
];

const NOTE_CHECKBOXES: { key: keyof Quote; label: string }[] = [
  { key: "pending_hoa",      label: "Pending HOA"     },
  { key: "city_permit",      label: "City Permit"     },
  { key: "locate_811",       label: "811 Locate"      },
  { key: "main_lines",       label: "Main Lines"      },
  { key: "power_drop",       label: "Power Drop"      },
  { key: "arborist_onsite",  label: "Arborist Onsite" },
];

export default function QuotePDF({ quote }: { quote: Quote }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Gold accent bar */}
        <View style={styles.goldBar} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Gordon Pro Tree Service</Text>
            <Text style={styles.companyInfo}>
              {"5662 Cemetery Rd, Lula, GA 30554\n(770) 271-6072\ngordonprotreeservice.com"}
            </Text>
          </View>
          <View>
            <Text style={styles.contractTitle}>Contract Agreement</Text>
            <Text style={{ fontSize: 9, color: "#888780", textAlign: "right", marginTop: 4 }}>
              Date: {quote.date}
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{quote.customer_name}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{quote.customer_phone}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{quote.customer_email || "—"}</Text>
            </View>
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{quote.property_address}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Sales Rep</Text>
              <Text style={styles.value}>{quote.sales_rep || "—"}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Est. Hours</Text>
              <Text style={styles.value}>{quote.hours_estimate || "—"}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.checkboxRow}>
            {NOTE_CHECKBOXES.map(({ key, label }) => (
              <View key={key} style={styles.checkbox}>
                <View style={quote[key] ? styles.checkboxChecked : styles.checkboxBox} />
                <Text style={styles.checkboxLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Lead Source</Text>
              <Text style={styles.value}>{quote.lead_source || "—"}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Conditions</Text>
              <Text style={styles.value}>{quote.wet_dry?.toUpperCase() || "—"}</Text>
            </View>
          </View>
        </View>

        {/* Description of Work */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description of Work</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              {quote.description_of_work || "No description."}
            </Text>
          </View>
        </View>

        {/* Equipment */}
        {quote.equipment?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment Needed</Text>
            <View style={styles.equipmentGrid}>
              {EQUIPMENT_LIST.map((item) => (
                <View key={item} style={styles.equipmentItem}>
                  <View
                    style={
                      quote.equipment.includes(item)
                        ? styles.checkboxChecked
                        : styles.checkboxBox
                    }
                  />
                  <Text style={styles.checkboxLabel}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Cost Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Summary</Text>
          <Text style={{ fontSize: 8, color: "#888780", marginBottom: 6, fontStyle: "italic" }}>
            Price based on cash/check payments
          </Text>
          <View style={styles.costTable}>
            {quote.tree_services_cost > 0 && (
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Tree Services</Text>
                <Text style={styles.costValue}>${quote.tree_services_cost.toFixed(2)}</Text>
              </View>
            )}
            {quote.stump_removal_cost > 0 && (
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Stump Removal</Text>
                <Text style={styles.costValue}>${quote.stump_removal_cost.toFixed(2)}</Text>
              </View>
            )}
            {quote.discount > 0 && (
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Discount</Text>
                <Text style={[styles.costValue, { color: "#E24B4A" }]}>
                  -${quote.discount.toFixed(2)}
                </Text>
              </View>
            )}
            {quote.card_fee_applied && (
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>3% Card Fee</Text>
                <Text style={styles.costValue}>
                  ${(quote.total_cost * 0.03).toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.costRowTotal}>
              <Text style={styles.costLabelTotal}>Total Cost</Text>
              <Text style={styles.costValueTotal}>${quote.total_cost.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Customer Acceptance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Acceptance</Text>
          <View style={styles.signatureSection}>
            <Text style={styles.legalText}>
              By signing this agreement, I authorize Gordon Pro Tree Service to do the work as
              specified. I have read and agree to the terms and conditions. A cancellation charge
              of 20% of the total cost will apply if canceled due to no fault of GPTS.
            </Text>
            {quote.customer_signature ? (
              <View style={{ marginTop: 12 }}>
                <Image
                  src={quote.customer_signature}
                  style={{ height: 60, objectFit: "contain" }}
                />
                <View style={styles.signatureLine} />
                <Text style={{ fontSize: 8, color: "#888780", marginTop: 2 }}>
                  Signed{" "}
                  {quote.signed_at
                    ? new Date(quote.signed_at).toLocaleDateString()
                    : ""}
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 20 }}>
                <View style={styles.signatureLine} />
                <Text style={{ fontSize: 8, color: "#888780", marginTop: 2 }}>
                  Customer Signature
                </Text>
                <View style={[styles.signatureLine, { marginTop: 24 }]} />
                <Text style={{ fontSize: 8, color: "#888780", marginTop: 2 }}>
                  Date
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Gordon Pro Tree Service · (770) 271-6072</Text>
          <Text style={styles.footerText}>gordonprotreeservice.com</Text>
        </View>

      </Page>
    </Document>
  );
}
