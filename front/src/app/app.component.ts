import { Component, Inject, OnInit, NgZone, ViewChild, ElementRef } from '@angular/core';
import { MatDateFormats } from '@angular/material/core';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MapsAPILoader } from '@agm/core';
import { FormControl } from '@angular/forms';
import { } from 'googlemaps';
import { HttpClient } from '@angular/common/http';
import { DarkSkyApi } from 'dark-sky-api';
import { Chart } from 'chart.js';
import * as moment from 'moment';
import { environment } from '../environments/environment.prod';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    data: Data = null;

    location = {
        latitude: Number.NaN,
        longitude: Number.NaN,
        location: ''
    };
    imperial = true;
    currentday: Forecast = null;

    sevenday: Forecast[] = [
    ];

    historical: Forecast[] = [
    ];

    minute: Forecast[] = [
    ];

    doughnutChartData = [
    ];

    doughnutChartLabels: String[] = [
    ];

    doughnutChartType = 'doughnut';

    doughnutColors: any[] = [
    ];

    chart = [];

    hourly: Forecast[] = [
    ];

    constructor(public dialog: MatDialog, private http: HttpClient) { }

    ngOnInit() {
        if (this.location.location === '') {
            this.openLocation();
        }
        console.log(this.location);
    }

    imperial_click() {
        if (this.imperial) {
            this.imperial = !this.imperial;
            this.currentday.currentTemp = this.convertToC(this.currentday.currentTemp);
            this.currentday.highTemp = this.convertToC(this.currentday.highTemp);
            this.currentday.lowTemp = this.convertToC(this.currentday.lowTemp);
            this.hourly.forEach(x => {
                x.highTemp = this.convertToC(x.highTemp);
            });
            this.historical.forEach(x => {
                x.highTemp = this.convertToC(x.highTemp);
                x.lowTemp = this.convertToC(x.lowTemp);
            });
            this.sevenday.forEach(x => {
                x.highTemp = this.convertToC(x.highTemp);
                x.lowTemp = this.convertToC(x.lowTemp);
            });
        } else {
            this.imperial = !this.imperial;
            this.currentday.currentTemp = this.convertToF(this.currentday.currentTemp);
            this.currentday.highTemp = this.convertToF(this.currentday.highTemp);
            this.currentday.lowTemp = this.convertToF(this.currentday.lowTemp);
            this.hourly.forEach(x => {
                x.highTemp = this.convertToF(x.highTemp);
            });
            this.historical.forEach(x => {
                x.highTemp = this.convertToF(x.highTemp);
                x.lowTemp = this.convertToF(x.lowTemp);
            });
            this.sevenday.forEach(x => {
                x.highTemp = this.convertToF(x.highTemp);
                x.lowTemp = this.convertToF(x.lowTemp);
            });
        }
    }

    convertToC(F: number) {
        return (F - 32) * 5 / 9;
    }

    convertToF(C: number) {
        return (C * 9 / 5) + 32;
    }

    getDay() {
        const url = `${environment.serverURL}/daily/${this.location.latitude}/${this.location.longitude}`;
        this.http.get<Data>(url).subscribe(data => {
            this.currentday = {
                day: 'Today',
                weather: this.getIcon(data.currently.icon),
                currentTemp: data.currently.temperature,
                highTemp: data.daily.data[0].temperatureHigh,
                lowTemp: data.daily.data[0].temperatureLow,
                precipitation: data.currently.precipProbability
            };

            data.hourly.data.forEach(x => {
                const date = new Date(x.time * 1000);
                let m = 'AM';
                let hour = date.getHours();
                if (hour > 12) {
                    hour -= 12;
                    m = 'PM';
                } else if (hour === 12) {
                    m = 'PM';
                } else if (hour === 0) {
                    hour = 12;
                }

                this.hourly.push({
                    day: hour + m,
                    weather: this.getIcon(x.icon),
                    highTemp: x.temperature,
                    precipitation: x.precipProbability * 100
                });
            });

            data.minutely.data.forEach(y => {
                /*this.minute.push({
                    day: '',
                    weather: '',
                    precipitation: x.precipProbability
                });*/
                const date = new Date(y.time * 1000);
                let hour = date.getHours();
                const minute = date.getMinutes();
                let m = 'AM';
                if (hour > 12) {
                    hour -= 12;
                    m = 'PM';
                } else if (hour === 12) {
                    m = 'PM';
                } else if (hour === 0) {
                    hour = 12;
                }

                const time = hour + ':' + minute;

                if (y.precipProbability === 0) {
                    y.precipProbability = y.precipProbability + .001;
                }

                this.doughnutChartData.push(y.precipProbability * 100);
                this.doughnutChartLabels.push(time + '-' + (y.precipProbability * 100) + '%');
            });

            this.chart = new Chart('canvas', {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: this.doughnutChartData,
                        labels: this.doughnutChartLabels
                    }]
                },
                options: {

                }
            });

            data.daily.data.forEach(z => {
                const date = new Date(z.time * 1000);
                const dow = date.getDay();
                let day = '';

                switch (dow) {
                    case 0:
                        day = 'Sunday';
                        break;
                    case 1:
                        day = 'Monday';
                        break;
                    case 2:
                        day = 'Tuesday';
                        break;
                    case 3:
                        day = 'Wednesday';
                        break;
                    case 4:
                        day = 'Thursday';
                        break;
                    case 5:
                        day = 'Friday';
                        break;
                    case 6:
                        day = 'Saturday';
                        break;
                }

                this.sevenday.push({
                    day: day,
                    weather: this.getIcon(z.icon),
                    highTemp: z.temperatureHigh,
                    lowTemp: z.temperatureLow,
                    precipitation: z.precipProbability * 100
                });
            });
        });
    }

    getHistory() {
        const times = [
            moment().subtract(7, 'd').unix(),
            moment().subtract(1, 'M').unix(),
            moment().subtract(1, 'y').unix(),
            moment().subtract(2, 'y').unix(),
            moment().subtract(3, 'y').unix(),
            moment().subtract(4, 'y').unix(),
            moment().subtract(5, 'y').unix(),
            moment().subtract(6, 'y').unix(),
            moment().subtract(7, 'y').unix(),
            moment().subtract(8, 'y').unix(),
            moment().subtract(9, 'y').unix(),
            moment().subtract(10, 'y').unix(),
        ];

        times.forEach(x => {
            const url = `${environment.serverURL}/history/${this.location.latitude}/${this.location.longitude}/${x}`;
            this.http.get<Data>(url).subscribe(data => {
                this.historical.push({
                    day: new Date(x * 1000).toDateString(),
                    weather: this.getIcon(data.currently.icon),
                    highTemp: data.daily.data[0].temperatureHigh,
                    lowTemp: data.daily.data[0].temperatureLow,
                    precipitation: data.currently.precipProbability
                });
            });
        });
    }

    getColor(percent: number) {
        if (percent === 0) {
            return 'rgba(255, 255, 255, 1)';
        }
        if (percent < 0.2) {
            return 'rgba(204, 204, 255, 1)';
        }
        if (percent < 0.4) {
            return 'rgba(102, 102, 255, 1)';
        }
        if (percent < 0.6)  {
            return 'rgba(51, 51, 255, 1)';
        }
        if (percent < 0.8) {
            return 'rgba(0, 0, 255, 1)';
        }
        return 'rgba()';
    }

    openLocation() {
        const dialogRef = this.dialog.open(LocationDialogComponent, {
            width: '500px'
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log(result);
            this.location = result;
            this.getDay();
            this.getHistory();
        });
    }

    getIcon(icon: String) {
        switch (icon) {
            case 'partly-cloudy-day':
            case 'partly-cloudy-night':
                return 'partlycloudy';
            case 'clear-day':
            case 'clear-night':
                return 'sunny';
            case 'wind':
            case 'fog':
                return 'fog';
            default:
                return icon;
        }
    }

    getAlertColor(level: String) {
        switch (level) {
            case 'watch':
                return 'accent';
            case 'warning':
                return 'warning';
            case 'advisory':
                return 'primary';
        }
    }

    getAlert(level: String) {
        switch (level) {
            case 'watch':
                return 'warning';
            case 'warning':
                return 'error';
            case 'advisory':
                return 'info';
        }
    }
}

