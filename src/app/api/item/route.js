import { verifyJWT } from '@/lib/auth';
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

export async function GET(request) {
  if (!verifyJWT(request)) return errorResponse('Unauthorized Request', 401);
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
  if (!verifyJWT(request)) return errorResponse('Unauthorized Request', 401);
  try {
    let data;
    try { data = await request.json(); } catch { return errorResponse("Invalid JSON body", 400); }
    const { name, category, price, amount } = data ?? {};

    if (typeof name !== "string" || !name.trim() || typeof category !== "string" || !category.trim() || typeof price !== "number" || !Number.isFinite(price) || price < 0 || !Number.isInteger(amount) || amount < 0) {
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
