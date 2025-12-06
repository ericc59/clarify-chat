import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@workspace/db/client";
import { UserService } from "../../services/user.js";
import type { SessionUser } from "../../validators/session.js";
import { cleanupAllTestData, createTestUser } from "../helpers.js";

describe("UserService", () => {
	let testUser1: Awaited<ReturnType<typeof createTestUser>>;
	let testUser2: Awaited<ReturnType<typeof createTestUser>>;
	let sessionUser1: SessionUser;

	beforeAll(async () => {
		testUser1 = await createTestUser({ name: "User Service Test User 1" });
		testUser2 = await createTestUser({ name: "User Service Test User 2" });

		sessionUser1 = {
			id: testUser1.id,
			name: testUser1.name,
			email: testUser1.email,
			image: testUser1.image,
		};
	});

	afterAll(async () => {
		await cleanupAllTestData(testUser1.id);
		await cleanupAllTestData(testUser2.id);
	});

	describe("getMe", () => {
		test("should get current user's full profile", async () => {
			const user = await UserService.getMe(db, testUser1.id);

			expect(user).toBeDefined();
			expect(user!.id).toBe(testUser1.id);
			expect(user!.name).toBe("User Service Test User 1");
			expect(user!.email).toBe(testUser1.email);
		});

		test("should return null for non-existent user", async () => {
			const user = await UserService.getMe(db, "non-existent-user-id");
			expect(user).toBeNull();
		});
	});

	describe("getById", () => {
		test("should get user by id with public fields", async () => {
			const user = await UserService.getById(db, testUser2.id);

			expect(user).toBeDefined();
			expect(user!.id).toBe(testUser2.id);
			expect(user!.name).toBe("User Service Test User 2");
			expect(user!.email).toBe(testUser2.email);
			expect(user!.createdAt).toBeDefined();
		});

		test("should return null for non-existent user", async () => {
			const user = await UserService.getById(db, "non-existent-user-id");
			expect(user).toBeNull();
		});
	});

	describe("updateProfile", () => {
		test("should update user's name", async () => {
			const updated = await UserService.updateProfile(
				db,
				{ name: "Updated Service Name" },
				sessionUser1,
			);

			expect(updated).toBeDefined();
			expect(updated!.name).toBe("Updated Service Name");

			// Restore original name for other tests
			await UserService.updateProfile(
				db,
				{ name: "User Service Test User 1" },
				{ ...sessionUser1, name: "Updated Service Name" },
			);
		});

		test("should update user's image", async () => {
			const updated = await UserService.updateProfile(
				db,
				{ image: "https://example.com/avatar.png" },
				sessionUser1,
			);

			expect(updated).toBeDefined();
			expect(updated!.image).toBe("https://example.com/avatar.png");

			// Restore original image
			await UserService.updateProfile(
				db,
				{ image: null },
				{ ...sessionUser1, image: "https://example.com/avatar.png" },
			);
		});

		test("should update both name and image", async () => {
			const updated = await UserService.updateProfile(
				db,
				{ name: "New Name", image: "https://example.com/new-avatar.png" },
				sessionUser1,
			);

			expect(updated!.name).toBe("New Name");
			expect(updated!.image).toBe("https://example.com/new-avatar.png");

			// Restore original values
			await UserService.updateProfile(
				db,
				{ name: "User Service Test User 1", image: null },
				{
					...sessionUser1,
					name: "New Name",
					image: "https://example.com/new-avatar.png",
				},
			);
		});

		test("should keep existing values when not provided", async () => {
			const original = await UserService.getMe(db, testUser1.id);

			const updated = await UserService.updateProfile(db, {}, sessionUser1);

			expect(updated!.name).toBe(original!.name);
		});
	});

	describe("search", () => {
		test("should find users by name", async () => {
			const results = await UserService.search(db, {
				query: "User Service Test",
				limit: 10,
			});

			expect(results.length).toBeGreaterThanOrEqual(2);
			const foundNames = results.map((u) => u.name);
			expect(foundNames).toContain("User Service Test User 1");
			expect(foundNames).toContain("User Service Test User 2");
		});

		test("should find users by partial name match", async () => {
			const results = await UserService.search(db, {
				query: "Service Test User 1",
				limit: 10,
			});

			expect(results.length).toBeGreaterThanOrEqual(1);
			const found = results.find((u) => u.id === testUser1.id);
			expect(found).toBeDefined();
		});

		test("should find users by email", async () => {
			const results = await UserService.search(db, {
				query: testUser1.email.split("@")[0]!,
				limit: 10,
			});

			const found = results.find((u) => u.id === testUser1.id);
			expect(found).toBeDefined();
		});

		test("should respect limit parameter", async () => {
			const results = await UserService.search(db, {
				query: "User Service Test",
				limit: 1,
			});

			expect(results.length).toBe(1);
		});

		test("should return empty array for no matches", async () => {
			const results = await UserService.search(db, {
				query: "xyznonexistentuser123",
				limit: 10,
			});

			expect(results.length).toBe(0);
		});

		test("should return correct user fields", async () => {
			const results = await UserService.search(db, {
				query: testUser1.name,
				limit: 1,
			});

			if (results.length > 0) {
				const user = results[0]!;
				expect(user.id).toBeDefined();
				expect(user.name).toBeDefined();
				expect(user.email).toBeDefined();
				// image can be null
				expect("image" in user).toBe(true);
			}
		});
	});
});
