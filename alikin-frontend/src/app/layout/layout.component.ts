import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import {startWith, Subject} from 'rxjs';
import { filter, map, mergeMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-layout', // Asumo que este es el selector de tu LayoutComponent
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isCommunitiesViewActive = false;
  // Podrías añadir más flags para otras vistas especiales si es necesario
  //مثال: isUserProfileViewActive = false;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    // --- COMIENZO DE LA MODIFICACIÓN IMPORTANTE ---
    // Escucha los eventos de navegación, pero también procesa la ruta actual inmediatamente.
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      // Usamos startWith para emitir un valor inicial (puede ser el evento actual o un valor nulo)
      // para que el stream se active inmediatamente en la carga.
      // El valor exacto de startWith no es crítico aquí, ya que nos basamos en activatedRoute.
      startWith(null), // Emite inmediatamente para procesar la ruta actual
      map(() => {
        // Navega hasta la ruta hija más profunda para obtener sus datos
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      // Combina la información de la ruta síncrona (snapshot) y la asíncrona (data observable)
      // Damos prioridad al snapshot para la carga inicial.
      // Nota: El observable `data` de la ruta ya contiene la información más actualizada post-resolver.
      mergeMap(route => route.data),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.isCommunitiesViewActive = data && data['pageType'] === 'communities';
      // console.log('Page Type:', data ? data['pageType'] : 'N/A', 'isCommunitiesViewActive:', this.isCommunitiesViewActive);
    });

    // Intento de establecer el estado inicial basado en el snapshot de la ruta actual.
    // Esto es útil para el primer renderizado en una recarga.
    let currentRoute = this.activatedRoute;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    if (currentRoute.snapshot && currentRoute.snapshot.data) {
      const initialData = currentRoute.snapshot.data;
      this.isCommunitiesViewActive = initialData && initialData['pageType'] === 'communities';
      // console.log('Initial Snapshot Page Type:', initialData ? initialData['pageType'] : 'N/A', 'isCommunitiesViewActive on Init:', this.isCommunitiesViewActive);
    }
    // --- FIN DE LA MODIFICACIÓN IMPORTANTE ---
  }


  // Método para obtener las clases para el área del feed
  getFeedAreaClasses(): object {
    return {
      'feed-area': true,
      'communities-layout-active': this.isCommunitiesViewActive
      // 'user-profile-layout-active': this.isUserProfileViewActive
    };
  }

  // Método para obtener las clases para el wrapper del feed
  getFeedWrapperClasses(): object {
    return {
      'feed-wrapper': true,
      'communities-wrapper-active': this.isCommunitiesViewActive
      // 'user-profile-wrapper-active': this.isUserProfileViewActive
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
