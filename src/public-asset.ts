/** Resolve public files under either the root Site or the GitHub Pages base. */
export const publicAsset = (path:string) => import.meta.env.BASE_URL + path.replace(/^\/+/, '');
