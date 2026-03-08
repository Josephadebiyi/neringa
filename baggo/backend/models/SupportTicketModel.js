import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ["SHIPMENT", "PAYMENT", "ACCOUNT", "OTHER"],
        default: "OTHER",
    },
    status: {
        type: String,
        enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
        default: "OPEN",
    },
    priority: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
        default: "MEDIUM",
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
    messages: [{
        sender: {
            type: String,
            enum: ["USER", "ADMIN"],
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        }
    }]
}, {
    timestamps: true,
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
