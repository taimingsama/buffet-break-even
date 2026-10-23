export type Destination = 'setup' | 'menu' | 'mine' | 'receipts' | 'records' | 'room' | 'custom-menu' | 'creator' | 'my-restaurants'

export interface BuffetNavigation {
    open(destination: Destination, mode?: 'push' | 'replace' | 'reset'): Promise<void>

    toOrderSlip(): Promise<void>

    toResult(receiptId?: string): Promise<void>

    toRecord(recordId: string): Promise<void>

    toCustomMenu(restaurantId?: string): Promise<void>

    toCustomDining(restaurantId?: string): Promise<void>

    toMenuPreview(previewId: string): Promise<void>

    back(fallback: Destination): Promise<void>
}

export const BuffetNavigation = Symbol('BuffetNavigation')
