import type {ProfileSettings} from './ProfileSettings'
import type {ProfileView} from '@/presentation/profile/ProfileView'
import {generateNickname} from './generateNickname'

export class UniProfileSettings implements ProfileSettings {
    constructor(private readonly view: ProfileView) {}
    load() {
        const stored = uni.getStorageSync('buffet-profile-nickname-v1')
        const nickname = typeof stored === 'string' ? stored.trim() : ''
        if (!nickname || nickname.length > 20) {
            const generated = generateNickname()
            this.save(generated)
            return generated
        }
        this.view.present(nickname)
        return nickname
    }
    save(value: string) {
        const nickname = value.trim()
        if (!nickname || nickname.length > 20) throw new Error('昵称需为1至20个字符')
        try {uni.setStorageSync('buffet-profile-nickname-v1', nickname)} catch {throw new Error('昵称保存失败，请检查存储空间后重试')}
        this.view.present(nickname)
    }
}
