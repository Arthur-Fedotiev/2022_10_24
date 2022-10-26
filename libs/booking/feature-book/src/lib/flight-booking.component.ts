import { Component } from '@angular/core';
import { RouterLinkWithHref, RouterOutlet } from '@angular/router';
import { CheckinComponent } from '@nx-example/luggage/feature-checkin';


@Component({
  standalone: true,
  selector: 'flight-booking',
  imports: [
    CheckinComponent,
    RouterOutlet,
    RouterLinkWithHref,
    // CheckinDomainModule
  ],
  templateUrl: './flight-booking.component.html',
})
export class FlightBookingComponent {}
