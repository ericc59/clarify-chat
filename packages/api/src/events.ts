import { EventEmitter } from "node:events";

// Event types
export interface MessageEvent {
	type: "new" | "updated" | "deleted";
	roomId: string;
	message: {
		id: string;
		content: string;
		roomId: string;
		userId: string;
		createdAt: Date;
		updatedAt: Date;
		user: {
			id: string;
			name: string;
			image: string | null;
		};
	};
}

export interface RoomEvent {
	type: "member_joined" | "member_left" | "member_removed" | "room_deleted";
	roomId: string;
	userId: string;
	userName: string;
}

export interface RoomListEvent {
	type: "room_created" | "room_deleted";
	roomId: string;
	roomName: string;
	isPublic: boolean;
}

// Create a typed event emitter
class TypedEventEmitter extends EventEmitter {
	emitMessage(event: MessageEvent) {
		this.emit(`message:${event.roomId}`, event);
	}

	onMessage(roomId: string, handler: (event: MessageEvent) => void) {
		this.on(`message:${roomId}`, handler);
		return () => this.off(`message:${roomId}`, handler);
	}

	emitRoom(event: RoomEvent) {
		this.emit(`room:${event.roomId}`, event);
	}

	onRoom(roomId: string, handler: (event: RoomEvent) => void) {
		this.on(`room:${roomId}`, handler);
		return () => this.off(`room:${roomId}`, handler);
	}

	emitRoomList(event: RoomListEvent) {
		this.emit("room-list", event);
	}

	onRoomList(handler: (event: RoomListEvent) => void) {
		this.on("room-list", handler);
		return () => this.off("room-list", handler);
	}
}

// Singleton event emitter
export const ee = new TypedEventEmitter();
