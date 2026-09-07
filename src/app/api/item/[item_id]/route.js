import { verifyJWT } from '@/lib/auth';
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import {
  errorResponse,
  printExceptionLog,
  successResponse,
} from "@/lib/utils";
import { ObjectId } from "mongodb";

function toObjectId(itemId) {
  return ObjectId.isValid(itemId) ? new ObjectId(itemId) : null;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request, { params }) {
  if (!verifyJWT(request)) return errorResponse('Unauthorized Request', 401);
  const { item_id: itemId } = await params;
  const objectId = toObjectId(itemId);

  if (!objectId) return errorResponse("Invalid item id", 400);

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME || "hello_api");
    const item = await db.collection("item").findOne({
      _id: objectId,
      status: { $ne: "DELETED" },
    });

    if (!item) return errorResponse("Item not found", 404);
    return successResponse({ item }, 200);
  } catch (error) {
    printExceptionLog("GET Item", error);
    return errorResponse("GET Item Internal Error", 500);
  }
}

export async function DELETE(request, { params }) {
  if (!verifyJWT(request)) return errorResponse('Unauthorized Request', 401);
  const { item_id: itemId } = await params;
  const objectId = toObjectId(itemId);

  if (!objectId) return errorResponse("Invalid item id", 400);

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME || "hello_api");
    const updateResult = await db.collection("item").updateOne(
      {
        _id: objectId,
        status: { $ne: "DELETED" },
      },
      {
        $set: {
          status: "DELETED",
          deletedAt: new Date(),
        },
      },
    );

    if (updateResult.matchedCount === 0) {
      return errorResponse("Item not found or already deleted", 404);
    }

    return successResponse({ message: "Delete Success" }, 200);
  } catch (error) {
    printExceptionLog("DELETE Item", error);
    return errorResponse("DELETE Item Internal Error", 500);
  }
}

export async function PUT(request, { params }) {
  if (!verifyJWT(request)) return errorResponse('Unauthorized Request', 401);
  const { item_id: itemId } = await params;
  const objectId = toObjectId(itemId);

  if (!objectId) return errorResponse("Invalid item id", 400);

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
    const updateResult = await db.collection("item").updateOne(
      {
        _id: objectId,
        status: { $ne: "DELETED" },
      },
      {
        $set: {
          name,
          category,
          price,
          amount,
          updatedAt: new Date(),
        },
      },
    );

    if (updateResult.matchedCount === 0) {
      return errorResponse("Item not found", 404);
    }

    return successResponse({ message: "Item update success" }, 200);
  } catch (error) {
    printExceptionLog("PUT Item", error);
    return errorResponse("PUT Item Internal Error", 500);
  }
}
