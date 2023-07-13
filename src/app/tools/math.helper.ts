import {CoordinateInterface} from "@models";

export class MathHelper {
    static clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(min, value), max);
    }

    static isBetween(value: number, min: number, max: number) {
        return Math.min(Math.max(min, value), max) === value;
    }

    static round(value: number, decimal: number = 2) {
        return Math.round(value * Math.pow(10, decimal)) / Math.pow(10, decimal);
    }

    static floor(value: number, decimal: number = 2) {
        return Math.floor(value * Math.pow(10, decimal)) / Math.pow(10, decimal);
    }

    static ceil(value: number, decimal: number = 2) {
        return Math.ceil(value * Math.pow(10, decimal)) / Math.pow(10, decimal);
    }

    static inCircle(point: CoordinateInterface, center: CoordinateInterface, r: number) {
        const dist_points
            = Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2);
        return dist_points <= Math.pow(r, 2);
    }

    static center(points: CoordinateInterface[]) {
        if (points.length < 2) {
            return null;
        }

        const total = points.reduce((total, point) => ({
            x: MathHelper.round(total.x + point.x),
            y: MathHelper.round(total.y + point.y)
        }), {x: 0, y: 0})
        return {
            x: MathHelper.round(total.x / points.length),
            y: MathHelper.round(total.y / points.length)
        }
    }

    /**
     * @param lat1
     * @param lon1
     * @param lat2
     * @param lon2
     * https://www.movable-type.co.uk/scripts/latlong.html
     */
    static distance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    }

    static flatDistance(pointA: CoordinateInterface, pointB: CoordinateInterface) {
        return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y)
    }
}
