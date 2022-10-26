import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FlightFilter } from '@nx-example/booking/domain';
import { filter, map, Observable, scan, Subject, takeUntil, tap } from 'rxjs';

enum SearchFlightActions {
  FlightSearched = 'FlightSearched',
}

class LocalState {
  constructor(
    public readonly filters: FlightFilter[] = [],
    public readonly selectedFilter: FlightFilter | null = null
  ) {}
}

interface Action {
  type: SearchFlightActions;
  payload?: any;
}

@Component({
  selector: 'flight-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './flight-filter.component.html',
  styleUrls: ['./flight-filter.component.css'],
})
export class FlightFilterComponent implements OnInit, OnDestroy {
  @Output() searchTrigger = new EventEmitter<FlightFilter>();

  private readonly destroy$ = new Subject<void>();

  readonly filterForm = this.fb.nonNullable.group({
    from: ['', Validators.required],
    to: ['', Validators.required],
    urgent: [false],
  });

  readonly selectedFilter: FormControl<FlightFilter | null> = new FormControl(
    null
  );

  private readonly filtersStateActionsSubj$ = new Subject<Action>();

  private readonly filtersState$: Observable<LocalState> =
    this.filtersStateActionsSubj$.asObservable().pipe(
      scan(
        (state: LocalState, action: Action) =>
          this.filterStateReducer(state, action),
        new LocalState()
      ),
      takeUntil(this.destroy$)
    );

  private readonly updateFilterForm$ = this.selectedFilter.valueChanges.pipe(
    filter(Boolean),
    tap((filter: FlightFilter) => {
      this.filterForm.patchValue(filter);
    }),
    takeUntil(this.destroy$)
  );

  public readonly selectFilters$ = this.filtersState$.pipe(
    map((state) => state.filters)
  );

  private readonly updateSelectedFilter$ = this.selectFilters$.pipe(
    filter(Boolean),
    tap((filters: FlightFilter[]) => {
      this.selectedFilter.patchValue(filters[filters.length - 1], {
        emitEvent: false,
      });
    }),
    takeUntil(this.destroy$)
  );

  // @Input() set filter(filter: FlightFilter) {
  //   this.filterForm.patchValue(filter);
  // }

  constructor(private readonly fb: FormBuilder) {}

  ngOnDestroy(): void {
    this.releaseResources();
  }
  ngOnInit(): void {
    this.initListeners();
  }

  public search(): void {
    this.filtersStateActionsSubj$.next({
      type: SearchFlightActions.FlightSearched,
      payload: this.filterForm.getRawValue(),
    });

    this.searchTrigger.emit(this.filterForm.getRawValue());
  }

  private filterStateReducer(state: LocalState, action: Action): LocalState {
    switch (action.type) {
      case SearchFlightActions.FlightSearched:
        return {
          ...state,
          filters: state.filters.some(
            (filter) =>
              filter.from === action.payload.from &&
              filter.to === action.payload.to
          )
            ? state.filters
            : [...state.filters, action.payload],
        };

      default:
        return state;
    }
  }

  private initListeners(): void {
    this.filtersState$.subscribe();
    this.updateFilterForm$.subscribe();
    this.updateSelectedFilter$.subscribe();
  }

  private releaseResources(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
