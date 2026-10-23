export interface ProfileSettings {load(): string; save(nickname: string): void}
export const ProfileSettings = Symbol('ProfileSettings')
