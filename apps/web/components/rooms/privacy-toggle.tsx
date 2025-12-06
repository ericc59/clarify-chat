"use client";

import { Globe, Lock } from "lucide-react";

interface PrivacyToggleProps {
	isPublic: boolean;
	onChange: (isPublic: boolean) => void;
}

export function PrivacyToggle({ isPublic, onChange }: PrivacyToggleProps) {
	return (
		<div className="space-y-3">
			<label
				htmlFor="privacy"
				className="text-sm font-medium text-foreground/80"
			>
				Privacy
			</label>
			<div className="grid grid-cols-2 gap-3">
				<button
					type="button"
					onClick={() => onChange(true)}
					className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
						isPublic
							? "border-primary bg-primary/5"
							: "border-border/50 hover:border-border"
					}`}
				>
					<Globe
						className={`size-5 ${isPublic ? "text-primary" : "text-muted-foreground"}`}
					/>
					<div className="text-left">
						<p className={`font-medium text-sm ${isPublic ? "text-primary" : ""}`}>
							Public
						</p>
						<p className="text-xs text-muted-foreground">Anyone can join</p>
					</div>
				</button>
				<button
					type="button"
					onClick={() => onChange(false)}
					className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
						!isPublic
							? "border-primary bg-primary/5"
							: "border-border/50 hover:border-border"
					}`}
				>
					<Lock
						className={`size-5 ${!isPublic ? "text-primary" : "text-muted-foreground"}`}
					/>
					<div className="text-left">
						<p className={`font-medium text-sm ${!isPublic ? "text-primary" : ""}`}>
							Private
						</p>
						<p className="text-xs text-muted-foreground">Invite only</p>
					</div>
				</button>
			</div>
		</div>
	);
}
