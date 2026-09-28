import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
    userId :{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    body:{
        type: String,
        default: "",
    },
    likes:{
        type: [String],
        default: [],
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },
    updatedAt:{
        type: Date,
        default: Date.now,
    },
    media:{
        type: String,
        default: "",
    },
    active:{
        type: Boolean,
        default: true,
    },
    fileType:{
        type: String,
        default: "",
    },
})

const Post = mongoose.model("Post", PostSchema);

export default Post;