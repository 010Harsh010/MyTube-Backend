import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynHandler} from "../utils/asyncHandler.js"
import {uploadcloudinary} from "../utils/cloudinary.js"


const getAllVideos = asynHandler(async (req, res) => {
    const { userId } = req.params;
    const { sortBy = "createdAt", sortType = "desc", limit = 10 ,lastId=null} = req.query;
    // const skip = (page - 1) * limit;

    // Validate userId as a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(404, "Invalid User Id");
    }

    // Convert sortType to an integer (1 for asc, -1 for desc)
    const sortOrder = sortType === "asc" ? 1 : -1;

    // MongoDB aggregation query
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                ...(lastId && { _id: { $gt: new mongoose.Types.ObjectId(lastId) } }) 
            },
        },
        {
            $sort: {
                [sortBy]: sortOrder,
            },
        },
        // {
        //     $skip: parseInt(skip), // Skip first (page-1) * limit documents
        // },
        {
            $limit: parseInt(limit), // Limit the number of documents returned
        },
        {
            $project: {
                owner: 1,
                videoFile: 1,
                title: 1,
                createdAt: 1,
                duration: 1,
                videoFile:1,
                thumbnail:1,
                views:1,
            },
        },
    ]);
    if (!videos || videos.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No Videos Found"));
    }
    const lastid = videos[videos.length-1]._id;
    // Return the paginated video data
    return res.status(200).json(new ApiResponse(200,[videos,lastid], "Successful Query"));
});

const uploadVideo =asynHandler(async(req,res) => {
    // take require inputs {title,description,} -->
    // thumbnail uploaded by user and video also
    // duration access from cloudnary
    // set owner from user
    const {title,description}  = req.body;
    // check for require field
    if(
        [title,description].some((field) => {
            return field?.trim()===""
        })
    )
    {
        throw new ApiError(400,"All fields are required");
    }
    console.log(title);
    
    const videoLocalpath = await req.files?.videoFile[0].path;
    const thumbnailLocalPath = await req.files?.thumbnail[0].path;
    console.log(videoLocalpath);
    console.log(thumbnailLocalPath);
    if (!(videoLocalpath && thumbnailLocalPath)) {
        throw new ApiError(404,"Path Not Found");
    }
    const videocloud = await uploadcloudinary(videoLocalpath);
    const thumbnail = await uploadcloudinary(thumbnailLocalPath);

    // console.log(videocloud);
    // return  res.json({message:"Video uploaded successfully",data:videocloud,thumbnail:thumbnail})

    if (!(videocloud && thumbnail)) {
        throw new ApiError(500,"Error On Clouding");
    }
    const video =await Video.create({
        title,
        description,
        videoFile:videocloud.url,
        thumbnail: thumbnail.url,
        owner: req.user,
        duration: videocloud.duration
    })
    if (!video) {
        throw new ApiError(500,"Error while Uploading Data");
    }
    return res.status(200).json(
        new ApiResponse(200,video,"Video Uploaded Successfully")
    )
})

const getVideoById = asynHandler(async (req, res) => {
    const { getvideoid } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(getvideoid)) {
        return res.status(400).json({ error: "Invalid ID format" });
    }
    await Video.updateOne(
        { _id: new mongoose.Types.ObjectId(getvideoid) },
        { $inc: { views: 1 } } // Increment the views by 1
    );
    const video = await Video.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(getvideoid) }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner'
            }
        },
        {
            $unwind: {
                path: "$owner",
                preserveNullAndEmptyArrays: true // Handle cases with no owner
            }
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: 'owner._id',
                foreignField: 'channel',
                as: 'subscribers'
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" } // Calculate subscriber count
            }
        },
        {
            $lookup: {
                from: 'likes',
                localField: '_id',
                foreignField: 'entityId',
                as: "like"
            }
        },{
            $addFields: {
                likesCount: { $size: "$like" } // Calculate likes count
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                createdAt:1,
                thumbnail: 1,
                "owner.fullName": 1,
                "owner.avatar": 1,
                "owner._id":1,
                duration: 1,
                views: 1,
                subscribersCount: 1,
                likesCount: 1
            }
        }
    ]);

    // Handle case when no video is found
    if (!video || video.length === 0) {
        return res.status(404).json({ error: "Video Not Found" });
    }

    // Send the first video from the aggregation result
    return res.status(200).json({
        status: 200,
        data: video[0],
        message: "Video Details Received Successfully"
    });
});


