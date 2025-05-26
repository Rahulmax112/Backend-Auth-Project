const { updateProfile, getProfile } = require("../services/userService");

const updateUserProfiles = async (req, res) => {
  const userId = req.user.id;
  const { full_name, gender, dob, avatar_url, addresses } = req.body;

  try {
    console.log(req.body);

    const updateUserProfile = await updateProfile(userId, {
      full_name,
      gender,
      dob,
      avatar_url,
      addresses,
    });

    if (!updateUserProfile) {
      return res.status(400).json({ message: "Profile Update failed" });
    }

    res.status(200).json({
        success:true, 
        message:"User Update Sucessfully"
    })
  } catch (e) {
    console.error("GetProfile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserProfile = async (req, res) => {
    const userId = req.user.id;
    try{
    const getProfileInfo = await getProfile(userId);
    if(!getProfileInfo){
        res.status(400).json({message:"Failed to fetch profile"});
    }

    res.status(200).json({
        success:true,
        message:"User Sucessfully Fetched", 
        userProfileInfo: getProfileInfo
    })
    }catch(e){
      res.status(500).json({message:"Internal Servor error"});
    }
}

module.exports = { updateUserProfiles, getUserProfile };
