// Protected routes token base
export const requireSignIn = (JWT) => async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({
      success: false,
      message: "Unauthorized Access",
    });
  }

  try {
    const decode = JWT.verify(
      req.headers.authorization,
      process.env.JWT_SECRET
    );
    req.user = decode;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).send({
      success: false,
      error,
      message: "Error in admin middleware",
    });
  }
};

//admin access
export const isAdmin = (userModel) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).send({
      success: false,
      message: "Unauthorized Access",
    });
  }
  try {
    const user = await userModel.findById(req.user._id);
    if (user.role !== 1) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized Access",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).send({
      success: false,
      error,
      message: "Error in admin middleware",
    });
  }
};
