export type Gender = "male" | "female";

export interface CustomerProfileResponse {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phoneNumber: string;
  readonly profileImageUrl: string | null;
  readonly dateOfBirth: string | null;
  readonly gender: Gender | null;
  readonly emailVerified: boolean;
  readonly createdAt: string;
}
