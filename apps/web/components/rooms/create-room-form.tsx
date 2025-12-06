"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
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
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { PrivacyToggle } from "./privacy-toggle";
import { RoomPreview } from "./room-preview";

const createRoomSchema = z.object({
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

type CreateRoomFormValues = z.infer<typeof createRoomSchema>;

export function CreateRoomForm() {
	const router = useRouter();
	const utils = trpc.useUtils();

	const form = useForm<CreateRoomFormValues>({
		resolver: zodResolver(createRoomSchema),
		defaultValues: {
			name: "",
			description: "",
			isPublic: true,
		},
	});

	const createRoom = trpc.room.create.useMutation({
		onSuccess: (room) => {
			if (room) {
				utils.room.list.invalidate();
				router.push(`/rooms/${room.id}`);
			}
		},
		onError: (err) => {
			form.setError("root", {
				message: err.message || "Failed to create room",
			});
		},
	});

	const onSubmit = (values: CreateRoomFormValues) => {
		createRoom.mutate({
			name: values.name.trim(),
			description: values.description?.trim() || undefined,
			isPublic: values.isPublic,
		});
	};

	const watchedValues = form.watch();

	return (
		<Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
			<CardContent className="p-8">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{form.formState.errors.root && (
							<div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-2">
								{form.formState.errors.root.message}
							</div>
						)}

						<RoomPreview
							name={watchedValues.name}
							description={watchedValues.description || ""}
							isPublic={watchedValues.isPublic}
						/>

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

						<div className="flex gap-3 pt-2">
							<Button variant="secondary" className="flex-1" asChild>
								<Link href="/rooms">Cancel</Link>
							</Button>
							<Button
								type="submit"
								className="flex-1"
								disabled={createRoom.isPending || !form.formState.isValid}
							>
								{createRoom.isPending ? (
									<>
										<Loader2 className="size-4 animate-spin" />
										Creating...
									</>
								) : (
									"Create Room"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
