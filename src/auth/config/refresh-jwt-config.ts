import { registerAs } from "@nestjs/config";
import { JwtSignOptions } from "@nestjs/jwt";



export default registerAs('refreshJwt',():JwtSignOptions=>({
    secret:process.env.JWT_REFRESH_SECRET,
    expiresIn:process.env.JWT_REFRESH_EXPIRE_IN
}))