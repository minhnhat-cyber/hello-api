import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { errorResponse } from "@/lib/utils";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
const adminUser = process.env.ADMIN_USER;
const adminPass = process.env.ADMIN_PASS;
const DB_NAME = process.env.DB_NAME || "hello_api";

export async function POST(req) {
  let data;
  try {
    data = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }
  const { email: rawEmail, password } = data ?? {};
  const email = typeof rawEmail === "string" ? rawEmail.trim() : rawEmail;
  if (typeof email !== "string" || typeof password !== "string" || !email || !password.trim() || email.length > 254 || password.length > 1024) {
    return errorResponse("Missing email or password", 400);
  }
  try {
    if (email === adminUser && !checkAdmin(email, password)) {
      return errorResponse("Invalid email or password", 401);
    }
    const admin = checkAdmin(email, password);
    const user = !admin ? await checkUser(email, password) : admin;
    if (user) {

      // Generate JWT
      const token = getJwtToken(user);
      // Set JWT as HTTP-only cookie
      const response = NextResponse.json(
        {
          message: "Login successful",
          user: { id: String(user._id), email: user.email, username: user.username },
        },
        {
          status: 200,
          headers: corsHeaders,
        },
      );
      response.cookies.set("token", token, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: process.env.NODE_ENV === "production",
      });
      return response;
    } else {
      return errorResponse("Invalid email or password", 401);
    }
  } catch (error) {
    console.error("Login failed:", error.name);
    return errorResponse("Login Internal Error", 500);
  }
}

function checkAdmin(email, password) {
  if (!adminUser || !adminPass) return false;
  if (adminUser === email && adminPass === password)
    return {
      _id: "-1",
      email: email,
      username: "admin",
    };
  return false;
}
async function checkUser(email, password) {
  const client = await getClientPromise();
  const db = client.db(DB_NAME);
  const user = await db.collection("user").findOne({ email });
  if (!user) return false;
  return (await bcrypt.compare(password, user.password)) ? user : false;
}

function getJwtToken(user) {
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
  return token;
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
