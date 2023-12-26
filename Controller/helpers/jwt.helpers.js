import { SignJWT,jwtVerify } from "jose";
import dotenv,{config} from "dotenv";
import passport from "passport";
import { Strategy as BearerStrategy } from "passport-http-bearer";

// Llamar variables de entorno
config("../");
console.log(process.env.JWT_KEY);

// Configurar la estrategia de autenticacion Bearer

passport.use(
    new BearerStrategy(
        async (token,done)=>{
            try {
                const enconder = new TextEncoder();
                const { payload } = await jwtVerify(token,enconder.encode(process.env.JWT_KEY));
                return done(null,true);
            } catch (error) {
                return done(error,false);
            }
        }
    )
);

export function requireRole(role) {
    return (req,res,next)=>{
        passport.authenticate(
            "bearer",{session:false},(err,user)=>{
                if (err) {
                    return res.status(401).json({status:401,message:"Unauthorized"});
                }
                if (!user) {
                    return res.status(401).json({status:401,message:"Unauthorized"});
                }
                if (user.role !== role) {
                    return res.status(403).json({status:403,message:"Forbidden"});
                }
                req.user = user;
                next();
            }
        )(req,res,next);
    }
};

export async function validarToken(req,res,next) {
    try {
        const enconder = new TextEncoder();
        const {payload} = await jwtVerify(
            req.headers.authorization.split(" ")[1],
            enconder.encode(process.env.JWT_KEY)
        );
        if (payload.role == "admin" || payload.role == "student") {
            req.user = payload;
            return next();
        }else{
            res.status(404).json({status:404,message:"Not found"})
        }
    } catch (error) {
        console.error(error);
        return res.status(401).json({status:401,message:"Unauthorized"});
    }
}

export async function crearToken(req,res) {
    const enconder = new TextEncoder();
    if (req.body.role == "admin" || req.body.role == "student") {
        const jwtConstructor = await new SignJWT(req.body).setProtectedHeader({alg:"HS256",typ:"JWT"}).setIssuedAt().setExpirationTime("1h").sign(enconder.encode(process.env.JWT_KEY));
        res.status(200).json({status:200,token:jwtConstructor});
    }else{
        res.status(400).json({status:400,message:"Invalid Credentials required"})
    }
}