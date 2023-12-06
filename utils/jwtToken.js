// create token and saving this cookie
const sendToken = (user, statusCode,res)=>{
    const token = user.getJwtToken()

    // Option for cookies
    const option = {
        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "none",
        secure: true,
    }

    res.status(statusCode).cookie("token", token,option).json({
        success:true,
        user,
        token
    })
}

module.exports = sendToken

  