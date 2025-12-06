import { ArrowLeft, Hash } from "lucide-react";
import Link from "next/link";

export default function RoomNotFound() {
	return (
		<div className="min-h-svh flex items-center justify-center p-8">
			<div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
				<div className="size-20 mx-auto rounded-2xl bg-accent/50 flex items-center justify-center mb-6">
					<Hash className="size-10 text-muted-foreground/50" />
				</div>
				<h1 className="text-4xl font-serif tracking-tight mb-2">
					Room not found
				</h1>
				<p className="text-muted-foreground mb-8 max-w-sm mx-auto">
					The room you&apos;re looking for doesn&apos;t exist or you don&apos;t
					have access to it.
				</p>
				<Link
					href="/rooms"
					className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
				>
					<ArrowLeft className="size-4" />
					Back to rooms
				</Link>
			</div>
		</div>
	);
}