export class Forecast {
    day: String;
    weather: String;
    currentTemp?: number;
    highTemp?: number;
    lowTemp?: number;
    precipitation: number;
}

export class Data {
    timezone: String;
    currently: {
        summary: String,
        icon: String,
        precipProbability: number,
        temperature: number,
        apparentTemperature: number
    };
    minutely: {
        summary: String,
        icon: String,
        data: {
            time: number
            precipProbability: number
        }[]
    };
    hourly: {
        summary: String,
        icon: String,
        data: {
            time: number,
            icon: String,
            precipProbability: number,
            temperature: number
        }[]
    };
    daily: {
        summary: String,
        data: {
            time: number,
            icon: String,
            precipProbability: number,
            temperatureHigh: number,
            temperatureLow: number,
        }[]
    };
    alerts: {
        title: String,
        regions: String[],
        severity: String,
        time: number,
        expires: number,
        description: String,
        uri: String
    }[];
}

@Component({
    selector: 'app-location-dialog',
    templateUrl: 'app.location.component.html'
})
export class LocationDialogComponent implements OnInit {
    dat = {
        latitude: 0,
        longitude: 0,
        location: ''
    };

    public searchControl: FormControl;
    public zoom: number;

    @ViewChild('search', { static: true })
    public searchElementRef: ElementRef;

    constructor(
        public dialogRef: MatDialogRef<LocationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private mapsAPILoader: MapsAPILoader,
        private ngZone: NgZone) {

    }

    ngOnInit() {
        this.searchControl = new FormControl();

        this.setCurrentPosition();

        this.mapsAPILoader.load().then(() => {
            const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
            });
            autocomplete.addListener('place_changed', () => {
                this.ngZone.run(() => {
                    const place: google.maps.places.PlaceResult = autocomplete.getPlace();

                    if (place.geometry === undefined || place.geometry === null) {
                        return;
                    }

                    this.dat.latitude = place.geometry.location.lat();
                    this.dat.longitude = place.geometry.location.lng();
                    this.dat.location = place.formatted_address;
                    this.zoom = 12;
                });
            });
        });
    }

    private setCurrentPosition() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                this.dat.latitude = position.coords.latitude;
                this.dat.longitude = position.coords.longitude;
                this.zoom = 12;
            });
        }
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
