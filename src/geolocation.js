export class Geolocation {
    get valid() {
        return this._valid;
    }

    get coord() {
        return this._coord;
    }

    onGeolocation = (info) => {
        // The browser returns geoinfo including accuracy, speed, heading...
        this._coord[0] = info.coords.longitude;
        this._coord[1] = info.coords.latitude;
        this._valid = true;
    }

    onError = (info) => {
        console.error("Could not read position", info);
        this._valid = false;
    }

    constructor() {
        this._coord = []
        this._coord[0] = this._coord[1] = 0
        this._valid = false;

        window.addEventListener('load', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    this.onGeolocation,
                    this.onError);
            } else {
                console.error("Geolocation not available");
            }
        });
    }
}
