
import User from '../../models/userScheme.js';


export  const     analystic    = async( req,res, next)=>{

    const   users = await  User.find()
     res.status(200).json({
        success:true,
        error:false,
         data:users
     })
}