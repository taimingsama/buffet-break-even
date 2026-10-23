import {defineStore} from 'pinia'
import {readonly, ref} from 'vue'
import type {ProfileView} from '@/presentation/profile/ProfileView'

export const useProfileStore = defineStore('profile-view', () => {
    const name = ref('新手食客')
    return {nickname: readonly(name), present(nickname: string) {name.value = nickname}} satisfies ProfileView & {nickname: unknown}
})
