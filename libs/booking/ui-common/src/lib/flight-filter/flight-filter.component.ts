import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FlightFilter } from '@nx-example/booking/domain';
import { filter, map, Observable, scan, Subject, takeUntil, tap } from 'rxjs';

enum SearchFlightActions {
  FlightSearched = 'FlightSearched',
  FilterSelected = 'FilterSelected',
}

class LocalState {
  constructor(
    public readonly filters: FlightFilter[] = [],
    public readonly selectedFilter: FlightFilter | null = null
  ) {}
}

interface Action<T = any> {
  type: SearchFlightActions;
  payload: T;
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

  readonly filterForm = this.fb.group({
    from: ['', Validators.required],
    to: ['', Validators.required],
    urgent: [false],
  });

  readonly selectedFilter: FormControl<FlightFilter | null> =
    this.fb.control(null);

  private readonly filtersStateActionsSubj$ = new Subject<
    Action<FlightFilter>
  >();

  private readonly filtersState$: Observable<LocalState> =
    this.filtersStateActionsSubj$
      .asObservable()
      .pipe(
        scan(this.filterStateReducer, new LocalState()),
        takeUntil(this.destroy$)
      );

  // allows to skip pushing the Search button triggering flight search on filter change automatically
  private readonly filterSelectedEffect$ =
    this.selectedFilter.valueChanges.pipe(
      filter(Boolean),
      tap((filter: FlightFilter) => {
        this.filtersStateActionsSubj$.next({
          type: SearchFlightActions.FilterSelected,
          payload: filter,
        });
      }),
      takeUntil(this.destroy$)
    );

  public readonly selectFilters$ = this.filtersState$.pipe(
    map((state) => state.filters)
  );

  private readonly selectSelectedFilter$ = this.filtersState$.pipe(
    map((state) => state.selectedFilter)
  );

  // bonus task #1
  private readonly updateFilterForm$ = this.selectSelectedFilter$.pipe(
    filter(Boolean),
    tap((filter: FlightFilter) => this.filterForm.patchValue(filter)),
    takeUntil(this.destroy$)
  );

  // bonus task #2
  private readonly updateSelectedFilter$ = this.selectSelectedFilter$.pipe(
    filter(Boolean),
    tap((filter: FlightFilter) => {
      this.selectedFilter.patchValue(filter, {
        emitEvent: false,
      });
    }),
    tap((flight) => this.searchTrigger.emit(flight)),
    takeUntil(this.destroy$)
  );

  constructor(private readonly fb: NonNullableFormBuilder) {}

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
  }

  private filterStateReducer(
    state: LocalState,
    action: Action<FlightFilter>
  ): LocalState {
    switch (action.type) {
      case SearchFlightActions.FlightSearched:
        return {
          ...state,
          selectedFilter: action.payload,
          // unoptimal, but for demo purposes... (bonus task #3)
          filters: state.filters.some(
            (filter) =>
              filter.from === action.payload.from &&
              filter.to === action.payload.to
          )
            ? state.filters
            : [...state.filters, action.payload],
        };
      case SearchFlightActions.FilterSelected:
        return {
          ...state,
          selectedFilter: action.payload,
        };
      default:
        return state;
    }
  }

  private initListeners(): void {
    this.updateFilterForm$.subscribe();
    this.updateSelectedFilter$.subscribe();
    this.filterSelectedEffect$.subscribe();
  }

  private releaseResources(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
