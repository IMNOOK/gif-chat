const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Type: { ObejectId } } = Schema;
const chatSchema = new Schema({
	room: {
		type: ObjectId,
		required: true,
		ref: 'Room',
	},
	user: {
		type: String,
		required: true,
	},
	chat: String,
	gif: String,
	createdAt: {
		type: Date,
		default: Date.now,
	},
});