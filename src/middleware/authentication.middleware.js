import { TokentypeEnum } from "../common/utlis/enums/security.enum.js";
import { conflictException, forbiddenException } from "../common/utlis/index.js";
import { decodeToken } from "../common/utlis/security/token.security.js";
import { login } from "../modules/auth/auth.service.js";



export const authentictaion = (tokenType = TokentypeEnum.Access) => {
  return async (req, res, next) => {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      throw conflictException({ message: "missing authentication key or invalid approach" });
    }
    const [schrma, credentaials] = authorizationHeader.split(" ");
    console.log({ schrma, credentaials, authorization: authorizationHeader });

    if (!schrma || !credentaials) {
      throw new Error("missing authentication key or invalid approach");
    }



    switch (schrma) {
      case "Basic":
        const [email, password] =
          Buffer.from(credentaials, "base64").toString()?.split(":") || [];
        await login({ email, password }, `${req.protocol}://${req.host}`);
        console.log({ email, password });

        break;
      case "Bearer":
        req.user = await decodeToken(credentaials, tokenType);
        break;
      default:
        throw conflictException({ message: "missing authentication schema" });
        break;
    }

    next();
  };
};


export const authorization = (accessRoles=[]) => {
  return async (req, res, next) => {
    if (!accessRoles.includes(req.user.role)) {
      throw forbiddenException({message:'Not authorized account'})
    }
    next();
  };
};


