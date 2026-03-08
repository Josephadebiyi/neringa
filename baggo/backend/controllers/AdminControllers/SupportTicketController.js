import SupportTicket from '../../models/SupportTicketModel.js';

export const getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({})
            .populate('user', 'firstName lastName email profileImage')
            .populate('assignedTo', 'fullName')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('user', 'firstName lastName email profileImage')
            .populate('assignedTo', 'fullName');

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        const { status, priority, assignedTo } = req.body;
        const ticket = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            { status, priority, assignedTo },
            { new: true }
        );
        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addTicketMessage = async (req, res) => {
    try {
        const { content, sender, senderId } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        ticket.messages.push({
            sender,
            senderId,
            content,
            timestamp: new Date()
        });

        // Automatically set to IN_PROGRESS when admin replies
        if (sender === 'ADMIN') {
            ticket.status = 'IN_PROGRESS';
        }

        await ticket.save();
        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
