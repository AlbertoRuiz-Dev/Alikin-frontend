import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, Data } from '@angular/router';
import { Subject, of } from 'rxjs';
import { filter, map, switchMap, takeUntil, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public isFeedRouteActive = false;
  public isCommunitiesViewActive = false;
  public isCommunityDetailViewActive = false;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      filter(route => !!route),
      switchMap(route => route.data ? route.data : of({})),
      takeUntil(this.destroy$)
    ).subscribe((data: Data) => {
      this.updateActiveRouteFlags(data);
    });

    let currentRoute = this.activatedRoute;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    if (currentRoute.snapshot && currentRoute.snapshot.data) {
      this.updateActiveRouteFlags(currentRoute.snapshot.data);
    }
  }

  private updateActiveRouteFlags(data: Data): void {
    this.isFeedRouteActive = data && data['pageType'] === 'feed';
    this.isCommunitiesViewActive = data && data['pageType'] === 'communities';
    this.isCommunityDetailViewActive = data && data['pageType'] === 'communityDetail';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
