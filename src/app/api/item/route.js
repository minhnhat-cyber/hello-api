import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import {
  errorResponse,
  printExceptionLog,
  successResponse,
} from "@/lib/utils";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME || "hello_api");
    const itemList = await db
      .collection("item")
      .find({ status: { $ne: "DELETED" } })
      .toArray();

    return successResponse({ itemList }, 200);
  } catch (error) {
    printExceptionLog("GET Items", error);
    return errorResponse("GET Item Internal Error", 500);
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { name, category, price, amount } = data;

    if (!name || !category || price === undefined || amount === undefined) {
      return errorResponse(
        "name, category, price and amount are required",
        400,
      );
    }

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME || "hello_api");
    const insertResult = await db.collection("item").insertOne({
      name,
      category,
      price,
      amount,
      status: "ACTIVE",
      createdAt: new Date(),
    });

    return successResponse({ id: insertResult.insertedId }, 201);
  } catch (error) {
    printExceptionLog("POST Items", error);
    return errorResponse("POST Item Internal Error", 500);
  }
}
