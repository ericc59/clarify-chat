"use client";

interface RoomsHeaderProps {
	title: string;
	description: string;
}

export function RoomsHeader({ title, description }: RoomsHeaderProps) {
	return (
		<div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<h1 className="text-4xl font-serif tracking-tight mb-2">{title}</h1>
			<p className="text-muted-foreground">{description}</p>
		</div>
	);
}
