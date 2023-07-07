export interface ColorInterface {
    r: number,
    g: number,
    b: number,
    a?: number
}

export abstract class StyleHelper {
    static rgbaToString(color: ColorInterface) {
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a ?? 1})`;
    }
}