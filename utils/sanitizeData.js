// عشان احدد ايه الداتا اللي ممكن ترجع هستخدم الفنكشن sanitize

exports.sanizeUser=function(user){
  return{
    _id:user._id,
    name:user.name,
    email:user.email
  }
}