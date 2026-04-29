import { NextResponse } from "next/server";

const defaults = {
  businessName:             "Gordon Pro Tree Service",
  businessPhone:            "(770) 271-6072",
  businessEmail:            "admin@gordonprotree.com",
  businessAddress:          "5662 Cemetery Rd, Lula, GA 30554",
  website:                  "https://gordonprotreeservice.com",
  fieldAppUrl:              process.env.NEXT_PUBLIC_FIELD_APP_URL ?? "",
  counties:                 ["Hall", "Gwinnett", "Forsyth", "Barrow", "Jackson", "North Fulton"],
  serviceRadius:            "50",
  cardFeePercent:           3,
  cancellationFeePercent:   20,
  defaultSalesRep:          "",
  notifications: {
    newSubmission:  true,
    jobStatusChange: true,
    quoteAccepted:  true,
    newMessage:     true,
  },
};

export async function GET() {
  return NextResponse.json(defaults);
}

export async function POST(req: Request) {
  const body = await req.json();
  console.log("[settings] save:", JSON.stringify(body, null, 2));
  return NextResponse.json({ success: true });
}
