import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true // Corrected from required:String to required:true
    }
}, { // Fixed the syntax error in options object
    timestamps: true // Optional: adds createdAt and updatedAt fields
});

// Create and export the model
const Admin = mongoose.model('Admin', adminSchema);
export default Admin;