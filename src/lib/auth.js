import jwt from 'jsonwebtoken';
export function verifyJWT(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if(!token) return null;
    const user = jwt.verify(token, process.env.JWT_SECRET, {algorithms:['HS256']});
    if(!user || typeof user !== 'object' || !user.id || !user.email) return null;
    return user;
  } catch { return null; }
}
export function isAdmin(request) {
  return String(verifyJWT(request)?.id) === '-1';
}