const updateVideo=asynHandler(async(req,res)=>{
    const {videoid} = req.params;
    const {title,description}=req.body;
    if(!mongoose.Types.ObjectId.isValid(videoid)){
        throw new ApiError(404,"Invalid Video Id")
    }
    if (
        [title,description].some((field)=>{
            return field?.trim()===""
        })
    ) {
        throw new ApiError("Manadatory Fields Are require");
    }
    const videoLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    if (!(videoLocalPath && thumbnailLocalPath)) {
        throw new ApiError(404,"NO Path Found");
    }
    const videopath = await uploadcloudinary(videoLocalPath);
    const thumbnailpath =await uploadcloudinary(thumbnailLocalPath);
    if (!(videopath && thumbnailpath)) {
        throw new ApiError(500,"Cloud Error");
    }
    const video = await Video.findByIdAndUpdate(
        videoid,
        {
            $set: {
                title:title,
                description:description,
                video:videopath.url,
                thumbnail:thumbnailpath.url
            }
        },{
            new:true
        }
    );
    if (!video) {
        return new ApiError(500,"Cloud Update Error");
    }
    return res.status(200).json(
        new ApiResponse(200,video,"Video Update SuccessFully")
    )
})
// After deleting 
// TODO 1. delete all tweet ,comment ,like ,from playlist
const deleteVideo = asynHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(404,"Invalid video")
    }
    const video = await Video.deleteOne({ _id: new mongoose.Types.ObjectId(videoId) });
    if (!video) {
        throw new ApiError(404,"Not Deleted")
    }
    return res.status(200).json(
        new ApiResponse(200,video,"Video Deleted Successfully")
    )
})

const togglePublishStatus = asynHandler(async (req, res) => {
    const { videoid } = req.params
    if (!mongoose.Types.ObjectId.isValid(videoid)){
        throw new ApiError(404,"Invalid video")
    }
    const video = await Video.findById(videoid)
    if (!video) {
        throw new ApiError(408,"unable To Reach Video")
    }
    video.isPublished = !video.isPublished;
    const done =await video.save();
    if (!done) {
        throw new ApiError(500,"Video cannot be Published")
    }
    return res.status(200).json(
        new ApiResponse(200,video,"Video Published/UnPublish Status Updated Successfully")
    )
})

const dataVideos = asynHandler(async (req, res) => {
    const { page = 1, limit = 10, prevId = null } = req.query;
  
    // Convert page and limit to integers
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
  
    const matchCriteria = {
      isPublished: true,
      ...(prevId ? { _id: { $gt: new mongoose.Types.ObjectId(prevId) } } : {})
    };
  
    const videos = await Video.aggregate([
      { $match: matchCriteria },
      { $sort: { createdAt: -1 } },
      { $limit: limitInt },
      {
        $lookup: {
          from: 'users', // Collection name for user data
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerDetails'
        }
      },
      { $unwind: '$ownerDetails' }, // Unwind the ownerDetails array to get individual objects
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          videoUrl: 1,
          isPublished: 1,
          createdAt: 1,
          views:1,
          duration:1,
          thumbnail:1,
          updatedAt: 1,
          'owner.fullName': '$ownerDetails.fullName',
          'owner.avatar': '$ownerDetails.avatar'
        }
      }
    ]);
  
    if (videos.length === 0) {
      throw new ApiError(404, 'No Videos');
    }
  
    const nextPrevId = videos[videos.length - 1]._id;
  
    return res.status(200).json(
      new ApiResponse(200, [videos, nextPrevId], 'Videos Retrieved Successfully')
    );
  });
  

export {
    uploadVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos,
    dataVideos
}