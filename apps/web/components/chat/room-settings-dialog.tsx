"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/lib/auth-client";
import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { PrivacyToggle } from "@/components/rooms/privacy-toggle";

const roomSettingsSchema = z.object({
	name: z
		.string()
		.min(1, "Room name is required")
		.max(50, "Room name must be 50 characters or less"),
	description: z
		.string()
		.max(200, "Description must be 200 characters or less")
		.optional(),
	isPublic: z.boolean(),
});

type RoomSettingsFormValues = z.infer<typeof roomSettingsSchema>;

interface Room {
	id: string;
	name: string;
	description?: string | null;
	isPublic: boolean;
	createdById: string;
}

interface RoomSettingsDialogProps {
	room: Room;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function RoomSettingsDialog({
	room,
	open,
	onOpenChange,
}: RoomSettingsDialogProps) {
	const { data: session } = useSession();
	const isOwner = session?.user?.id === room.createdById;

	const form = useForm<RoomSettingsFormValues>({
		resolver: zodResolver(roomSettingsSchema),
		defaultValues: {
			name: room.name,
			description: room.description || "",
			isPublic: room.isPublic,
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: room.name,
				description: room.description || "",
				isPublic: room.isPublic,
			});
		}
	}, [open, room, form]);

	const utils = trpc.useUtils();
	const updateRoom = trpc.room.update.useMutation({
		onSuccess: () => {
			utils.room.getById.invalidate({ id: room.id });
			utils.room.list.invalidate();
			onOpenChange(false);
		},
		onError: (err) => {
			form.setError("root", {
				message: err.message || "Failed to update room",
			});
		},
	});

	const onSubmit = (values: RoomSettingsFormValues) => {
		updateRoom.mutate({
			id: room.id,
			name: values.name.trim(),
			description: values.description?.trim() || undefined,
			isPublic: values.isPublic,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Room Settings</DialogTitle>
					<DialogDescription>
						{isOwner
							? "Manage your room settings"
							: "View room settings (only the owner can edit)"}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						{form.formState.errors.root && (
							<div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
								{form.formState.errors.root.message}
							</div>
						)}

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Room Name</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g., General, Design, Engineering"
											maxLength={50}
											disabled={!isOwner}
											{...field}
										/>
									</FormControl>
									<FormDescription className="text-right">
										{field.value.length}/50
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Description{" "}
										<span className="text-muted-foreground font-normal">
											(optional)
										</span>
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder="What's this room about?"
											rows={3}
											maxLength={200}
											disabled={!isOwner}
											{...field}
										/>
									</FormControl>
									<FormDescription className="text-right">
										{field.value?.length || 0}/200
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{isOwner && (
							<FormField
								control={form.control}
								name="isPublic"
								render={({ field }) => (
									<FormItem>
										<PrivacyToggle
											isPublic={field.value}
											onChange={field.onChange}
										/>
									</FormItem>
								)}
							/>
						)}

						{!isOwner && (
							<div className="text-sm text-muted-foreground">
								Privacy:{" "}
								<span className="font-medium">
									{room.isPublic ? "Public" : "Private"}
								</span>
							</div>
						)}

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								{isOwner ? "Cancel" : "Close"}
							</Button>
							{isOwner && (
								<Button type="submit" disabled={updateRoom.isPending}>
									{updateRoom.isPending ? (
										<>
											<Loader2 className="size-4 animate-spin" />
											Saving...
										</>
									) : (
										"Save Changes"
									)}
								</Button>
							)}
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
