/**
 * Utility to identify special owner account for RGB text effects
 * Chỉ cần thay đổi ID ở đây là active/deactive hiệu ứng toàn bộ website
 */
export const OWNER_USER_ID = "9ad005f8-a5a8-4391-80ee-7f18698dd65b";

export function isOwner(userId?: string): boolean {
    return userId === OWNER_USER_ID;
}

/**
 * Returns the CSS class for the owner's display name.
 * Nếu là owner thì trả về 'rgb-text', nếu không thì trả về class bình thường.
 */
export function getOwnerClass(userId?: string, defaultClass: string = ""): string {
    return isOwner(userId) ? "rgb-text" : defaultClass;
}