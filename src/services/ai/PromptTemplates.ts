export const SYSTEM_MAIN_INSTRUCTION = `You are the SAP Procurement AI Co-pilot, an expert AI assistant integrated into a Fortune 500 company's S/4HANA ERP instance. 

OPERATIONAL DIRECTIVES:
1. You assist the Procurement Director, managers, and buyers in auditing transactional records, comparing vendors, reviewing compliance alerts, and analyzing invoices.
2. You have direct access to S/4HANA Purchase Orders, Invoices, Vendor catalogs, and document attachments.
3. Format all responses using professional Markdown. Use headings (###), bold styling, lists, and tabular layouts (| Column | Column |) where appropriate to make data easy to digest.
4. Adopt a professional, concise, and analytical enterprise tone. Avoid generic introductory filler. Start directly with the analysis.
5. Highlight alerts, warnings, or action points using clear emojis (🔴 Red for blockages/overdue, 🟡 Yellow for reviews/risks, 🟢 Green for verified compliance).`;

export const PromptTemplates = {
  /**
   * Generates a prompt for Purchase Order detailed analysis
   */
  poAnalysis: (poJson: string): string => {
    return `Perform a detailed S/4HANA audit and risk assessment on the following Purchase Order data:

PO DATA:
${poJson}

INSTRUCTIONS:
1. Summarize the PO header details (PO #, cost center department, vendor, total amount, dates).
2. Review the line items table. Check if pricing looks reasonable or if there is variance.
3. Evaluate the current workflow stage (Draft, Approvals, Issued, Delivered). Specify the next required action.
4. Flag any operational risks (e.g. if the delivery date is past due or vendor status is suspended).`;
  },

  /**
   * Generates a prompt for Invoice auditing (3-way matching)
   */
  invoiceAnalysis: (invoiceJson: string, poJson?: string): string => {
    return `Perform a 3-way matching audit on the following Invoice and reference Purchase Order data:

INVOICE DATA:
${invoiceJson}

${poJson ? `CORRESPONDING PO REFERENCE:\n${poJson}` : 'NO CORRESPONDING PO REFERENCE LOCATED IN S/4HANA.'}

INSTRUCTIONS:
1. Execute a 3-Way Match Check (compare Invoice Amount, PO Amount, and Receipts/Deliveries).
2. Report any variances in unit price, item quantities, or totals.
3. If no PO is linked, flag this as an "Unassociated Spend Exception" and suggest compliance reviews.
4. Specify whether this invoice should be approved for disbursement, put on hold, or rejected.`;
  },

  /**
   * Generates a prompt for Vendor Scorecard Comparison
   */
  vendorComparison: (vendorsJson: string): string => {
    return `Generate a supplier comparison matrix and routing recommendation based on the following Vendor records:

VENDORS DATA:
${vendorsJson}

INSTRUCTIONS:
1. Construct a Markdown table comparing the selected vendors based on Category, YTD Spend, Performance Score, Delivery Rate, and Risk Index.
2. Identify the highest performing vendor and the most logistically stable partner.
3. Flag any suspended or under-review partners.
4. Give a clear recommendation on how to distribute upcoming purchase requisitions.`;
  },

  /**
   * Generates a prompt for Procurement Performance Report
   */
  reportGeneration: (kpisJson: string, recentSpendJson: string): string => {
    return `Generate a comprehensive Quarterly Procurement Performance Report using the following ERP dashboard summaries:

PROCUREMENT KPIs:
${kpisJson}

RECENT TRANSACTIONS SPEND:
${recentSpendJson}

INSTRUCTIONS:
1. Provide a Spend Summary (Total Outlay, Spend by Cost Center).
2. Analyze cost savings secured (current rate vs targets).
3. Evaluate operational efficiencies (cycle times, automation ratios).
4. Outline 3 strategic optimization recommendations for Q3 (e.g., consolidating suppliers, automating approvals).`;
  },

  /**
   * Generates a prompt for Procurement Corporate Policy queries
   */
  policyQuestion: (question: string): string => {
    return `Answer the following corporate procurement policy question. Apply standard global compliance rules (SOX, internal audit controls, signing authorities):

USER INQUIRY:
${question}

INSTRUCTIONS:
1. Address the question directly. Specify the relevant signing authority thresholds (e.g. Director approval up to $250k).
2. Emphasize compliance controls (3-way matching, segregation of duties, vendor vetting).
3. Format the guide with clear section headers.`;
  },

  /**
   * Generates a prompt for Vendor Risk Analysis
   */
  riskAnalysis: (vendorJson: string, activePOsJson: string): string => {
    return `Perform a supply-chain risk analysis for the following supplier:

VENDOR RECORD:
${vendorJson}

ACTIVE IN-FLIGHT REQUISITIONS:
${activePOsJson}

INSTRUCTIONS:
1. Assess the risk level based on the vendor risk score, past performance, and active PO count.
2. Check if the supplier status represents a single point of failure.
3. Formulate a mitigation plan (e.g. shift 30% allocation to alternative partner, run credit reviews).`;
  }
};
