import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  email: string;
}

export function getUserIdFromJwt(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  return decoded.userId;
}
