// En LayoutComponent.ts

import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
// Asegúrate de importar Scroll si vas a usar instanceof Scroll
import { Router, NavigationEnd, Event as RouterEvent, ActivatedRouteSnapshot, Scroll } from '@angular/router';
import { filter, takeUntil, tap, map } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FeedControlService } from './feed-control.services'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  isFeedRouteActive = false;
  private destroy$ = new Subject<void>();

  isFeedLoading: boolean = false;
  feedHasMorePosts: boolean = true;

  constructor(
    private router: Router,
    private feedControlService: FeedControlService,
    private cdr: ChangeDetectorRef
  ) {}

  private getRouteData(route: ActivatedRouteSnapshot): any {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data;
  }

  ngOnInit(): void {
    console.log('LayoutComponent: ngOnInit - INICIADO. Valor inicial de isFeedRouteActive:', this.isFeedRouteActive);

    this.router.events.pipe(
      tap(event => console.log('[DEBUG] LayoutComponent: Router Event Received (RAW):', event)),
      // AJUSTE DEL FILTRO:
      filter((event: RouterEvent): event is NavigationEnd =>
        event instanceof NavigationEnd || (event instanceof Scroll && event.routerEvent instanceof NavigationEnd)
      ),
      map((event: RouterEvent) => { // Ahora event puede ser NavigationEnd o Scroll
        // Extraemos el NavigationEnd real
        const navigationEndEvent = (event instanceof Scroll) ? event.routerEvent : event;
        return navigationEndEvent as NavigationEnd; // Hacemos un type assertion
      }),
      tap(event => console.log('[DEBUG] LayoutComponent: NavigationEnd Event (PASÓ EL FILTRO Y MAP):', event)),
      map((event: NavigationEnd) => {
        const currentRouteData = this.getRouteData(this.router.routerState.snapshot.root);
        const newIsFeedActive = currentRouteData?.pageType === 'feed';
        console.log('[DEBUG] LayoutComponent: Dentro de map - currentRouteData:', currentRouteData, 'newIsFeedActive:', newIsFeedActive);
        return newIsFeedActive;
      }),
      takeUntil(this.destroy$)
    ).subscribe((calculatedIsFeedActive: boolean) => {
      console.log('[DEBUG] LayoutComponent: Entrando al SUBSCRIBE con calculatedIsFeedActive:', calculatedIsFeedActive);

      if (this.isFeedRouteActive !== calculatedIsFeedActive) {
        this.isFeedRouteActive = calculatedIsFeedActive;
        console.log(
          '%cLayoutComponent: VALOR FINAL ACTUALIZADO', 'color: green; font-weight: bold;',
          { isFeedRouteActive: this.isFeedRouteActive }
        );
        this.cdr.detectChanges();
      } else {
        console.log(
          '%cLayoutComponent: Valor de isFeedRouteActive NO cambió (ya era ' + this.isFeedRouteActive + ')', 'color: orange;'
        );
        // Si no cambió pero queremos asegurar que detectChanges se llame si es la primera vez y es true:
        if(this.isFeedRouteActive && calculatedIsFeedActive) { // Si es true y no cambió, igual puede ser necesario
          // this.cdr.detectChanges(); // Descomentar si aún hay problemas de ExpressionChanged
        }
      }

      if (!this.isFeedRouteActive) {
        this.feedControlService.setLoading(false);
        this.feedControlService.setHasMore(true);
      }
    });

    // Suscripciones al FeedControlService
    this.feedControlService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        if (this.isFeedLoading !== loading) {
          this.isFeedLoading = loading;
          this.cdr.detectChanges();
        }
      });

    this.feedControlService.hasMorePosts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasMore => {
        if (this.feedHasMorePosts !== hasMore) {
          this.feedHasMorePosts = hasMore;
          this.cdr.detectChanges();
        }
      });
  }

  onFeedAreaScrolled(): void {
    console.log('LayoutComponent: onFeedAreaScrolled ¡EVENTO DISPARADO!');
    if (this.isFeedRouteActive && !this.isFeedLoading && this.feedHasMorePosts) {
      console.log('LayoutComponent: Ruta de feed activa, solicitando más posts...');
      this.feedControlService.requestLoadMore();
    } else {
      console.log('[DEBUG] LayoutComponent: Scroll NO solicita más posts.',
        { isFeedRouteActive: this.isFeedRouteActive, isFeedLoading: this.isFeedLoading, feedHasMorePosts: this.feedHasMorePosts }
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
